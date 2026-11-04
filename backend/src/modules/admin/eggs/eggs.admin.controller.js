const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const eggsService = require('./eggs.admin.service');
const eggMutations = require('./eggs.admin.mutation.service');
const {
  createEggSchema,
  updateEggSchema,
  eggIdParamSchema,
  eggCategorySchema,
  eggCategoryIdParamSchema,
} = require('./eggs.admin.schema');

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

    const egg = await eggMutations.createEgg(parsed.data);
    await writeAudit(req, 'admin.egg.create', 'egg', egg.publicId, { created: parsed.data });

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

    const result = await eggMutations.createEggCategory(parsed.data.name);
    await writeAudit(req, 'admin.egg_category.create', 'egg_category', result.id, {
      created: { name: result.catObj.name },
    });

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

    const { cat, oldName, newName, changed } = await eggMutations.updateEggCategory(
      paramParsed.data.id,
      bodyParsed.data.name
    );

    if (changed) {
      await writeAudit(req, 'admin.egg_category.update', 'egg_category', cat.publicId, {
        changes: { name: { old: oldName, new: newName } },
      });
    }

    res.json({ id: cat.publicId, name: cat.name });
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

    const cat = await eggMutations.deleteEggCategory(paramParsed.data.id);
    await writeAudit(req, 'admin.egg_category.delete', 'egg_category', cat.publicId, { name: cat.name });

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

    const { egg, changes } = await eggMutations.updateEgg(paramParsed.data.id, bodyParsed.data);
    await writeAudit(req, 'admin.egg.update', 'egg', egg.publicId, { changes });

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

    const egg = await eggMutations.deleteEgg(paramParsed.data.id);
    await writeAudit(req, 'admin.egg.delete', 'egg', egg.publicId, { name: egg.name });

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
