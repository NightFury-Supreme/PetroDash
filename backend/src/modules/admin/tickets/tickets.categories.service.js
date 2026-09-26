/**
 * Admin Tickets Categories Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const Ticket = require('../../../models/Ticket');
const Settings = require('../../../models/Settings');
const { getSettings, clearSettingsCache } = require('../../../lib/settings');
const { deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');

const getCategories = async () => {
  const s = await getSettings();
  const categories = s && Array.isArray(s.ticketCategories) ? s.ticketCategories : [];
  return { categories };
};

const getCategoryUsage = async () => {
  const agg = await Ticket.aggregate([
    { $match: { category: { $type: 'string', $gt: '' }, deletedByUser: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const usage = {};
  for (const row of agg) usage[row._id] = row.count;
  return { usage };
};

const updateCategories = async (categoriesInput, req) => {
  let categories = categoriesInput;
  if (!Array.isArray(categories)) {
    throw AppError.badRequest('categories must be an array of strings', 'ERR_INVALID_CATEGORIES');
  }

  categories = categories
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter((c) => c)
    .map((c) => c.slice(0, 50));

  if (categories.length === 0) categories = ['general'];
  const newSet = Array.from(new Set(categories));

  const existingSettings = await Settings.findOne({});
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
  clearSettingsCache();

  await deleteCachePattern('tickets:admin:list:*');
  await deleteCachePattern('tickets:admin:counts:*');

  if (JSON.stringify(oldCategories) !== JSON.stringify(newSet)) {
    await writeAudit(req, 'admin.settings.tickets.update', 'settings', s._id.toString(), {
      changes: { ticketCategories: { old: oldCategories, new: newSet } },
    });
    await logUserActivity(req, 'admin.settings.tickets.update', {
      ticketCategories: newSet,
    });
  }

  return { ok: true, categories: s.ticketCategories };
};

module.exports = {
  getCategories,
  getCategoryUsage,
  updateCategories,
};
