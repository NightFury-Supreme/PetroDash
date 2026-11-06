const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const giftRewardSchema = new mongoose.Schema(
  {
    coins: { type: Number, default: 0, min: 0 },
    resources: {
      diskMb: { type: Number, default: 0, min: 0 },
      memoryMb: { type: Number, default: 0, min: 0 },
      cpuPercent: { type: Number, default: 0, min: 0 },
      backups: { type: Number, default: 0, min: 0 },
      databases: { type: Number, default: 0, min: 0 },
      allocations: { type: Number, default: 0, min: 0 },
      serverSlots: { type: Number, default: 0, min: 0 },
    },
    planIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }],
  },
  { _id: false }
);

const giftSchema = new mongoose.Schema(
  {
    publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('gift') },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', maxlength: 100 },
    rewards: { type: giftRewardSchema, default: () => ({}) },
    maxRedemptions: { type: Number, default: 0 },
    redeemedCount: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['admin','user'], default: 'admin' },
  },
  { timestamps: true }
);

giftSchema.index({ createdBy: 1, createdAt: -1 });
giftSchema.index({ createdBy: 1, source: 1, enabled: 1 });
giftSchema.index({ validFrom: 1, validUntil: 1, enabled: 1 });
giftSchema.index({ createdAt: -1 });

giftSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('gift');
  }
  next();
});

module.exports = mongoose.model('Gift', giftSchema);
