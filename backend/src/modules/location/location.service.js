const Location = require('../../models/Location');
const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');
const User = require('../../models/User');
const { getCache, getCacheMany, setCache } = require('../../lib/redis');
const AppError = require('../../utils/AppError');

const { formatPublicEntity, isValidPublicId, buildIdFilter } = require('../../utils/publicId');

let locationsInFlightPromise = null;

class LocationService {
  async getPublicLocations(userId) {
    try {
      let locationsWithData = await getCache('api:locations');

      if (!locationsWithData) {
        if (locationsInFlightPromise) {
          locationsWithData = await locationsInFlightPromise;
        } else {
          locationsInFlightPromise = (async () => {
            try {
              const allPlans = await Plan.find({}, 'publicId name').lean();
              const planNameMap = new Map(allPlans.map((p) => [p.publicId, p.name]));

              const aggregatedLocations = await Location.aggregate([
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
                    serverCount: { $size: '$servers' },
                  },
                },
                {
                  $project: {
                    servers: 0,
                    platform: 0,
                    __v: 0,
                  },
                },
              ]);

              const pingKeys = aggregatedLocations.map((loc) => `ping:${loc.publicId}`);
              const pingsData = await getCacheMany(pingKeys);

              const computed = aggregatedLocations.map((location, idx) => {
                const cacheData = pingsData[idx];
                const ping = cacheData ? cacheData.ping : null;

                const allowedPlanNames = (location.allowedPlans || [])
                  .map((ap) => planNameMap.get(ap))
                  .filter(Boolean);
                const allowedPlanIds = (location.allowedPlans || [])
                  .filter((ap) => isValidPublicId(ap, 'plan'));

                const cleanLocation = formatPublicEntity(location, 'location');

                return {
                  ...cleanLocation,
                  id: cleanLocation.id,
                  ping,
                  allowedPlans: allowedPlanIds,
                  allowedPlanNames: [...new Set(allowedPlanNames)],
                };
              });

              await setCache('api:locations', computed, 60);
              return computed;
            } finally {
              locationsInFlightPromise = null;
            }
          })();

          locationsWithData = await locationsInFlightPromise;
        }
      }

      if (!userId) {
        return locationsWithData;
      }

      try {
        const user = await User.findOne(buildIdFilter(userId)).select('_id').lean();
        const active = user
          ? await UserPlan.find({ userId: user._id, status: 'active' }).select('planId').populate('planId', 'name publicId').lean()
          : [];
        const tokens = new Set([
          ...active.map((p) => p?.planId?.name).filter(Boolean),
          ...active.map((p) => p?.planId?.publicId).filter(Boolean),
        ]);
        const withFlag = locationsWithData.map((l) => ({
          ...l,
          isPlanAllowed: !Array.isArray(l.allowedPlans) || l.allowedPlans.length === 0 || l.allowedPlans.some((ap) => tokens.has(String(ap))),
        }));
        return withFlag;
      } catch (_userPlanError) {
        return locationsWithData;
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Failed to fetch locations', 500, 'ERR_LOCATIONS_FETCH_FAILED');
    }
  }
}

module.exports = new LocationService();
