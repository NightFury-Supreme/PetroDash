const Payment = require('../../../models/Payment');
const User = require('../../../models/User');
const UserPlan = require('../../../models/UserPlan');
const { getCache, setCache, deleteCache, deleteCachePattern, acquireLock, releaseLock } = require('../../../lib/redis');
const { invalidateUserCaches, invalidateUserPaymentsCaches } = require('../../../utils/userCacheInvalidation');
const AppError = require('../../../utils/AppError');
const axios = require('axios');
const { getAccessToken } = require('../../../lib/paypal');
const { getSettings } = require('../../../lib/settings');
const { generateInvoicePdfBuffer } = require('../../../lib/invoicePdf');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');

exports.getLedger = async ({ status, provider, userId, search, sort, page = '1', limit = '10' }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const q = {};
    if (status) {
        q.status = { $eq: status.toUpperCase() };
    }
    if (provider) {
        q.provider = { $eq: provider.toLowerCase() };
    }

    const searchTerm = search || userId;
    if (searchTerm) {
        const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const matchedUsers = await User.find(
            { $or: [{ username: searchRegex }, { email: searchRegex }, { publicId: searchTerm }] },
            { _id: 1 }
        ).lean();
        const matchedUserIds = matchedUsers.map(u => u._id);

        const orConditions = [
            { providerOrderId: searchRegex },
            { publicId: searchTerm },
            { 'meta.userSnapshot.username': searchRegex },
            { 'meta.userSnapshot.email': searchRegex },
            { 'meta.userSnapshot.publicId': searchTerm },
        ];
        if (matchedUserIds.length > 0) {
            orConditions.push({ userId: { $in: matchedUserIds } });
        }
        q.$or = orConditions;
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'createdAt') sortObj = { createdAt: 1 };
    else if (sort === '-createdAt') sortObj = { createdAt: -1 };
    else if (sort === 'amount') sortObj = { amount: 1 };
    else if (sort === '-amount') sortObj = { amount: -1 };

    const cacheKey = `admin:ledger:${status || ''}:${provider || ''}:${searchTerm || ''}:${sort || ''}:${pageNum}:${limitNum}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const total = await Payment.countDocuments(q);
    const list = await Payment.find(q)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', 'username email profilePicture oauthProviders publicId')
        .populate('planId', 'name publicId')
        .lean();

    const formattedPayments = list.map((p) => {
        const clean = formatPublicEntity(p, 'payment');
        if (p.userId && typeof p.userId === 'object') {
            clean.userId = formatPublicEntity(p.userId, 'user');
        } else if (p.meta?.userSnapshot) {
            clean.userId = {
                id: p.meta.userSnapshot.publicId || '',
                username: p.meta.userSnapshot.username || 'Deleted User',
                email: p.meta.userSnapshot.email || '',
                firstName: p.meta.userSnapshot.firstName || '',
                lastName: p.meta.userSnapshot.lastName || '',
                isDeleted: true,
            };
        } else {
            clean.userId = null;
        }
        if (p.planId && typeof p.planId === 'object') {
            clean.planId = formatPublicEntity(p.planId, 'plan');
        }
        return clean;
    });

    const result = {
        payments: formattedPayments,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
    };

    await setCache(cacheKey, result, 30);
    return result;
};

exports.updatePayment = async (id, data) => {
    const lockKey = `payment:lock:${id}`;
    const lockToken = await acquireLock(lockKey, 3000);
    if (!lockToken) {
        throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
    }

    try {
        const { status, amount, currency } = data;
        const p = await Payment.findOne(buildIdFilter(id)).populate('userId', 'publicId');
        if (!p) throw AppError.notFound('Payment not found', 'ERR_PAYMENT_NOT_FOUND');

        const originalPayment = p.toObject();

        if (status !== undefined) p.status = status;
        if (amount !== undefined) p.amount = amount;
        if (currency !== undefined) p.currency = currency;

        await p.save();
        await deleteCachePattern('admin:ledger:*');
        const targetUserPubId = p.userId?.publicId || (typeof p.userId === 'string' ? p.userId : null);
        if (targetUserPubId) {
            await Promise.all([
                deleteCache(`payments:mine:${targetUserPubId}`),
                deleteCache(`payments:mine:${targetUserPubId}:all`),
                deleteCache(`payments:mine:${targetUserPubId}:p1:s20`),
            ]);
        }

        const changes = {};
        if (status !== undefined && originalPayment.status !== status) changes.status = { old: originalPayment.status, new: status };
        if (amount !== undefined && originalPayment.amount !== amount) changes.amount = { old: originalPayment.amount, new: amount };
        if (currency !== undefined && originalPayment.currency !== currency) changes.currency = { old: originalPayment.currency, new: currency };

        return { p: formatPublicEntity(p.toObject(), 'payment'), changes };
    } finally {
        await releaseLock(lockKey, lockToken);
    }
};

exports.getInvoice = async (id, frontendHost, protocol) => {
    const idFilter = buildIdFilter(id);
    const p = await Payment.findOne({ ...idFilter, status: { $in: ['COMPLETED', 'completed', 'PAID', 'paid'] } })
        .populate('planId')
        .populate('userId')
        .lean()
        || await Payment.findOne(idFilter)
            .populate('planId')
            .populate('userId')
            .lean();
    if (!p) throw AppError.notFound('Invoice not found', 'ERR_INVOICE_NOT_FOUND');

    const plan = p.planId || null;
    let user = p.userId || null;
    if (!user && p.meta?.userSnapshot) {
        user = p.meta.userSnapshot;
    }

    const settings = await getSettings();
    const pdfBuffer = await generateInvoicePdfBuffer(p, plan, user || {}, settings, frontendHost, protocol);

    return { pdfBuffer, p: formatPublicEntity(p, 'payment') };
};

exports.refundPayment = async (id) => {
    const lockKey = `payment:lock:${id}`;
    const lockToken = await acquireLock(lockKey, 5000);
    if (!lockToken) {
        throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
    }

    try {
        const p = await Payment.findOne(buildIdFilter(id))
            .populate('planId')
            .populate('userId');
        if (!p) throw AppError.notFound('Payment not found', 'ERR_PAYMENT_NOT_FOUND');
        if (p.provider !== 'paypal') throw AppError.badRequest('Only PayPal supported', 'ERR_PAYMENT_PROVIDER_UNSUPPORTED');

        const { token, baseUrl } = await getAccessToken();
        const captureId = p.providerCaptureId;
        if (!captureId) throw AppError.badRequest('No capture id to refund', 'ERR_PAYMENT_CAPTURE_MISSING');

        await axios.post(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {}, { headers: { Authorization: `Bearer ${token}` } });

        const changes = { status: { old: p.status, new: 'REFUNDED' } };

        if (p.status === 'COMPLETED') {
            const plan = p.planId;
            const user = p.userId;
            if (plan && user) {
                if (plan.type === 'coins') {
                    const coinAmount = Number(plan.coinsAmount) || 0;
                    if (coinAmount > 0) {
                        changes.coins = { old: user.coins, new: Math.max(0, user.coins - coinAmount) };
                        await User.findByIdAndUpdate(user._id, { coins: changes.coins.new });
                    }
                } else {
                    const pc = plan.productContent || {};
                    const rr = pc.recurrentResources || {};
                    const decQuery = {
                        coins: -(Number(pc.coins || 0)),
                        diskMb: -(Number(rr.diskMb || 0)),
                        memoryMb: -(Number(rr.memoryMb || 0)),
                        cpuPercent: -(Number(rr.cpuPercent || 0)),
                        backups: -(Number(pc.backups || 0)),
                        databases: -(Number(pc.databases || 0)),
                        allocations: -(Number(pc.additionalAllocations || 0)),
                        serverSlots: -(Number(pc.serverLimit || 0)),
                    };

                    const updatePayload = { $set: {} };
                    Object.keys(decQuery).forEach(k => {
                        if (decQuery[k] !== 0) {
                            const uR = user.resources || {};
                            const oldVal = k === 'coins' ? user.coins : (uR[k] || 0);
                            const newVal = Math.max(0, oldVal + decQuery[k]);
                            const dbKey = k === 'coins' ? 'coins' : `resources.${k}`;

                            changes[dbKey] = { old: oldVal, new: newVal };
                            updatePayload.$set[dbKey] = newVal;
                        }
                    });

                    if (Object.keys(updatePayload.$set).length > 0) {
                        await User.findByIdAndUpdate(p.userId, updatePayload);
                    }
                }
            }

            await UserPlan.findOneAndUpdate(
                { userId: p.userId, planId: p.planId, amount: p.amount, status: 'active' },
                { status: 'cancelled' },
                { sort: { purchaseDate: -1 } }
            );
        }

        p.status = 'REFUNDED';
        await p.save();
        const refundUserPubId = p.userId?.publicId || (typeof p.userId === 'string' ? p.userId : null);
        const refundOps = [deleteCachePattern('admin:ledger:*')];
        if (refundUserPubId) {
            refundOps.push(
                invalidateUserCaches(refundUserPubId),
                invalidateUserPaymentsCaches(refundUserPubId)
            );
        }
        await Promise.allSettled(refundOps);

        return { p: formatPublicEntity(p.toObject(), 'payment'), changes };
    } finally {
        await releaseLock(lockKey, lockToken);
    }
};

exports.voidPayment = async (id) => {
    const lockKey = `payment:lock:${id}`;
    const lockToken = await acquireLock(lockKey, 3000);
    if (!lockToken) {
        throw AppError.conflict('ERR_OPERATION_IN_PROGRESS');
    }

    try {
        const p = await Payment.findOne(buildIdFilter(id)).populate('userId', 'publicId');
        if (!p) throw AppError.notFound('Payment not found', 'ERR_PAYMENT_NOT_FOUND');
        if (p.provider !== 'paypal') throw AppError.badRequest('Only PayPal supported', 'ERR_PAYMENT_PROVIDER_UNSUPPORTED');
        if (p.status === 'COMPLETED') throw AppError.badRequest('Use refund for completed payments', 'ERR_PAYMENT_VOID_COMPLETED');

        const changes = { status: { old: p.status, new: 'VOIDED' } };
        p.status = 'VOIDED';
        await p.save();
        const voidUserPubId = p.userId?.publicId || (typeof p.userId === 'string' ? p.userId : null);
        const voidOps = [deleteCachePattern('admin:ledger:*')];
        if (voidUserPubId) {
            voidOps.push(
                invalidateUserCaches(voidUserPubId),
                invalidateUserPaymentsCaches(voidUserPubId),
            );
        }
        await Promise.allSettled(voidOps);

        return { p: formatPublicEntity(p.toObject(), 'payment'), changes };
    } finally {
        await releaseLock(lockKey, lockToken);
    }
};
