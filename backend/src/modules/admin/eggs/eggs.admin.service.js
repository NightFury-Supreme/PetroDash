const Egg = require('../../../models/Egg');
const EggCategory = require('../../../models/EggCategory');
const Server = require('../../../models/Server');
const Plan = require('../../../models/Plan');
const { getOrSetCache, deleteCache } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');
const { buildIdFilter, formatPublicEntity, isValidPublicId } = require('../../../utils/publicId');

const clearEggCaches = async (publicId = null) => {
  const ops = [
    deleteCache('admin:eggs:with-count'),
    deleteCache('admin:eggs:categories'),
    deleteCache('eggs:counts'),
  ];
  if (publicId) ops.push(deleteCache(`admin:egg:${publicId}`));
  await Promise.all(ops);
};

const buildCategoryMaps = (categories) => {
  const nameMap = new Map();
  const idMap = new Map();
  if (Array.isArray(categories)) {
    for (const c of categories) {
      const idStr = c.publicId;
      nameMap.set(c._id.toString(), c.name);
      nameMap.set(idStr, c.name);
      nameMap.set(c.name.toLowerCase(), c.name);
      idMap.set(c.name.toLowerCase(), idStr);
      idMap.set(c._id.toString(), idStr);
      idMap.set(idStr, idStr);
    }
  }
  return { nameMap, idMap };
};

const resolveCategory = (catField, nameMap, idMap) => {
  const catRaw = catField ? catField.toString() : '';
  const categoryName =
    nameMap.get(catRaw) ||
    nameMap.get(catRaw.toLowerCase()) ||
    (typeof catField === 'string' ? catField : 'Uncategorized');
  const categoryId = idMap.get(catRaw) || idMap.get(catRaw.toLowerCase()) || catRaw;
  return { categoryName: categoryName || 'Uncategorized', categoryId };
};

const getEggsList = async () => {
  return getOrSetCache('admin:eggs:with-count', async () => {
    const [eggs, categories, serverCountsAgg, allPlans] = await Promise.all([
      Egg.find().sort({ createdAt: -1 }).lean(),
      EggCategory.find().lean(),
      Server.aggregate([{ $group: { _id: '$eggId', count: { $sum: 1 } } }]),
      Plan.find({}, 'publicId name').lean(),
    ]);

    const serverCounts = new Map();
    if (Array.isArray(serverCountsAgg)) {
      for (const s of serverCountsAgg) {
        if (s._id) serverCounts.set(String(s._id), s.count);
      }
    }

    const planNameMap = new Map(allPlans.map((p) => [p.publicId, p.name]));
    const { nameMap, idMap } = buildCategoryMaps(categories);

    return eggs.map((egg) => {
      const eggIdStr = String(egg._id);
      const count = serverCounts.get(eggIdStr) || 0;
      const { categoryName, categoryId } = resolveCategory(egg.category, nameMap, idMap);
      const allowedPlanNames = (egg.allowedPlans || [])
        .map((ap) => planNameMap.get(ap))
        .filter(Boolean);
      const allowedPlanIds = (egg.allowedPlans || [])
        .filter((ap) => isValidPublicId(ap, 'plan'));

      return formatPublicEntity({
        ...egg,
        categoryName,
        category: categoryId,
        serversCount: count,
        allowedPlans: allowedPlanIds,
        allowedPlanNames: [...new Set(allowedPlanNames)],
      }, 'egg');
    });
  }, 30);
};

const getEggCategories = async () => {
  return getOrSetCache('admin:eggs:categories', async () => {
    const [categories, counts] = await Promise.all([
      EggCategory.find().sort({ name: 1 }).lean(),
      Egg.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    const countMap = counts.reduce((acc, curr) => {
      if (curr._id) acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    return categories.map((c) => ({
      id: c.publicId,
      name: c.name,
      eggCount: countMap[c._id.toString()] || 0,
    }));
  }, 60);
};

const getEggById = async (id) => {
  return getOrSetCache(`admin:egg:${id}`, async () => {
    const idFilter = buildIdFilter(id);
    const [egg, categories] = await Promise.all([
      Egg.findOne(idFilter).lean(),
      EggCategory.find().lean(),
    ]);
    if (!egg) throw new AppError('Egg not found', 404, 'ERR_EGG_NOT_FOUND');

    const serversCount = await Server.countDocuments({ eggId: egg._id });
    const { nameMap, idMap } = buildCategoryMaps(categories);
    const { categoryName, categoryId } = resolveCategory(egg.category, nameMap, idMap);

    return formatPublicEntity({
      ...egg,
      categoryName,
      category: categoryId,
      serversCount,
    }, 'egg');
  }, 30);
};

module.exports = {
  clearEggCaches,
  getEggsList,
  getEggCategories,
  getEggById,
};

