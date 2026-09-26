/**
 * Admin Gifts Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const giftsController = require('./gifts.controller');
const giftsService = require('./gifts.service');
const giftsSchema = require('./gifts.schema');

module.exports = {
  giftsController,
  giftsService,
  giftsSchema,
};
