const Location = require('../../../models/Location');
const Plan = require('../../../models/Plan');
const Server = require('../../../models/Server');
const AppError = require('../../../utils/AppError');
const { deleteCache, getOrSetCache, acquireLock, releaseLock } = require('../../../lib/redis');
const { buildIdFilter, formatPublicEntity, isValidPublicId } = require('../../../utils/publicId');

const ADMIN_LOCATIONS_CACHE_KEY = 'admin:locations';
const API_LOCATIONS_CACHE_KEY = 'api:locations';
const CACHE_TTL_SECONDS = 30;

async function clearLocationCaches(publicId = null) {
  const ops = [
    deleteCache(ADMIN_LOCATIONS_CACHE_KEY),
    deleteCache(API_LOCATIONS_CACHE_KEY),
  ];
  if (publicId) ops.push(deleteCache(`admin:location:${publicId}`));
  await Promise.all(ops);
}

async function getLocations() {
  return getOrSetCache(ADMIN_LOCATIONS_CACHE_KEY, async () => {
    const allPlans = await Plan.find({}, 'publicId name').lean();
    const planNameMap = new Map(allPlans.map((p) => [p.publicId, p.name]));

    const mappedItems = await Location.aggregate([
      {
        $lookup: {
          from: 'servers',
          localField: '_id',
          foreignField: 'locationId',
          as: 'servers',
        },
      },
      {
        $addFields: {
          serversCount: { $size: '$servers' },
        },
      },
      {
        $project: {
          servers: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return mappedItems.map((loc) => {
      const allowedPlanNames = (loc.allowedPlans || [])
        .map((ap) => planNameMap.get(ap))
        .filter(Boolean);
      const allowedPlanIds = (loc.allowedPlans || [])
        .filter((ap) => isValidPublicId(ap, 'plan'));
      return formatPublicEntity({
        ...loc,
        allowedPlans: allowedPlanIds,
        allowedPlanNames: [...new Set(allowedPlanNames)],
      }, 'location');
    });
  }, CACHE_TTL_SECONDS);
}

async function createLocation(data) {
  const lockKey = 'lock:location:create';
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent location operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const created = await Location.create(data);
    await clearLocationCaches();
    return formatPublicEntity(created.toObject(), 'location');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getLocationById(id) {
  return getOrSetCache(`admin:location:${id}`, async () => {
    const loc = await Location.findOne(buildIdFilter(id)).lean();
    if (!loc) {
      throw AppError.notFound('Location not found', 'ERR_LOCATION_NOT_FOUND');
    }
    const serversCount = await Server.countDocuments({ locationId: loc._id });
    return formatPublicEntity({ ...loc, serversCount }, 'location');
  }, CACHE_TTL_SECONDS);
}

async function updateLocation(id, data) {
  const lockKey = `lock:location:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent location operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const original = await Location.findOne(buildIdFilter(id)).lean();
    if (!original) {
      throw AppError.notFound('Location not found', 'ERR_LOCATION_NOT_FOUND');
    }

    const updated = await Location.findByIdAndUpdate(original._id, data, { new: true, runValidators: true }).lean();
    await clearLocationCaches(original.publicId);

    const changes = {};
    for (const [k, v] of Object.entries(data)) {
      if (JSON.stringify(original[k]) !== JSON.stringify(v)) {
        changes[k] = { old: original[k], new: v };
      }
    }

    return { updated: formatPublicEntity(updated, 'location'), changes };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function deleteLocation(id) {
  const lockKey = `lock:location:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent location operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const loc = await Location.findOne(buildIdFilter(id)).lean();
    if (!loc) {
      throw AppError.notFound('Location not found', 'ERR_LOCATION_NOT_FOUND');
    }
    const serversCount = await Server.countDocuments({ locationId: loc._id });
    if (serversCount > 0) {
      throw AppError.badRequest('Cannot delete location with existing servers', 'ERR_LOCATION_HAS_SERVERS');
    }

    const deleted = await Location.findByIdAndDelete(loc._id).lean();
    await clearLocationCaches(loc.publicId);
    return formatPublicEntity(deleted, 'location');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

module.exports = {
  getLocations,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
  clearLocationCaches,
};
