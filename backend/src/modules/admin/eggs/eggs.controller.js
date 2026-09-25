/* ==========================================================================
   Admin Eggs Controller Layer
   Compliance: ISO/IEC 25010, Separation of Concerns, Audit Logging
========================================================================== */

const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');
const eggsService = require('./eggs.service');
const {
  createEggSchema,
  updateEggSchema,
  eggIdParamSchema,
  eggCategorySchema,
  eggCategoryIdParamSchema,
} = require('./eggs.schema');

const getEggsList = async (req, res, next) => {
  try {
    const list = await eggsService.getEggsList();
    res.json(list);
  } catch (error) {
    next(error);
  }
};

const createEgg = async (req, res, next) => {
  try {
    const parsed = createEggSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_EGG_VALIDATION_FAILED', parsed.error.flatten());
    }

    const egg = await eggsService.createEgg(parsed.data);
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.egg.create', 'egg', egg._id.toString(), { created: parsed.data });
    if (adminId) {
      await logUserActivity(req, 'admin.egg.create', { eggId: egg._id.toString(), name: egg.name }, adminId);
    }

    res.status(201).json(egg);
  } catch (error) {
    next(error);
  }
};

const getEggCategories = async (req, res, next) => {
  try {
    const categories = await eggsService.getEggCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createEggCategory = async (req, res, next) => {
  try {
    const parsed = eggCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_EGG_VALIDATION_FAILED', parsed.error.flatten());
    }

    const result = await eggsService.createEggCategory(parsed.data.name);
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.egg_category.create', 'egg_category', result.catObj._id.toString(), {
      created: { name: result.catObj.name },
    });
    if (adminId) {
      await logUserActivity(req, 'admin.egg_category.create', { categoryId: result.id, name: result.name }, adminId);
    }

    res.status(201).json({ id: result.id, name: result.name, eggCount: result.eggCount });
  } catch (error) {
    next(error);
  }
};

const updateEggCategory = async (req, res, next) => {
  try {
    const paramParsed = eggCategoryIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid category ID', 400, 'ERR_INVALID_ID');
    }

    const bodyParsed = eggCategorySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_EGG_VALIDATION_FAILED', bodyParsed.error.flatten());
    }

    const { cat, oldName, newName, changed } = await eggsService.updateEggCategory(
      paramParsed.data.id,
      bodyParsed.data.name
    );

    if (changed) {
      const adminId = req.user?._id?.toString() || req.user?.id;
      await writeAudit(req, 'admin.egg_category.update', 'egg_category', cat._id.toString(), {
        changes: { name: { old: oldName, new: newName } },
      });
      if (adminId) {
        await logUserActivity(req, 'admin.egg_category.update', { categoryId: cat._id.toString(), oldName, newName }, adminId);
      }
    }

    res.json({ id: cat._id.toString(), name: cat.name });
  } catch (error) {
    next(error);
  }
};

const deleteEggCategory = async (req, res, next) => {
  try {
    const paramParsed = eggCategoryIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid category ID', 400, 'ERR_INVALID_ID');
    }

    const cat = await eggsService.deleteEggCategory(paramParsed.data.id);
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.egg_category.delete', 'egg_category', cat._id.toString(), { name: cat.name });
    if (adminId) {
      await logUserActivity(req, 'admin.egg_category.delete', { categoryId: cat._id.toString(), name: cat.name }, adminId);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getEggById = async (req, res, next) => {
  try {
    const paramParsed = eggIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid egg ID', 400, 'ERR_INVALID_ID');
    }

    const egg = await eggsService.getEggById(paramParsed.data.id);
    res.json(egg);
  } catch (error) {
    next(error);
  }
};

const updateEgg = async (req, res, next) => {
  try {
    const paramParsed = eggIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid egg ID', 400, 'ERR_INVALID_ID');
    }

    const bodyParsed = updateEggSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_EGG_VALIDATION_FAILED', bodyParsed.error.flatten());
    }

    const { egg, changes } = await eggsService.updateEgg(paramParsed.data.id, bodyParsed.data);
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.egg.update', 'egg', egg._id.toString(), { changes });
    if (adminId) {
      await logUserActivity(req, 'admin.egg.update', { eggId: egg._id.toString(), name: egg.name }, adminId);
    }

    res.json(egg);
  } catch (error) {
    next(error);
  }
};

const deleteEgg = async (req, res, next) => {
  try {
    const paramParsed = eggIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid egg ID', 400, 'ERR_INVALID_ID');
    }

    const egg = await eggsService.deleteEgg(paramParsed.data.id);
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.egg.delete', 'egg', egg._id.toString(), { name: egg.name });
    if (adminId) {
      await logUserActivity(req, 'admin.egg.delete', { eggId: egg._id.toString(), name: egg.name }, adminId);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
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
