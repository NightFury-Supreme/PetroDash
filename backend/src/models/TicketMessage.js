const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const TicketMessageSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('message') },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, enum: ['user', 'admin'], required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  internal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

TicketMessageSchema.index({ ticket: 1, _id: -1 });
TicketMessageSchema.index({ ticket: 1, createdAt: 1 });
TicketMessageSchema.index({ ticket: 1, internal: 1, createdAt: 1 });
TicketMessageSchema.index({ ticket: 1, author: 1, _id: -1 });
TicketMessageSchema.index({ authorRole: 1, createdAt: 1 });

TicketMessageSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('message');
  }
  next();
});

module.exports = mongoose.model('TicketMessage', TicketMessageSchema);
