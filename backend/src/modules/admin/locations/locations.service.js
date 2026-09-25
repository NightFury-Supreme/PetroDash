/**
 * Admin Locations Service
 */

const Location = require('../../../models/Location');
const Plan = require('../../../models/Plan');
const Server = require('../../../models/Server');
const AppError = require('../../../utils/AppError');
const { deleteCachePattern, deleteCache, getCache, setCache } = require('../../../lib/redis');

const ADMIN_LOCATIONS_CACHE_KEY = 'admin:locations';
const API_LOCATIONS_CACHE_KEY = 'api:locations';
const CACHE_TTL_SECONDS = 30;

async function clearLocationCaches() {
  await Promise.all([
    deleteCachePattern('admin:locations*'),
    deleteCachePattern('api:locations*'),
    deleteCache(ADMIN_LOCATIONS_CACHE_KEY),
    deleteCache(API_LOCATIONS_CACHE_KEY),
  ]);
}

async function getLocations() {
  const cached = await getCache(ADMIN_LOCATIONS_CACHE_KEY);
  if (cached) return cached;

  const allPlans = await Plan.find({}, '_id name').lean();
  const planMap = new Map();
  allPlans.forEach((p) => {
    planMap.set(p._id.toString(), p.name);
    planMap.set(p.name, p.name);
  });

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

  const finalItems = mappedItems.map((loc) => {
    const allowedPlanNames = (loc.allowedPlans || [])
      .map((ap) => planMap.get(String(ap)))
      .filter(Boolean);
    return {
      ...loc,
      allowedPlanNames: [...new Set(allowedPlanNames)],
    };
  });

  await setCache(ADMIN_LOCATIONS_CACHE_KEY, finalItems, CACHE_TTL_SECONDS);
  return finalItems;
}

async function createLocation(data) {
  const created = await Location.create(data);
  await clearLocationCaches();
  return created;
}

async function getLocationById(id) {
  const loc = await Location.findById(id).lean();
  if (!loc) {
    throw new AppError('Location not found', 404, 'ERR_LOCATION_NOT_FOUND');
  }
  const serversCount = await Server.countDocuments({ locationId: id });
  return { ...loc, serversCount };
}

async function updateLocation(id, data) {
  const original = await Location.findById(id).lean();
  if (!original) {
    throw new AppError('Location not found', 404, 'ERR_LOCATION_NOT_FOUND');
  }

  const updated = await Location.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  await clearLocationCaches();

  const changes = {};
  for (const [k, v] of Object.entries(data)) {
    if (JSON.stringify(original[k]) !== JSON.stringify(v)) {
      changes[k] = { old: original[k], new: v };
    }
  }

  return { updated, changes };
}

async function deleteLocation(id) {
  const serversCount = await Server.countDocuments({ locationId: id });
  if (serversCount > 0) {
    throw new AppError('Cannot delete location with existing servers', 400, 'ERR_LOCATION_HAS_SERVERS');
  }

  const deleted = await Location.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError('Location not found', 404, 'ERR_LOCATION_NOT_FOUND');
  }

  await clearLocationCaches();
  return deleted;
}

module.exports = {
  getLocations,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
  clearLocationCaches,
};
