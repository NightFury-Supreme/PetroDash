/**
 * Admin Users Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const usersAdminController = require('./users.admin.controller');
const usersAdminService = require('./users.admin.service');

module.exports = {
  usersAdminController,
  usersAdminService,
};
