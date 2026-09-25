/**
 * Admin Earn Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS V14.2
 */

const { earnPatchSchema, getSessionsQuerySchema } = require('./earn.schema');
const earnService = require('./earn.service');
const { writeAudit } = require('../../../middleware/audit');
const { logUserActivity } = require('../../../middleware/userActivity');
const AppError = require('../../../utils/AppError');

async function getSettings(req, res, next) {
  try {
    const out = await earnService.getSettings();
    return res.json(out);
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const parsed = earnPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Validation failed', 400, 'ERR_EARN_VALIDATION_FAILED', parsed.error.flatten());
    }

    const { updatedEarn, changes } = await earnService.updateSettings(parsed.data);
    const adminId = req.user?._id?.toString() || req.user?.id || req.user?.sub;

    await writeAudit(req, 'admin.earn.update', 'earn_settings', 'settings', { changes });
    if (adminId) {
      await logUserActivity(req, 'admin.earn.update', { changes: Object.keys(changes) }, adminId);
    }

    return res.json(updatedEarn);
  } catch (error) {
    next(error);
  }
}

async function getSessions(req, res, next) {
  try {
    const parsed = getSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten());
    }

    const list = await earnService.getSessions(parsed.data);
    return res.json(list);
  } catch (error) {
    next(error);
  }
}

class EarnController {
  getSettings = getSettings;
  updateSettings = updateSettings;
  getSessions = getSessions;
}

const controllerInstance = new EarnController();
controllerInstance.getSettings = getSettings;
controllerInstance.updateSettings = updateSettings;
controllerInstance.getSessions = getSessions;

module.exports = controllerInstance;
