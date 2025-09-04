const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true, index: true, unique: true },
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);



