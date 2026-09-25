/**
 * Admin Locations Controller
 */

const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
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
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.location.create', 'location', created._id.toString(), { created: parsed.data });
    if (adminId) {
      await logUserActivity(req, 'admin.location.create', { locationId: created._id.toString(), name: created.name }, adminId);
    }

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
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.location.update', 'location', updated._id.toString(), { changes });
    if (adminId) {
      await logUserActivity(req, 'admin.location.update', { locationId: updated._id.toString(), name: updated.name }, adminId);
    }

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
    const adminId = req.user?._id?.toString() || req.user?.id;

    await writeAudit(req, 'admin.location.delete', 'location', result._id.toString(), { name: result.name });
    if (adminId) {
      await logUserActivity(req, 'admin.location.delete', { locationId: result._id.toString(), name: result.name }, adminId);
    }

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
