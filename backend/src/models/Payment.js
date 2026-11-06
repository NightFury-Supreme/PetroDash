const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const paymentSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('payment') },
  provider: { type: String, enum: ['paypal', 'system'], default: 'paypal', required: true },
  providerOrderId: { type: String, required: true, unique: true },
  providerCaptureId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['CREATED', 'COMPLETED', 'FAILED', 'REFUNDED', 'VOIDED', 'REFUND_REQUIRED'], default: 'CREATED' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('payment');
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
