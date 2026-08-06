const mongoose = require('mongoose');

const EarnSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, enum: ['ads', 'linkvertise'], required: true, index: true },
    status: { type: String, enum: ['started', 'completed', 'expired'], default: 'started', index: true },
    rewardCoins: { type: Number, default: 0 },
    provider: { type: String },
    providerTxId: { type: String },
    startedAt: { type: Date, default: () => new Date(), index: true },
    availableAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    completedAt: { type: Date, default: null },
    creditedAt: { type: Date, default: null },
    secret: { type: String, default: '' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

EarnSessionSchema.index({ userId: 1, createdAt: -1 });
EarnSessionSchema.index({ userId: 1, method: 1, createdAt: -1 });
EarnSessionSchema.index({ status: 1, creditedAt: 1, createdAt: -1 });
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

module.exports = mongoose.model('EarnSession', EarnSessionSchema);
