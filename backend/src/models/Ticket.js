const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    internal: { type: Boolean, default: false }, // admin-only note
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const TicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 100, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
  messages: { type: [TicketMessageSchema], default: [] },
  tags: { type: [String], default: [] },
  deletedByUser: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TicketSchema.index({ user: 1, status: 1, createdAt: -1 });
TicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

TicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
