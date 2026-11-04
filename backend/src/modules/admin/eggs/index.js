const controller = require('./eggs.admin.controller');
const service = require('./eggs.admin.service');
const mutations = require('./eggs.admin.mutation.service');
const schemas = require('./eggs.admin.schema');

module.exports = {
  ...controller,
  service,
  mutations,
  schemas,
};
