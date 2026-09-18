const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  provider: { type: String, enum: ['paypal'], required: true },
  providerOrderId: { type: String, required: true, unique: true },
  providerCaptureId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['CREATED', 'COMPLETED', 'FAILED', 'REFUNDED', 'VOIDED'], default: 'CREATED' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound index: userId + status (for mentions query: userId+status=COMPLETED)
paymentSchema.index({ userId: 1, status: 1 });
// Compound index: userId + createdAt (for profile list: userId sorted by createdAt)
paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);



