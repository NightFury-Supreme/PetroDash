const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');
const locationsService = require('./locations.service');
const {
  createLocationSchema,
  updateLocationSchema,
  locationIdParamSchema,
} = require('./locations.schema');

async function getLocationsHandler(req, res, next) {
  try {
    const data = await locationsService.getLocations();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createLocationHandler(req, res, next) {
  try {
    const parsed = createLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_LOCATION_VALIDATION_FAILED', parsed.error.flatten());
    }

    const created = await locationsService.createLocation(parsed.data);
    const publicLocId = created.publicId;

    await writeAudit(req, 'admin.location.create', 'location', publicLocId, { created: parsed.data });

    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function getLocationByIdHandler(req, res, next) {
  try {
    const paramParsed = locationIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid location ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }

    const loc = await locationsService.getLocationById(paramParsed.data.id);
    return res.json(loc);
  } catch (error) {
    next(error);
  }
}

async function updateLocationHandler(req, res, next) {
  try {
    const paramParsed = locationIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid location ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }

    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_LOCATION_VALIDATION_FAILED', parsed.error.flatten());
    }

    const { updated, changes } = await locationsService.updateLocation(paramParsed.data.id, parsed.data);
    const publicLocId = updated.publicId;

    await writeAudit(req, 'admin.location.update', 'location', publicLocId, { changes });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteLocationHandler(req, res, next) {
  try {
    const paramParsed = locationIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new AppError('Invalid location ID format', 400, 'ERR_INVALID_ID', paramParsed.error.flatten());
    }

    const result = await locationsService.deleteLocation(paramParsed.data.id);
    const publicLocId = result.publicId;

    await writeAudit(req, 'admin.location.delete', 'location', publicLocId, { name: result.name });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLocationsHandler,
  createLocationHandler,
  getLocationByIdHandler,
  updateLocationHandler,
  deleteLocationHandler,
};
