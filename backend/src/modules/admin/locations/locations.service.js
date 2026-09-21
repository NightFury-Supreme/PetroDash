const Location = require('../../../models/Location');
const Plan = require('../../../models/Plan');
const Server = require('../../../models/Server');
const { deleteCachePattern, deleteCache, getCache, setCache } = require('../../../lib/redis');

async function clearLocationCaches() {
  await deleteCachePattern('admin:locations');
  await deleteCache('api:locations');
}

async function getLocations() {
  const cached = await getCache('admin:locations');
  if (cached) return cached;

  const allPlans = await Plan.find({}, '_id name').lean();
  const planMap = new Map();
  allPlans.forEach(p => {
      planMap.set(p._id.toString(), p.name);
      planMap.set(p.name, p.name);
  });

  const mappedItems = await Location.aggregate([
      {
          $lookup: {
              from: 'servers',
              localField: '_id',
              foreignField: 'locationId',
              as: 'servers'
          }
      },
      {
          $addFields: {
              serversCount: { $size: "$servers" }
          }
      },
      {
          $project: {
              servers: 0
          }
      },
      {
          $sort: { createdAt: -1 }
      }
  ]);

  const finalItems = mappedItems.map(loc => {
      const allowedPlanNames = (loc.allowedPlans || [])
          .map(ap => planMap.get(String(ap)))
          .filter(Boolean);
      return {
          ...loc,
          allowedPlanNames: [...new Set(allowedPlanNames)]
      };
  });

  await setCache('admin:locations', finalItems, 30);
  return finalItems;
}

async function createLocation(data) {
  const created = await Location.create(data);
  await clearLocationCaches();
  return created;
}

async function getLocationById(id) {
  const loc = await Location.findById(id).lean();
  if (!loc) return null;
  const serversCount = await Server.countDocuments({ locationId: id });
  return { ...loc, serversCount };
}

async function updateLocation(id, data) {
  const original = await Location.findById(id).lean();
  if (!original) return null;

  const updated = await Location.findByIdAndUpdate(id, data, { new: true }).lean();
  await clearLocationCaches();

  const changes = {};
  for (const [k, v] of Object.entries(data)) {
      if (JSON.stringify(original[k]) !== JSON.stringify(v)) changes[k] = { old: original[k], new: v };
  }

  return { updated, changes };
}

async function deleteLocation(id) {
  const serversCount = await Server.countDocuments({ locationId: id });
  if (serversCount > 0) {
      return { error: 'Cannot delete location with existing servers' };
  }
  const deleted = await Location.findByIdAndDelete(id).lean();
  if (!deleted) return null;

  await clearLocationCaches();
  return deleted;
}

module.exports = {
  getLocations,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation
};
