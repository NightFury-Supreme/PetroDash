const plansService = require('./plans.service');

const getCategories = async (req, res, next) => {
  try {
    const categories = await plansService.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await plansService.createCategory(req.body.name, req);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await plansService.updateCategory(req.params.id, req.body.name);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await plansService.deleteCategory(req.params.id, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const listPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await plansService.listPlans(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const plan = await plansService.getPlan(req.params.id);
    res.json(plan);
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await plansService.createPlan(req.body, req);
    res.status(201).json(plan);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    if (error.name === 'ValidationError') {
      const fields = Object.fromEntries(
        Object.entries(error.errors).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ error: 'Plan validation failed', fields });
    }
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await plansService.updatePlan(req.params.id, req.body, req);
    res.json(plan);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    next(error);
  }
};

const patchPlan = async (req, res, next) => {
  try {
    const plan = await plansService.patchPlan(req.params.id, req.body, req);
    res.json(plan);
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    await plansService.deletePlan(req.params.id, req);
    res.json({ message: 'Plan deleted successfully' });
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
  deletePlan
};
