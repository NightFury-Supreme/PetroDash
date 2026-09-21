/* ==========================================================================
   Admin Servers Query Helper Functions
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

const mongoose = require('mongoose');
const User = require('../../../models/User');

/**
 * Builds MongoDB $or clauses for fuzzy and exact server search
 * @param {string} search
 * @returns {Promise<Array<object>|null>}
 */
const buildServerSearchClauses = async (search) => {
  if (!search || typeof search !== 'string') return null;
  const trimmed = search.trim();
  if (!trimmed) return null;

  const matchingUsers = await User.find({ email: { $regex: trimmed, $options: 'i' } })
    .select('_id')
    .lean();
  const userIds = matchingUsers.map((u) => u._id);

  let isObjectId = false;
  try {
    if (mongoose.Types.ObjectId.isValid(trimmed)) isObjectId = true;
  } catch (_err) {
    isObjectId = false;
  }

  const orClauses = [{ name: { $regex: trimmed, $options: 'i' } }];

  if (userIds.length > 0) {
    orClauses.push({ owner: { $in: userIds } });
  }

  if (!isNaN(trimmed) && trimmed !== '') {
    orClauses.push({ panelServerId: Number(trimmed) });
  }

  if (isObjectId) {
    orClauses.push({ _id: trimmed });
  }

  return orClauses;
};

/**
 * Resolves sorting object based on query key
 * @param {string} sortKey
 * @param {boolean} isQueue
 * @returns {object}
 */
const buildServerSort = (sortKey, isQueue = false) => {
  if (isQueue) {
    switch (sortKey) {
      case 'name_asc': return { name: 1 };
      case 'name_desc': return { name: -1 };
      case 'cpu_desc': return { 'limits.cpuPercent': -1 };
      case 'memory_desc': return { 'limits.memoryMb': -1 };
      case 'disk_desc': return { 'limits.diskMb': -1 };
      case 'created_desc': return { priority: -1, createdAt: -1 };
      case 'created_asc': return { priority: -1, createdAt: 1 };
      default: return { priority: -1, createdAt: 1 };
    }
  }

  switch (sortKey) {
    case 'name_asc': return { name: 1 };
    case 'name_desc': return { name: -1 };
    case 'cpu_desc': return { 'limits.cpuPercent': -1 };
    case 'memory_desc': return { 'limits.memoryMb': -1 };
    case 'disk_desc': return { 'limits.diskMb': -1 };
    case 'created_desc': return { createdAt: -1 };
    case 'created_asc': return { createdAt: 1 };
    default: return { createdAt: -1 };
  }
};

module.exports = {
  buildServerSearchClauses,
  buildServerSort,
};
