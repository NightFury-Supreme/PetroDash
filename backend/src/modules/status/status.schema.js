const { z } = require('zod');

const getStatusSchema = z.object({}).strict();

module.exports = {
  getStatusSchema,
};
