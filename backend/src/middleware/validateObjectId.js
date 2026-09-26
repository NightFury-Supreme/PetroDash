const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return next(AppError.badRequest(`Invalid ${paramName} format`, 'ERR_INVALID_OBJECT_ID'));
    }
    next();
  };
}

module.exports = { validateObjectId };



