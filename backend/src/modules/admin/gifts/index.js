const giftsController = require('./gifts.controller');
const giftsService = require('./gifts.service');
const giftsMutationService = require('./gifts.mutation.service');
const giftsSchema = require('./gifts.schema');

module.exports = {
  giftsController,
  giftsService,
  giftsMutationService,
  giftsSchema,
};
