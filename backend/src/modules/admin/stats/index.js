const statsController = require('./stats.controller');
const statsService = require('./stats.service');
const { statsQuerySchema } = require('./stats.schema');

module.exports = {
  statsController,
  statsService,
  statsQuerySchema,
};
