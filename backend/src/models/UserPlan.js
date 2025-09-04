const mongoose = require('mongoose');

const userPlanSchema = new mongoose.Schema({
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
  
  // Purchase details
  purchaseDate: { type: Date, default: Date.now },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime'],
    required: true 
  },
  amount: { type: Number, required: true }, // Amount paid
  
  // Plan status
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Expiration (for non-lifetime plans)
  expiresAt: { type: Date }, // null for lifetime plans
  
  // Billing configuration
  isRenewable: { type: Boolean, default: true },
  isLifetime: { type: Boolean, default: false },
  
  // Resources given to user (snapshot at purchase time)
  resources: {
    cpuPercent: { type: Number, default: 0 },
    memoryMb: { type: Number, default: 0 },
    diskMb: { type: Number, default: 0 },
    swapMb: { type: Number, default: -1 },
    blockIoProportion: { type: Number, default: 0 },
    cpuPinning: { type: String, default: '' },
    additionalAllocations: { type: Number, default: 0 },
    databases: { type: Number, default: 0 },
    backups: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    serverLimit: { type: Number, default: 0 }
  },
  
  // Coupon used (if any)
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  
  // Notes
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Index for efficient queries
userPlanSchema.index({ userId: 1, status: 1 });
userPlanSchema.index({ planId: 1, status: 1 });
userPlanSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('UserPlan', userPlanSchema);


