const UserPlan = require('../../models/UserPlan');
const User = require('../../models/User');
require('../../models/Plan');
const { getOrSetCache } = require('../../lib/redis');
const { buildIdFilter } = require('../../utils/publicId');

class UserPlansService {
  async getActivePlans(userId) {
    const user = await User.findOne(buildIdFilter(userId)).select('_id publicId').lean();
    if (!user) return [];

    const cacheKey = `user:${user.publicId}:plans`;
    return getOrSetCache(cacheKey, async () => {
      const now = new Date();
      const listRaw = await UserPlan.find({
        userId: user._id,
        status: 'active',
        $or: [
          { isLifetime: true },
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      })
        .select('-notes -__v')
        .populate('planId', 'name publicId -_id')
        .sort({ expiresAt: 1 })
        .lean();

      return listRaw.map(({ isRenewable: _isRenewable, notes: _notes, userId: _rawUserId, _id: _dbId, publicId: rawPublicId, ...rest }) => {
        const uplPubId = rawPublicId;
        const planObj = rest.planId && typeof rest.planId === 'object' ? {
          name: rest.planId.name,
          id: rest.planId.publicId,
        } : null;
        return {
          ...rest,
          id: uplPubId,
          userId: user.publicId,
          planId: planObj
        };
      });
    }, 30);
  }
}

module.exports = new UserPlansService();
