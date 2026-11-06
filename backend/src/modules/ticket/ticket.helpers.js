const Ticket = require('../../models/Ticket');
const Server = require('../../models/Server');
const Payment = require('../../models/Payment');
const { getSettings } = require('../../lib/settings');
const avatarService = require('../../services/avatarService');

const { buildIdFilter } = require('../../utils/publicId');
const User = require('../../models/User');

async function getActiveTicketsCount(userId) {
  const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
  if (!user) return 0;
  const uid = user._id;
  return Ticket.countDocuments({
    user: uid,
    status: { $in: ['open', 'pending'] },
    deletedByUser: { $ne: true }
  });
}

async function getTicketCategories() {
  let allowedCategories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
  try {
    const s = await getSettings();
    if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0) {
      allowedCategories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
    }
  } catch (_settingsError) {
    allowedCategories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
  }
  return allowedCategories;
}

async function getUserTicketCounts(userId) {
  const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
  if (!user) return { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
  const uid = user._id;
  const agg = await Ticket.aggregate([
    { $match: { user: uid, deletedByUser: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const counts = { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
  for (const row of agg) {
    if (counts[row._id] !== undefined) {
      counts[row._id] = row.count;
      counts.all += row.count;
    }
  }
  return counts;
}

async function getMentions(userId) {
  const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
  if (!user) return { servers: [], payments: [] };
  const uid = user._id;
  const [servers, payments] = await Promise.all([
    Server.find({ owner: uid }).select('publicId name identifier').limit(5).lean(),
    Payment.find({ userId: uid, status: 'COMPLETED' }).select('publicId amount createdAt').sort({ createdAt: -1 }).limit(5).lean()
  ]);
  return {
    servers: servers.map((s) => ({ id: s.publicId, name: s.name, identifier: s.identifier })),
    payments: payments.map((p) => ({ id: p.publicId, amount: p.amount, createdAt: p.createdAt })),
  };
}

function formatTicketMessage(m, publicTicketId, isAdmin) {
  const publicMsgId = m.publicId;
  let author = m.author;
  if (author && typeof author === 'object') {
    const authorPublicId = author.publicId;
    const profilePicture = avatarService.resolveAvatar(author);
    const { _id: _aid, publicId: _apid, ...rawAuthor } = author;
    if (!isAdmin && m.authorRole === 'admin') {
      const { email: _email, ...safeAuthor } = rawAuthor;
      author = { ...safeAuthor, id: authorPublicId, profilePicture };
    } else {
      author = { ...rawAuthor, id: authorPublicId, profilePicture };
    }
  }
  const { _id: _dbId, __v: _version, publicId: _pid, ...msgData } = m;
  return {
    ...msgData,
    id: publicMsgId,
    ticket: publicTicketId,
    author,
  };
}

module.exports = {
  getActiveTicketsCount,
  getTicketCategories,
  getUserTicketCounts,
  getMentions,
  formatTicketMessage,
};
