const Egg = require('../../../models/Egg');
const EggCategory = require('../../../models/EggCategory');
const Server = require('../../../models/Server');
const AppError = require('../../../utils/AppError');
const { acquireLock, releaseLock } = require('../../../lib/redis');
const { buildIdFilter, formatPublicEntity } = require('../../../utils/publicId');
const { clearEggCaches } = require('./eggs.admin.service');

const createEgg = async (data) => {
  const lockKey = 'lock:egg:create';
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent egg operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const payload = { ...data };
    if (payload.category) {
      const catDoc = await EggCategory.findOne(buildIdFilter(payload.category)).select('_id').lean();
      if (!catDoc) throw AppError.badRequest('Egg category not found', 'ERR_EGG_CATEGORY_NOT_FOUND');
      payload.category = catDoc._id;
    }
    const egg = await Egg.create(payload);
    await clearEggCaches();
    return formatPublicEntity(egg.toObject(), 'egg');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const updateEgg = async (id, data) => {
  const lockKey = `lock:egg:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent egg operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const original = await Egg.findOne(buildIdFilter(id)).lean();
    if (!original) throw AppError.notFound('Egg not found', 'ERR_EGG_NOT_FOUND');

    const updateData = { ...data };
    if (updateData.category) {
      const catDoc = await EggCategory.findOne(buildIdFilter(updateData.category)).select('_id').lean();
      if (!catDoc) throw AppError.badRequest('Egg category not found', 'ERR_EGG_CATEGORY_NOT_FOUND');
      updateData.category = catDoc._id;
    }

    const egg = await Egg.findByIdAndUpdate(original._id, updateData, { new: true }).lean();
    await clearEggCaches(original.publicId);

    const changes = {};
    for (const [k, v] of Object.entries(data)) {
      if (JSON.stringify(original[k]) !== JSON.stringify(v)) {
        changes[k] = { old: original[k], new: v };
      }
    }
    return { egg: formatPublicEntity(egg, 'egg'), changes };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const deleteEgg = async (id) => {
  const lockKey = `lock:egg:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent egg operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const egg = await Egg.findOne(buildIdFilter(id)).lean();
    if (!egg) throw AppError.notFound('Egg not found', 'ERR_EGG_NOT_FOUND');

    const serversCount = await Server.countDocuments({ eggId: egg._id });
    if (serversCount > 0) throw AppError.badRequest('Cannot delete egg with existing servers', 'ERR_EGG_HAS_SERVERS');

    await Egg.findByIdAndDelete(egg._id);
    await clearEggCaches(egg.publicId);
    return formatPublicEntity(egg, 'egg');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const createEggCategory = async (name) => {
  const lockKey = 'lock:egg_category:create';
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent category operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const cat = await EggCategory.create({ name: name.trim() });
    await clearEggCaches();
    return { id: cat.publicId, name: cat.name, eggCount: 0, catObj: cat };
  } catch (e) {
    if (e.code === 11000) throw AppError.badRequest('Category already exists', 'ERR_EGG_CATEGORY_DUPLICATE');
    throw AppError.internal('Failed to create egg category', 'ERR_INTERNAL_SERVER');
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const updateEggCategory = async (id, name) => {
  const lockKey = `lock:egg_category:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent category operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const cat = await EggCategory.findOne(buildIdFilter(id));
    if (!cat) throw AppError.notFound('Category not found', 'ERR_EGG_CATEGORY_NOT_FOUND');

    const oldName = cat.name;
    const newName = name.trim();
    if (oldName === newName) return { cat, oldName, newName, changed: false };

    cat.name = newName;
    await cat.save();

    await clearEggCaches();
    return { cat, oldName, newName, changed: true };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

const deleteEggCategory = async (id) => {
  const lockKey = `lock:egg_category:${id}`;
  const lockToken = await acquireLock(lockKey, 5000);
  if (!lockToken) throw AppError.conflict('Concurrent category operation in progress', 'ERR_CONCURRENT_TRANSACTION');

  try {
    const cat = await EggCategory.findOne(buildIdFilter(id));
    if (!cat) throw AppError.notFound('Category not found', 'ERR_EGG_CATEGORY_NOT_FOUND');

    const count = await Egg.countDocuments({ category: cat._id });
    if (count > 0) throw AppError.badRequest('Cannot delete category with associated eggs', 'ERR_EGG_CATEGORY_HAS_EGGS');

    await cat.deleteOne();
    await clearEggCaches();
    return cat;
  } finally {
    await releaseLock(lockKey, lockToken);
  }
};

module.exports = {
  createEgg,
  updateEgg,
  deleteEgg,
  createEggCategory,
  updateEggCategory,
  deleteEggCategory,
};

