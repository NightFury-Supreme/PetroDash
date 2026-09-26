/*
  User Plans Service
  Retrieves active plan subscriptions for the authenticated user.
*/

const UserPlan = require('../../models/UserPlan');
const { getCache, setCache } = require('../../lib/redis');

class UserPlansService {
  async getActivePlans(userId) {
    const cacheKey = `user:${userId}:plans`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const listRaw = await UserPlan.find({ userId, status: 'active' })
      .populate('planId', 'name')
      .sort({ endsAt: 1 })
      .lean();

    const list = listRaw.map(({ isRenewable: _isRenewable, ...rest }) => rest);
    await setCache(cacheKey, list, 30);
    return list;
  }
}

module.exports = new UserPlansService();
