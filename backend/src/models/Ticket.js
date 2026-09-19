const mongoose = require('mongoose');

// _id is enabled by default — each message now has a unique ID

const TicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 100, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
  tags: { type: [String], default: [] },
  deletedByUser: { type: Boolean, default: false },
  // Unread tracking: when was the last message sent by each party
  lastUserActivityAt: { type: Date, default: null },
  lastAdminReplyAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TicketSchema.index({ user: 1, status: 1, createdAt: -1 });
TicketSchema.index({ status: 1, priority: 1, updatedAt: -1 });
TicketSchema.index({ lastUserActivityAt: -1 });
TicketSchema.index({ lastAdminReplyAt: -1 });

// Enterprise Optimization (ISO 25010 Performance): Indexes for /counts aggregation and list filtering
TicketSchema.index({ deletedByUser: 1, status: 1, updatedAt: -1 });
TicketSchema.index({ category: 1, status: 1, deletedByUser: 1 });
TicketSchema.index({ title: 'text', tags: 'text' });
TicketSchema.index({ user: 1, deletedByUser: 1, status: 1, updatedAt: -1 });
TicketSchema.index({ user: 1, deletedByUser: 1, category: 1, updatedAt: -1 });

TicketSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);


