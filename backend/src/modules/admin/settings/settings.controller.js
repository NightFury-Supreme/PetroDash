/**
 * Admin Settings Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { getSettings, updateSettings } = require('./settings.service');
const { settingsPayloadSchema } = require('./settings.schema');
const AppError = require('../../../utils/AppError');
const { writeAudit } = require('../../../middleware/audit');

async function getSettingsHandler(req, res, next) {
  try {
    const data = await getSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateSettingsHandler(req, res, next) {
  try {
    const parsed = settingsPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid payload', 400, 'ERR_SETTINGS_VALIDATION_FAILED', parsed.error.flatten());
    }

    const { response, changes, settingsId } = await updateSettings(parsed.data);

    await writeAudit(req, 'admin.settings.update', 'settings', settingsId, { changes });

    return res.json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettingsHandler,
  updateSettingsHandler,
};
