const { deleteCache, deleteCachePattern } = require('../lib/redis');

async function invalidateReferralCaches(userId) {
  if (!userId) return;
  const sId = String(userId);
  await Promise.allSettled([
    deleteCache(`referrals:stats:${sId}`),
    deleteCache(`referrals:list:${sId}`),
    deleteCache(`referrals:list:${sId}:1:5`),
    deleteCache(`referrals:list:${sId}:1:10`),
    deleteCache(`referrals:list:${sId}:1:20`),
    deleteCachePattern(`referrals:list:${sId}:*`),
    deleteCachePattern(`referrals:stats:${sId}:*`),
  ]);
}

async function invalidateUserPaymentsCaches(userId) {
  if (!userId) return;
  const sId = String(userId);
  await Promise.allSettled([
    deleteCache(`payments:mine:${sId}`),
    deleteCache(`payments:mine:${sId}:all`),
    deleteCache(`payments:mine:${sId}:p1:s10`),
    deleteCache(`payments:mine:${sId}:p1:s20`),
    deleteCachePattern(`payments:mine:${sId}:*`),
  ]);
}

async function invalidateUserCaches(userId) {
  if (!userId) return;
  const sId = String(userId);
  await Promise.allSettled([
    deleteCache(`user:${sId}:profile`),
    deleteCache(`user:${sId}:plans`),
    deleteCache(`user:${sId}:sessions`),
    deleteCache(`user:${sId}:panel`),
    deleteCache(`user:auth:${sId}`),
    deleteCache(`user:activity:${sId}:1:10`),
    deleteCache(`user:activity:${sId}:1:20`),
    deleteCachePattern(`user:activity:${sId}:*`),
    deleteCache(`admin:users:detail:${sId}:1:10`),
    deleteCache(`admin:users:detail:${sId}:1:20`),
    deleteCachePattern(`admin:users:detail:${sId}:*`),
    deleteCache(`admin:users:activity:${sId}:1:10`),
    deleteCache(`admin:users:activity:${sId}:1:20`),
    deleteCachePattern(`admin:users:activity:${sId}:*`),
    deleteCache(`admin:user:${sId}:sessions`),
    invalidateReferralCaches(sId),
    invalidateUserPaymentsCaches(sId),
  ]);
}

async function invalidateAdminUserListCaches() {
  await Promise.allSettled([
    deleteCache('admin:users::all:all:newest:1:10'),
    deleteCache('admin:users::all:all:newest:1:20'),
    deleteCache('admin:users::all:all:newest:1:50'),
    deleteCache('admin:users::all:all:newest:2:10'),
    deleteCache('admin:users::all:active:newest:1:10'),
    deleteCache('admin:users::all:banned:newest:1:10'),
    deleteCachePattern('admin:users:*'),
  ]);
}

module.exports = {
  invalidateUserCaches,
  invalidateAdminUserListCaches,
  invalidateReferralCaches,
  invalidateUserPaymentsCaches,
};
