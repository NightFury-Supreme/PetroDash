/**
 * Admin Coupons Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const couponsController = require('./coupons.controller');
const couponsService = require('./coupons.service');
const couponsSchema = require('./coupons.schema');

module.exports = {
  couponsController,
  couponsService,
  couponsSchema,
};
