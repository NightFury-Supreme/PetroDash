const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  paypalSubscriptionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active','paused','canceled','past_due','incomplete','trialing'], default: 'active' },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  trialEnd: { type: Date },
  lastInvoiceNumber: { type: String },
  couponCode: { type: String },
  pendingChange: { type: Object },
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);


