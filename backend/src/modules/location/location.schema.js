const { z } = require('zod');

const getPublicLocationsSchema = z.object({}).strict();

module.exports = {
  getPublicLocationsSchema,
};
