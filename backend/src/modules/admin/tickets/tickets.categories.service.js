const Ticket = require('../../../models/Ticket');
const Settings = require('../../../models/Settings');
const { getSettings, clearSettingsCache } = require('../../../lib/settings');
const { getOrSetCache, acquireLock, releaseLock, deleteCache } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');

const getCategories = async () => {
  const s = await getSettings();
  const categories = s && Array.isArray(s.ticketCategories) ? s.ticketCategories : [];
  return { categories };
};

const getCategoryUsage = async () => {
  return getOrSetCache(
    'tickets:admin:categories:usage',
    async () => {
      const agg = await Ticket.aggregate([
        { $match: { category: { $type: 'string', $gt: '' }, deletedByUser: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      const usage = {};
      for (const row of agg) usage[row._id] = row.count;
      return { usage };
    },
    60
  );
};

const updateCategories = async (categoriesInput, req) => {
  let categories = categoriesInput;
  if (!Array.isArray(categories)) {
    throw AppError.badRequest('categories must be an array of strings', 'ERR_INVALID_CATEGORIES');
  }

  const lockKey = 'tickets:categories:lock';
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) {
    throw AppError.tooManyRequests('Category update in progress, please wait', 'ERR_TICKET_RATE_LIMIT');
  }

  try {
    categories = categories
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter((c) => c)
      .map((c) => c.slice(0, 50));

    if (categories.length === 0) categories = ['general'];
    const newSet = Array.from(new Set(categories));

    const existingSettings = await Settings.findOne({}).select('ticketCategories');
    const current = existingSettings && Array.isArray(existingSettings.ticketCategories)
      ? existingSettings.ticketCategories
      : [];

    const toRemove = current.filter((c) => !newSet.includes(c));
    if (toRemove.length > 0) {
      const inUse = await Ticket.distinct('category', { category: { $in: toRemove } });
      if (inUse.length > 0) {
        throw AppError.badRequest('Cannot remove categories that are in use', 'ERR_CATEGORY_IN_USE');
      }
    }

    let s = existingSettings;
    if (!s) s = await Settings.create({});

    const oldCategories = s.ticketCategories || [];
    s.ticketCategories = newSet;
    await s.save();
    await clearSettingsCache();

    await Promise.all([
      deleteCache('tickets:admin:list::::::newest:1:10'),
      deleteCache('tickets:admin:list::::::newest:1:20'),
      deleteCache('tickets:admin:list::::::newest:1:50'),
      deleteCache('tickets:admin:list::open::::newest:1:10'),
      deleteCache('tickets:admin:list::in_progress::::newest:1:10'),
      deleteCache('tickets:admin:list::closed::::newest:1:10'),
      deleteCache('tickets:admin:counts:all'),
      deleteCache('tickets:categories'),
      deleteCache('tickets:admin:categories:usage'),
    ]);

    if (JSON.stringify(oldCategories) !== JSON.stringify(newSet)) {
      await writeAudit(req, 'admin.settings.tickets.update', 'settings', 'tickets', {
        changes: { ticketCategories: { old: oldCategories, new: newSet } },
      });
    }

    return { ok: true, categories: s.ticketCategories };
  } finally {
    if (lockToken) {
      await releaseLock(lockKey, lockToken);
    }
  }
};

module.exports = {
  getCategories,
  getCategoryUsage,
  updateCategories,
};
