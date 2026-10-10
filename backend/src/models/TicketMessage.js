const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, enum: ['user', 'admin'], required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  internal: { type: Boolean, default: false }, // admin-only note, never visible to user
  createdAt: { type: Date, default: Date.now, index: true }
});

// Index for cursor pagination by _id descending
TicketMessageSchema.index({ ticket: 1, _id: -1 });

module.exports = mongoose.model('TicketMessage', TicketMessageSchema);
