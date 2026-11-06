const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const TicketSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('ticket') },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 100, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
  tags: { type: [String], default: [] },
  deletedByUser: { type: Boolean, default: false },
  lastUserActivityAt: { type: Date, default: null },
  lastAdminReplyAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TicketSchema.index({ user: 1, status: 1, createdAt: -1 });
TicketSchema.index({ user: 1, deletedByUser: 1, updatedAt: -1 });
TicketSchema.index({ user: 1, deletedByUser: 1, createdAt: -1 });
TicketSchema.index({ status: 1, priority: 1, updatedAt: -1 });
TicketSchema.index({ lastUserActivityAt: -1 });
TicketSchema.index({ lastAdminReplyAt: -1 });
TicketSchema.index({ deletedByUser: 1, status: 1, updatedAt: -1 });
TicketSchema.index({ deletedByUser: 1, updatedAt: -1 });
TicketSchema.index({ deletedByUser: 1, createdAt: -1 });
TicketSchema.index({ deletedByUser: 1, priority: -1, updatedAt: -1 });
TicketSchema.index({ category: 1, status: 1, deletedByUser: 1 });
TicketSchema.index({ title: 'text', tags: 'text' });
TicketSchema.index({ user: 1, deletedByUser: 1, status: 1, updatedAt: -1 });
TicketSchema.index({ user: 1, deletedByUser: 1, category: 1, updatedAt: -1 });
TicketSchema.index({ status: 1, createdAt: -1 });

TicketSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('ticket');
  }
  next();
});

TicketSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
