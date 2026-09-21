const { z } = require('zod');
const { getLocations, createLocation, getLocationById, updateLocation, deleteLocation } = require('./locations.service');
const AppError = require('../../../../utils/AppError');
const { writeAudit } = require('../../../../middleware/audit');

const schema = z.object({
  name: z.string().min(1),
  flag: z.string().min(1, 'Location flag is required'),
  latencyUrl: z.string().min(1, 'Node IP is required'),
  serverLimit: z.coerce.number().int().nonnegative().default(0),
  platform: z
      .object({
          platformLocationId: z.string().optional().default(''),
          swapMb: z.coerce.number().default(-1),
          blockIoWeight: z.coerce.number().default(500),
          cpuPinning: z.string().optional().default(''),
      })
      .optional()
      .default({}),
  allowedPlans: z.array(z.string()).optional().default([]),
});

async function getLocationsHandler(req, res, next) {
  try {
    const data = await getLocations();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createLocationHandler(req, res, next) {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid payload', 400, parsed.error.flatten());
    }

    const created = await createLocation(parsed.data);

    await writeAudit(req, 'admin.location.create', 'location', created._id.toString(), { created: parsed.data });

    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function getLocationByIdHandler(req, res, next) {
  try {
    const loc = await getLocationById(String(req.params.id));
    if (!loc) {
      throw new AppError('Not found', 404);
    }
    return res.json(loc);
  } catch (error) {
    next(error);
  }
}

async function updateLocationHandler(req, res, next) {
  try {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid payload', 400, parsed.error.flatten());
    }

    const result = await updateLocation(String(req.params.id), parsed.data);
    if (!result) {
      throw new AppError('Not found', 404);
    }

    const { updated, changes } = result;

    await writeAudit(req, 'admin.location.update', 'location', updated._id.toString(), { changes });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteLocationHandler(req, res, next) {
  try {
    const result = await deleteLocation(String(req.params.id));
    if (result && result.error) {
      throw new AppError(result.error, 400);
    }
    if (!result) {
      throw new AppError('Not found', 404);
    }

    await writeAudit(req, 'admin.location.delete', 'location', result._id.toString(), { name: result.name });

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
  deleteLocationHandler
};
