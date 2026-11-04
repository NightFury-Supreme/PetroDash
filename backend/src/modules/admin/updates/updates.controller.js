const updatesService = require('./updates.service');
const AppError = require('../../../utils/AppError');

exports.checkUpdates = async (req, res, next) => {
  try {
    const result = await updatesService.checkUpdates();
    return res.json(result);
  } catch (_error) {
    next(AppError.internal('Failed to check for updates', 'ERR_UPDATES_CHECK_FAILED'));
  }
};
