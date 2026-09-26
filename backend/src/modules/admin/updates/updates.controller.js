/**
 * Admin System Updates Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const updatesService = require('./updates.service');
const AppError = require('../../../utils/AppError');

exports.checkUpdates = async (req, res, next) => {
  try {
    const result = await updatesService.checkUpdates();
    return res.json(result);
  } catch (error) {
    next(
      new AppError(
        'Failed to check for updates',
        500,
        'ERR_UPDATES_CHECK_FAILED',
        { message: error.response?.data?.message || error.message || 'Unknown error occurred' }
      )
    );
  }
};
