/**
 * Admin Plans Categories Sub-Service
 * Complies with ISO/IEC 25010 (Maintainability, Single Responsibility)
 */

const mongoose = require('mongoose');
const Plan = require('../../../models/Plan');
const PlanCategory = require('../../../models/PlanCategory');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');

const getCategories = async () => {
  const cached = await getCache('admin:plans:categories');
  if (cached) return cached;

  const rawPlans = await mongoose.connection.db
    .collection('plans')
    .find({ category: { $type: 'string' } })
    .toArray();
  for (const raw of rawPlans) {
    if (raw.category && raw.category !== 'Others') {
      const cat = await PlanCategory.findOneAndUpdate(
        { name: raw.category },
        { $setOnInsert: { name: raw.category } },
        { upsert: true, new: true }
      );
      await mongoose.connection.db
        .collection('plans')
        .updateOne({ _id: raw._id }, { $set: { category: cat._id } });
    } else if (raw.category === 'Others') {
      const cat = await PlanCategory.findOneAndUpdate(
        { name: 'Others' },
        { $setOnInsert: { name: 'Others' } },
        { upsert: true, new: true }
      );
      await mongoose.connection.db
        .collection('plans')
        .updateOne({ _id: raw._id }, { $set: { category: cat._id } });
    }
  }

  const categories = await PlanCategory.find().sort({ name: 1 }).lean();

  const counts = await Plan.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = counts.reduce((acc, curr) => {
    if (curr._id) acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const result = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    planCount: countMap[c._id.toString()] || 0,
  }));

  await setCache('admin:plans:categories', result, 60);
  return result;
};

const createCategory = async (name, req) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('Category name is required', 400, 'ERR_CATEGORY_NAME_REQUIRED');
  }

  const existing = await PlanCategory.findOne({ name: name.trim() });
  if (existing) {
    throw new AppError('Category already exists', 409, 'ERR_CATEGORY_EXISTS');
  }

  const category = new PlanCategory({ name: name.trim() });
  await category.save();

  await writeAudit(req, 'admin.plan_category.create', 'plan_category', category._id.toString(), {
    name: category.name,
  });
  await logUserActivity(req, 'admin.plan_category.create', {
    categoryId: category._id.toString(),
    name: category.name,
  });

  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');

  return { id: category._id.toString(), name: category.name, planCount: 0 };
};

const updateCategory = async (id, name, req) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('Category name is required', 400, 'ERR_CATEGORY_NAME_REQUIRED');
  }

  const category = await PlanCategory.findById(String(id));
  if (!category) {
    throw new AppError('Category not found', 404, 'ERR_CATEGORY_NOT_FOUND');
  }

  const oldName = category.name;
  category.name = name.trim();
  await category.save();

  if (req) {
    await writeAudit(req, 'admin.plan_category.update', 'plan_category', id, {
      name: category.name,
      oldName,
    });
    await logUserActivity(req, 'admin.plan_category.update', {
      categoryId: id,
      name: category.name,
      oldName,
    });
  }

  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');

  return { id: category._id.toString(), name: category.name };
};

const deleteCategory = async (id, req) => {
  const category = await PlanCategory.findById(String(id));
  if (!category) {
    throw new AppError('Category not found', 404, 'ERR_CATEGORY_NOT_FOUND');
  }

  const planCount = await Plan.countDocuments({ category: category._id });
  if (planCount > 0) {
    throw new AppError(
      'Cannot delete category with associated plans. Reassign or delete the plans first.',
      400,
      'ERR_CATEGORY_HAS_PLANS'
    );
  }

  await PlanCategory.findByIdAndDelete(String(id));

  await writeAudit(req, 'admin.plan_category.delete', 'plan_category', id, {
    categoryName: category.name,
  });
  await logUserActivity(req, 'admin.plan_category.delete', {
    categoryId: id,
    categoryName: category.name,
  });

  await deleteCachePattern('admin:plans*');
  await deleteCachePattern('api:plans*');
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
