/**
 * Admin Plans Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const plansService = require('./plans.service');
const AppError = require('../../../utils/AppError');
const {
  createCategorySchema,
  updateCategorySchema,
  createPlanSchema,
  updatePlanSchema,
  patchPlanSchema,
} = require('./plans.schema');

const getCategories = async (req, res, next) => {
  try {
    const categories = await plansService.getCategories();
    return res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid category payload', 400, 'ERR_CATEGORY_VALIDATION_FAILED', parsed.error.flatten());
    }
    const category = await plansService.createCategory(parsed.data.name, req);
    return res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid category payload', 400, 'ERR_CATEGORY_VALIDATION_FAILED', parsed.error.flatten());
    }
    const category = await plansService.updateCategory(req.params.id, parsed.data.name);
    return res.json(category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await plansService.deleteCategory(req.params.id, req);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const listPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await plansService.listPlans(page, limit);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const plan = await plansService.getPlan(req.params.id);
    return res.json(plan);
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Plan validation failed', 400, 'ERR_PLAN_VALIDATION_FAILED', parsed.error.flatten());
    }
    const plan = await plansService.createPlan(parsed.data, req);
    return res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Plan validation failed', 400, 'ERR_PLAN_VALIDATION_FAILED', parsed.error.flatten());
    }
    const plan = await plansService.updatePlan(req.params.id, parsed.data, req);
    return res.json(plan);
  } catch (error) {
    next(error);
  }
};

const patchPlan = async (req, res, next) => {
  try {
    const parsed = patchPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Plan patch validation failed', 400, 'ERR_PLAN_PATCH_VALIDATION_FAILED', parsed.error.flatten());
    }
    const plan = await plansService.patchPlan(req.params.id, parsed.data, req);
    return res.json(plan);
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    await plansService.deletePlan(req.params.id, req);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  patchPlan,
  deletePlan,
};
