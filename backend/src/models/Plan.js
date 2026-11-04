const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const planSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('plan') },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  strikeThroughPrice: { type: Number, default: 0 },
  pricePerMonth: { type: Number, required: true, min: 0 },
  pricePerYear: { type: Number, default: 0, min: 0 },
  
  visibility: { 
    type: String, 
    enum: ['public', 'unlisted'], 
    default: 'public' 
  },
  availableAt: { type: Date, default: Date.now },
  availableUntil: { type: Date },
  
  stock: { type: Number, default: 0 },
  limitPerCustomer: { type: Number, default: 0 },
  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanCategory', required: true },
  redirectionLink: { type: String },
  
  billingOptions: {
    renewable: { type: Boolean, default: true },
    nonRenewable: { type: Boolean, default: false },
    lifetime: { type: Boolean, default: false }
  },
  availableBillingCycles: [{
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual']
  }],
  
  productContent: {
    recurrentResources: {
      cpuPercent: { type: Number, default: 0, min: 0 },
      memoryMb: { type: Number, default: 0, min: 0 },
      diskMb: { type: Number, default: 0, min: 0 }
    },
    additionalAllocations: { type: Number, default: 0 },
    databases: { type: Number, default: 0 },
    backups: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    serverLimit: { type: Number, default: 0 }
  },
  
  staffNotes: { type: String, default: '', select: false },
  
  totalPurchases: { type: Number, default: 0 },
  currentUsers: { type: Number, default: 0 },
  
  popular: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

planSchema.index({ visibility: 1, enabled: 1, popular: -1, sortOrder: 1, createdAt: -1 });
planSchema.index({ category: 1 });

planSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('plan');
  }
  next();
});

module.exports = mongoose.model('Plan', planSchema);
