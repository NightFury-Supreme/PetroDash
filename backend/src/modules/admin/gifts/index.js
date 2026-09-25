/**
 * Admin Gifts Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const giftsController = require('./gifts.controller');
const giftsService = require('./gifts.service');

module.exports = {
  giftsController,
  giftsService,
};
