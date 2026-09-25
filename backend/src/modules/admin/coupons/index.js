/**
 * Admin Coupons Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const couponsController = require('./coupons.controller');
const couponsService = require('./coupons.service');

module.exports = {
  couponsController,
  couponsService,
};
