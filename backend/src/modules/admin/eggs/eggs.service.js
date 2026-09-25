/* ==========================================================================
   Admin Eggs Service Layer
   Compliance: ISO/IEC 25010, ACID, Redis Caching & Invalidation
========================================================================== */

const mongoose = require('mongoose');
const Egg = require('../../../models/Egg');
const EggCategory = require('../../../models/EggCategory');
const Server = require('../../../models/Server');
const Plan = require('../../../models/Plan');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');

/**
 * Retrieves all eggs populated with categories, server counts, and plan details.
 * Cached in Redis for 30s.
 */
const getEggsList = async () => {
  const cacheKey = 'admin:eggs:with-count';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [eggs, serverCountsAgg, allPlans] = await Promise.all([
    Egg.find().populate('category').sort({ createdAt: -1 }).lean(),
    Server.aggregate([{ $group: { _id: '$eggId', count: { $sum: 1 } } }]),
    Plan.find({}, '_id name').lean(),
  ]);

  const serverCounts = new Map(serverCountsAgg.map((s) => [s._id?.toString(), s.count]));
  const planMap = new Map();
  allPlans.forEach((p) => {
    planMap.set(p._id.toString(), p.name);
    planMap.set(p.name, p.name);
  });

  const list = eggs.map((egg) => {
    const count = serverCounts.get(egg._id.toString()) || 0;
    const allowedPlanNames = (egg.allowedPlans || [])
      .map((ap) => planMap.get(String(ap)))
      .filter(Boolean);

    return {
      ...egg,
      categoryName: egg.category?.name || 'Uncategorized',
      category: egg.category?._id?.toString() || egg.category,
      serversCount: count,
      allowedPlanNames: [...new Set(allowedPlanNames)],
    };
  });

  await setCache(cacheKey, list, 30);
  return list;
};

/**
 * Creates a new egg and invalidates related Redis caches.
 */
const createEgg = async (data) => {
  const egg = await Egg.create(data);
  await deleteCachePattern('admin:eggs*');
  await deleteCachePattern('eggs:*');
  return egg;
};

/**
 * Retrieves all egg categories with their associated egg counts.
 * Cached in Redis for 60s.
 */
const getEggCategories = async () => {
  const cacheKey = 'admin:eggs:categories';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // Ensure legacy string categories are migrated to category documents
  const rawEggs = await mongoose.connection.db
    .collection('eggs')
    .find({ category: { $type: 'string' } })
    .toArray();

  for (const raw of rawEggs) {
    if (raw.category) {
      const cat = await EggCategory.findOneAndUpdate(
        { name: raw.category },
        { $setOnInsert: { name: raw.category } },
        { upsert: true, new: true }
      );
      await mongoose.connection.db
        .collection('eggs')
        .updateOne({ _id: raw._id }, { $set: { category: cat._id } });
    }
  }

  const [categories, counts] = await Promise.all([
    EggCategory.find().sort({ name: 1 }).lean(),
    Egg.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const countMap = counts.reduce((acc, curr) => {
    if (curr._id) acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const result = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    eggCount: countMap[c._id.toString()] || 0,
  }));

  await setCache(cacheKey, result, 60);
  return result;
};

/**
 * Creates a new egg category.
 */
const createEggCategory = async (name) => {
  try {
    const cat = await EggCategory.create({ name: name.trim() });
    await deleteCachePattern('admin:eggs:categories');
    await deleteCachePattern('eggs:*');
    return { id: cat._id.toString(), name: cat.name, eggCount: 0, catObj: cat };
  } catch (e) {
    if (e.code === 11000) {
      throw new AppError('Category already exists', 400, 'ERR_EGG_CATEGORY_DUPLICATE');
    }
    throw new AppError('Failed to create egg category', 500, 'ERR_INTERNAL_SERVER');
  }
};

/**
 * Renames an existing egg category.
 */
const updateEggCategory = async (id, name) => {
  const cat = await EggCategory.findById(id);
  if (!cat) {
    throw new AppError('Category not found', 404, 'ERR_EGG_CATEGORY_NOT_FOUND');
  }

  const oldName = cat.name;
  const newName = name.trim();
  if (oldName === newName) {
    return { cat, oldName, newName, changed: false };
  }

  cat.name = newName;
  await cat.save();

  await deleteCachePattern('admin:eggs*');
  await deleteCachePattern('eggs:*');

  return { cat, oldName, newName, changed: true };
};

/**
 * Deletes an empty egg category.
 */
const deleteEggCategory = async (id) => {
  const cat = await EggCategory.findById(id);
  if (!cat) {
    throw new AppError('Category not found', 404, 'ERR_EGG_CATEGORY_NOT_FOUND');
  }

  const count = await Egg.countDocuments({ category: cat._id });
  if (count > 0) {
    throw new AppError('Cannot delete category with associated eggs', 400, 'ERR_EGG_CATEGORY_HAS_EGGS');
  }

  await cat.deleteOne();
  await deleteCachePattern('admin:eggs:categories');
  await deleteCachePattern('eggs:*');

  return cat;
};

/**
 * Retrieves a single egg by ID with server counts.
 */
const getEggById = async (id) => {
  const cacheKey = `admin:egg:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const egg = await Egg.findById(id).populate('category').lean();
  if (!egg) {
    throw new AppError('Egg not found', 404, 'ERR_EGG_NOT_FOUND');
  }

  const serversCount = await Server.countDocuments({ eggId: id });

  const formattedEgg = {
    ...egg,
    categoryName: egg.category?.name || 'Uncategorized',
    category: egg.category?._id?.toString() || egg.category,
    serversCount,
  };

  await setCache(cacheKey, formattedEgg, 30);
  return formattedEgg;
};

/**
 * Updates an egg by ID and calculates field-level changes for audit logging.
 */
const updateEgg = async (id, data) => {
  const original = await Egg.findById(id).lean();
  if (!original) {
    throw new AppError('Egg not found', 404, 'ERR_EGG_NOT_FOUND');
  }

  const egg = await Egg.findByIdAndUpdate(id, data, { new: true }).lean();

  await deleteCachePattern('admin:eggs*');
  await deleteCachePattern('eggs:*');
  await deleteCachePattern(`admin:egg:${id}`);

  const changes = {};
  for (const [k, v] of Object.entries(data)) {
    if (JSON.stringify(original[k]) !== JSON.stringify(v)) {
      changes[k] = { old: original[k], new: v };
    }
  }

  return { egg, changes };
};

/**
 * Deletes an egg if no active servers are running on it.
 */
const deleteEgg = async (id) => {
  const serversCount = await Server.countDocuments({ eggId: id });
  if (serversCount > 0) {
    throw new AppError('Cannot delete egg with existing servers', 400, 'ERR_EGG_HAS_SERVERS');
  }

  const egg = await Egg.findByIdAndDelete(id).lean();
  if (!egg) {
    throw new AppError('Egg not found', 404, 'ERR_EGG_NOT_FOUND');
  }

  await deleteCachePattern('admin:eggs*');
  await deleteCachePattern('eggs:*');
  await deleteCachePattern(`admin:egg:${id}`);

  return egg;
};

module.exports = {
  getEggsList,
  createEgg,
  getEggCategories,
  createEggCategory,
  updateEggCategory,
  deleteEggCategory,
  getEggById,
  updateEgg,
  deleteEgg,
};
