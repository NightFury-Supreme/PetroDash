const Plan = require('../../../models/Plan');
const PlanCategory = require('../../../models/PlanCategory');
const { getOrSetCache, deleteCache, deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const { buildIdFilter } = require('../../../utils/publicId');

const getCategories = async () => {
  return getOrSetCache('admin:plans:categories', async () => {
    const categories = await PlanCategory.find().sort({ name: 1 }).lean();

    const counts = await Plan.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((acc, curr) => {
      if (curr._id) acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    return categories.map((c) => {
      const pubId = c.publicId;
      return {
        id: pubId,
        name: c.name,
        planCount: countMap[c._id.toString()] || 0,
      };
    });
  }, 60);
};

const invalidatePlanCaches = async (publicPlanId = null) => {
  const ops = [
    deleteCache('admin:plans:categories'),
    deleteCache('admin:plans:list:1:10'),
    deleteCache('admin:plans:list:1:20'),
    deleteCache('admin:plans:list:1:50'),
    deleteCache('admin:plans:list:2:10'),
    deleteCache('admin:plans:list:2:20'),
    deleteCache('api:plans:false:1:20'),
    deleteCache('api:plans:true:1:10'),
    deleteCache('api:plans:true:1:20'),
    deleteCache('api:plans:true:1:50'),
    deleteCachePattern('admin:plans:list:*'),
    deleteCachePattern('api:plans:*'),
  ];
  if (publicPlanId) ops.push(deleteCache(`admin:plan:${publicPlanId}`));
  await Promise.allSettled(ops);
};

const createCategory = async (name, req) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw AppError.badRequest('Category name is required', 'ERR_CATEGORY_NAME_REQUIRED');
  }

  const existing = await PlanCategory.findOne({ name: name.trim() }).select('_id').lean();
  if (existing) {
    throw AppError.conflict('Category already exists', 'ERR_CATEGORY_EXISTS');
  }

  const category = new PlanCategory({ name: name.trim() });
  await category.save();

  const pubId = category.publicId;

  await writeAudit(req, 'admin.plan_category.create', 'plan_category', pubId, {
    name: category.name,
  });

  await invalidatePlanCaches();

  return { id: pubId, name: category.name, planCount: 0 };
};

const updateCategory = async (id, name, req) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw AppError.badRequest('Category name is required', 'ERR_CATEGORY_NAME_REQUIRED');
  }

  const category = await PlanCategory.findOne(buildIdFilter(id));
  if (!category) {
    throw AppError.notFound('Category not found', 'ERR_CATEGORY_NOT_FOUND');
  }

  const oldName = category.name;
  category.name = name.trim();
  await category.save();

  const pubId = category.publicId;

  if (req) {
    await writeAudit(req, 'admin.plan_category.update', 'plan_category', pubId, {
      name: category.name,
      oldName,
    });
  }

  await invalidatePlanCaches();

  return { id: pubId, name: category.name };
};

const deleteCategory = async (id, req) => {
  const category = await PlanCategory.findOne(buildIdFilter(id));
  if (!category) {
    throw AppError.notFound('Category not found', 'ERR_CATEGORY_NOT_FOUND');
  }

  const planCount = await Plan.countDocuments({ category: category._id });
  if (planCount > 0) {
    throw AppError.badRequest(
      'Cannot delete category with associated plans. Reassign or delete the plans first.',
      'ERR_CATEGORY_HAS_PLANS'
    );
  }

  await PlanCategory.findByIdAndDelete(category._id);

  const pubId = category.publicId;

  await writeAudit(req, 'admin.plan_category.delete', 'plan_category', pubId, {
    categoryName: category.name,
  });

  await invalidatePlanCaches();
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  invalidatePlanCaches,
};
