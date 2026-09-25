/**
 * Admin Shop Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const shopController = require('./shop.controller');
const shopService = require('./shop.service');

module.exports = {
  shopController,
  shopService,
};
