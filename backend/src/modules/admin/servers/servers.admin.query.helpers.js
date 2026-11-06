const User = require('../../../models/User');
const { isValidPublicId } = require('../../../utils/publicId');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildServerSearchClauses = async (search) => {
  if (!search || typeof search !== 'string') return null;
  const trimmed = search.trim();
  if (!trimmed) return null;
  const escaped = escapeRegex(trimmed);

  const userQuery = {
    $or: [{ email: { $regex: escaped, $options: 'i' } }],
  };
  if (isValidPublicId(trimmed, 'user')) {
    userQuery.$or.push({ publicId: trimmed });
  }

  const matchingUsers = await User.find(userQuery).select('_id').lean();
  const userIds = matchingUsers.map((u) => u._id);

  const orClauses = [{ name: { $regex: escaped, $options: 'i' } }];

  if (userIds.length > 0) {
    orClauses.push({ owner: { $in: userIds } });
  }

  if (!isNaN(trimmed) && trimmed !== '') {
    orClauses.push({ panelServerId: Number(trimmed) });
  }

  if (isValidPublicId(trimmed, 'server')) {
    orClauses.push({ publicId: trimmed });
  }

  return orClauses;
};

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
