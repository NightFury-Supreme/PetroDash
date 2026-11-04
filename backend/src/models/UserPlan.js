const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const userPlanSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('userPlan') },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  purchaseDate: { type: Date, default: Date.now },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime'],
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  expiresAt: { type: Date },
  isRenewable: { type: Boolean, default: true },
  isLifetime: { type: Boolean, default: false },
  resources: {
    cpuPercent: { type: Number, default: 0 },
    memoryMb: { type: Number, default: 0 },
    diskMb: { type: Number, default: 0 },
    additionalAllocations: { type: Number, default: 0 },
    databases: { type: Number, default: 0 },
    backups: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    serverLimit: { type: Number, default: 0 }
  },
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  notes: { type: String, default: '', select: false }
}, {
  timestamps: true
});

userPlanSchema.index({ userId: 1, status: 1 });
userPlanSchema.index({ planId: 1, status: 1 });
userPlanSchema.index({ expiresAt: 1, status: 1 });
userPlanSchema.index({ status: 1, createdAt: -1 });
userPlanSchema.index({ createdAt: -1 });

userPlanSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('userPlan');
  }
  next();
});

module.exports = mongoose.model('UserPlan', userPlanSchema);
