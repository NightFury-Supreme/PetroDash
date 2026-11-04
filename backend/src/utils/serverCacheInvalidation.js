const { deleteCache, deleteCachePattern } = require('../lib/redis');

async function invalidateServerCaches({
  userId = null,
  publicServerId = null,
  eggId = null,
  locationId = null,
} = {}) {
  const ops = [
    deleteCache('eggs:counts'),
    deleteCache('admin:eggs:with-count'),
    deleteCache('admin:eggs:categories'),
    deleteCache('api:locations'),
    deleteCache('admin:locations'),
    deleteCache('api:status'),
    deleteCache('admin:stats:7'),
    deleteCache('admin:stats:14'),
    deleteCache('admin:stats:30'),
    deleteCache('admin:users::all:all:newest:1:10'),
    deleteCache('admin:users::all:all:newest:1:20'),
    deleteCache('admin:users::all:all:newest:1:50'),
    deleteCache('admin:users::all:all:newest:2:10'),
    deleteCache('admin:users::all:active:newest:1:10'),
    deleteCache('admin:users::all:banned:newest:1:10'),
    deleteCache('api:admin:servers:p1:s10'),
    deleteCache('api:admin:servers:p1:s20'),
    deleteCache('api:admin:servers:p1:s50'),
    deleteCache('api:admin:servers:p2:s10'),
    deleteCache('api:admin:servers:p2:s20'),
    deleteCache('api:admin:servers:p2:s50'),
    deleteCache('api:admin:servers:p3:s10'),
    deleteCache('api:admin:servers:p3:s20'),
    deleteCache('api:admin:servers:p3:s50'),
    deleteCachePattern('admin:egg:*'),
    deleteCachePattern('admin:location:*'),
    deleteCachePattern('api:admin:servers:*'),
    deleteCachePattern('admin:users:*'),
  ];

  if (publicServerId) {
    ops.push(deleteCache(`api:admin:server:${publicServerId}`));
  }

  if (eggId) {
    ops.push(deleteCache(`admin:egg:${eggId}`));
  }

  if (locationId) {
    ops.push(deleteCache(`admin:location:${locationId}`));
  }

  if (userId) {
    const uStr = String(userId);
    ops.push(
      deleteCache(`user:${uStr}:profile`),
      deleteCache(`user:${uStr}:plans`),
      deleteCache(`server:usage:${uStr}`),
      deleteCache(`api:servers:${uStr}:false:1:10`),
      deleteCache(`api:servers:${uStr}:false:1:20`),
      deleteCache(`api:servers:${uStr}:false:1:50`),
      deleteCache(`api:servers:${uStr}:true:1:10`),
      deleteCache(`api:servers:${uStr}:true:1:20`),
      deleteCache(`api:servers:${uStr}:true:1:50`),
      deleteCache(`api:servers:${uStr}:true:2:10`),
      deleteCache(`api:servers:${uStr}:true:2:20`),
      deleteCache(`user:activity:${uStr}:1:10`),
      deleteCache(`user:activity:${uStr}:1:20`),
      deleteCache(`admin:users:detail:${uStr}:1:5`),
      deleteCache(`admin:users:detail:${uStr}:1:10`),
      deleteCache(`admin:users:detail:${uStr}:1:20`),
      deleteCache(`admin:users:activity:${uStr}:1:10`),
      deleteCache(`admin:users:activity:${uStr}:1:20`),
      deleteCachePattern(`api:servers:${uStr}:*`),
      deleteCachePattern(`admin:users:detail:${uStr}:*`)
    );
  }

  await Promise.all(ops);
}

module.exports = { invalidateServerCaches };
