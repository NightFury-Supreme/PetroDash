const Payment = require('../../../models/Payment');
const User = require('../../../models/User');
const Plan = require('../../../models/Plan');
const UserPlan = require('../../../models/UserPlan');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const axios = require('axios');
const { getAccessToken } = require('../../../lib/paypal');
const { getSettings } = require('../../../lib/settings');
const { generateInvoicePdfBuffer } = require('../../../lib/invoicePdf');

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
        const searchRegex = new RegExp(searchTerm, 'i');
        const matchedUsers = await User.find({ $or: [{ username: searchRegex }, { email: searchRegex }] }, { _id: 1 }).lean();
        const matchedUserIds = matchedUsers.map(u => u._id);
        
        const orConditions = [
            { providerOrderId: searchRegex }
        ];
        if (/^[0-9a-fA-F]{24}$/.test(searchTerm)) {
            orConditions.push({ _id: searchTerm });
            orConditions.push({ userId: searchTerm });
        }
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
        .populate('userId', 'username email profilePicture oauthProviders')
        .populate('planId', 'name')
        .lean();
        
    const result = {
        payments: list,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
    };

    await setCache(cacheKey, result, 30);
    return result;
};

exports.updatePayment = async (id, data) => {
    const { status, amount, currency } = data;
    const p = await Payment.findById(id);
    if (!p) throw new AppError('Payment not found', 404, 'ERR_NOT_FOUND');
    
    const originalPayment = p.toObject();

    if (status !== undefined) p.status = status;
    if (amount !== undefined) p.amount = amount;
    if (currency !== undefined) p.currency = currency;
    
    await p.save();
    await deleteCachePattern('admin:ledger');

    const changes = {};
    if (status !== undefined && originalPayment.status !== status) changes.status = { old: originalPayment.status, new: status };
    if (amount !== undefined && originalPayment.amount !== amount) changes.amount = { old: originalPayment.amount, new: amount };
    if (currency !== undefined && originalPayment.currency !== currency) changes.currency = { old: originalPayment.currency, new: currency };

    return { p, changes };
};

exports.getInvoice = async (id, frontendHost, protocol) => {
    const p = await Payment.findOne({ _id: id, status: 'completed' }).lean() 
            || await Payment.findOne({ _id: id, status: 'COMPLETED' }).lean();
    if (!p) throw new AppError('Invoice not found or not completed', 404, 'ERR_NOT_FOUND');
    
    const plan = await Plan.findById(p.planId).lean();
    const user = await User.findById(p.userId).lean();
    if (!user) throw new AppError('User not found', 404, 'ERR_NOT_FOUND');

    const settings = await getSettings();
    const pdfBuffer = await generateInvoicePdfBuffer(p, plan, user, settings, frontendHost, protocol);
    
    return { pdfBuffer, p };
};

exports.refundPayment = async (id) => {
    const p = await Payment.findById(id);
    if (!p) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');
    if (p.provider !== 'paypal') throw new AppError('Only PayPal supported', 400, 'ERR_BAD_REQUEST');
    
    const { token, baseUrl } = await getAccessToken();
    const captureId = p.providerCaptureId;
    if (!captureId) throw new AppError('No capture id to refund', 400, 'ERR_BAD_REQUEST');
    
    await axios.post(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {}, { headers: { Authorization: `Bearer ${token}` } });
    
    const changes = { status: { old: p.status, new: 'REFUNDED' } };
    
    if (p.status === 'COMPLETED') {
        const plan = await Plan.findById(p.planId);
        const user = await User.findById(p.userId);
        if (plan && user) {
            if (plan.type === 'coins') {
                const coinAmount = Number(plan.coinsAmount) || 0;
                if (coinAmount > 0) {
                    changes.coins = { old: user.coins, new: Math.max(0, user.coins - coinAmount) };
                    await User.findByIdAndUpdate(p.userId, { coins: changes.coins.new });
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
                
                let updatePayload = { $inc: {} };
                Object.keys(decQuery).forEach(k => { 
                    if (decQuery[k] !== 0) {
                        const uR = user.resources || {};
                        const oldVal = k === 'coins' ? user.coins : (uR[k] || 0);
                        const newVal = Math.max(0, oldVal + decQuery[k]);
                        const dbKey = k === 'coins' ? 'coins' : `resources.${k}`;
                        
                        changes[dbKey] = { old: oldVal, new: newVal };
                        
                        if (!updatePayload.$set) updatePayload.$set = {};
                        updatePayload.$set[dbKey] = newVal;
                    }
                });
                
                if (updatePayload.$set) {
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
    await deleteCachePattern('admin:ledger');

    return { p, changes };
};

exports.voidPayment = async (id) => {
    const p = await Payment.findById(id);
    if (!p) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');
    if (p.provider !== 'paypal') throw new AppError('Only PayPal supported', 400, 'ERR_BAD_REQUEST');
    if (p.status === 'COMPLETED') throw new AppError('Use refund for completed payments', 400, 'ERR_BAD_REQUEST');
    
    const changes = { status: { old: p.status, new: 'VOIDED' } };
    p.status = 'VOIDED';
    await p.save();
    await deleteCachePattern('admin:ledger');

    return { p, changes };
};
