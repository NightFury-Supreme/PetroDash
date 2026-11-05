const Egg = require('../../models/Egg');
const Server = require('../../models/Server');
const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');
const User = require('../../models/User');
const { getCache, setCache } = require('../../lib/redis');
const AppError = require('../../utils/AppError');

const { formatPublicEntity, isValidPublicId, buildIdFilter } = require('../../utils/publicId');

let eggsInFlightPromise = null;

class EggService {
  async getPublicEggs(userId) {
    try {
      let eggsWithCounts = await getCache('eggs:counts');

      if (!eggsWithCounts) {
        if (eggsInFlightPromise) {
          eggsWithCounts = await eggsInFlightPromise;
        } else {
          eggsInFlightPromise = (async () => {
            try {
              const eggs = await Egg.find()
                .select('_id publicId name category icon recommended description allowedPlans')
                .populate('category', 'name icon publicId')
                .lean();
              const allPlans = await Plan.find({}, 'publicId name').lean();
              const planNameMap = new Map(allPlans.map((p) => [p.publicId, p.name]));

              const serverCountsAgg = await Server.aggregate([{ $group: { _id: '$eggId', count: { $sum: 1 } } }]);
              const serverCounts = new Map(serverCountsAgg.map((s) => [String(s._id), s.count]));

              const computed = eggs.map((egg) => {
                const serverCount = serverCounts.get(String(egg._id)) || 0;
                const allowedPlanNames = (egg.allowedPlans || [])
                  .map((ap) => planNameMap.get(ap))
                  .filter(Boolean);
                const allowedPlanIds = (egg.allowedPlans || [])
                  .filter((ap) => isValidPublicId(ap, 'plan'));

                const formattedCategory = egg.category ? formatPublicEntity(egg.category, 'eggCategory') : null;

                return {
                  id: egg.publicId,
                  name: egg.name,
                  icon: egg.icon,
                  recommended: egg.recommended,
                  description: egg.description,
                  category: formattedCategory,
                  categoryName: egg.category?.name || 'Uncategorized',
                  serverCount,
                  allowedPlans: allowedPlanIds,
                  allowedPlanNames: [...new Set(allowedPlanNames)],
                };
              });

              await setCache('eggs:counts', computed, 300);
              return computed;
            } finally {
              eggsInFlightPromise = null;
            }
          })();

          eggsWithCounts = await eggsInFlightPromise;
        }
      }

      if (!userId) {
        return eggsWithCounts;
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
        const withFlag = eggsWithCounts.map((e) => ({
          ...e,
          isPlanAllowed: !Array.isArray(e.allowedPlans) || e.allowedPlans.length === 0 || e.allowedPlans.some((ap) => tokens.has(String(ap))),
        }));
        return withFlag;
      } catch (_userPlanError) {
        return eggsWithCounts;
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Failed to fetch eggs', 500, 'ERR_EGGS_FETCH_FAILED');
    }
  }
}

module.exports = new EggService();
