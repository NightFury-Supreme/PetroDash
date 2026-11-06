const { earnPatchSchema, getSessionsQuerySchema } = require('./earn.schema');
const earnService = require('./earn.service');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

async function getSettings(_req, res, next) {
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
      throw AppError.badRequest('Validation failed', 'ERR_EARN_VALIDATION_FAILED', parsed.error.flatten());
    }

    const { updatedEarn, changes } = await earnService.updateSettings(parsed.data);

    await writeAudit(req, 'admin.earn.update', 'earn_settings', 'settings', { changes });

    return res.json(updatedEarn);
  } catch (error) {
    next(error);
  }
}

async function getSessions(req, res, next) {
  try {
    const parsed = getSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid query parameters', 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten());
    }

    const list = await earnService.getSessions(parsed.data);
    return res.json(list);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getSessions,
};
