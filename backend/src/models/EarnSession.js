const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const EarnSessionSchema = new mongoose.Schema(
  {
    publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('earnSession') },
    userId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true, index: true },
    method: { type: String, enum: ['linkvertise'], required: true, index: true },
    status: { type: String, enum: ['started', 'completed', 'expired'], default: 'started', index: true },
    rewardCoins: { type: Number, default: 0 },
    provider: { type: String },
    providerTxId: { type: String },
    startedAt: { type: Date, default: () => new Date(), index: true },
    availableAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    completedAt: { type: Date, default: null },
    creditedAt: { type: Date, default: null },
    secret: { type: String, default: '', select: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

EarnSessionSchema.index({ userId: 1, createdAt: -1 });
EarnSessionSchema.index({ userId: 1, method: 1, createdAt: -1 });
EarnSessionSchema.index({ status: 1, creditedAt: 1, createdAt: -1 });
EarnSessionSchema.index({ method: 1, status: 1, createdAt: -1 });
EarnSessionSchema.index(
  { provider: 1, providerTxId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      provider: { $type: 'string' },
      providerTxId: { $type: 'string' },
    },
  }
);
EarnSessionSchema.index({ createdAt: -1 });

EarnSessionSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('earnSession');
  }
  next();
});

module.exports = mongoose.model('EarnSession', EarnSessionSchema);
