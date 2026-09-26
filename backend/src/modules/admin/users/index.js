/**
 * Admin Users Module
 * Barrel encapsulation export (ISO/IEC 25010)
 */

const usersAdminController = require('./users.admin.controller');
const usersAdminService = require('./users.admin.service');
const usersAdminSchemas = require('./users.admin.schema');

module.exports = {
  usersAdminController,
  usersAdminService,
  usersAdminSchemas,
};

