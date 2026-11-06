const { z } = require('zod');

const getPublicEggsSchema = z.object({}).strict();

module.exports = {
  getPublicEggsSchema,
};
