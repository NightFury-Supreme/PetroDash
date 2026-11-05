const { isValidEntityId } = require('../utils/publicId');
const AppError = require('../utils/AppError');

function validateObjectId(paramName = 'id', expectedTypeOrPrefix = null) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !isValidEntityId(value, expectedTypeOrPrefix)) {
      return next(AppError.badRequest(`Invalid ${paramName} format`, 'ERR_INVALID_OBJECT_ID'));
    }
    next();
  };
}

module.exports = { validateObjectId, validateId: validateObjectId };
