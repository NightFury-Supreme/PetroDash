const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    // Pricing
    strikeThroughPrice: { type: Number, default: 0 }, // Original price for display
    pricePerMonth: { type: Number, required: true, min: 0 }, // Actual price per month
    pricePerYear: { type: Number, required: true, min: 0 }, // Price for yearly billing

    // Visibility and availability
    visibility: {
      type: String,
      enum: ['public', 'unlisted'],
      default: 'public'
    },
    availableAt: { type: Date, default: Date.now }, // When plan becomes available
    availableUntil: { type: Date }, // When plan becomes unavailable (null = forever)

    // Stock and limits
    stock: { type: Number, default: 0 }, // 0 = unlimited, -1 = unavailable
    limitPerCustomer: { type: Number, default: 0 }, // 0 = unlimited

    // Category and redirection
    category: { type: String, default: 'Others' },
    redirectionLink: { type: String }, // External checkout link

    // Billing configuration
    billingOptions: {
      renewable: { type: Boolean, default: true }, // Auto-renewal
      nonRenewable: { type: Boolean, default: false }, // One-time access
      lifetime: { type: Boolean, default: false } // Indefinite access
    },
    availableBillingCycles: [
      {
        type: String,
        enum: ['monthly', 'quarterly', 'semi-annual', 'annual']
      }
    ],

    // Plan content (resources given to user)
    productContent: {
      // Recurrent resources (added monthly for renewable plans)
      recurrentResources: {
        cpuPercent: { type: Number, default: 0, min: 0, max: 100 },
        memoryMb: { type: Number, default: 0, min: 0 },
        diskMb: { type: Number, default: 0, min: 0 },
        swapMb: { type: Number, default: -1 }, // -1 for unlimited
        blockIoProportion: { type: Number, default: 0 },
        cpuPinning: { type: String, default: '' }
      },
      // Additional allocations
      additionalAllocations: { type: Number, default: 0 },
      databases: { type: Number, default: 0 },
      backups: { type: Number, default: 0 },
      // Dashboard specific
      coins: { type: Number, default: 0 },
      serverLimit: { type: Number, default: 0 }
    },

    // Staff notes
    staffNotes: { type: String, default: '' },

    // Statistics
    totalPurchases: { type: Number, default: 0 },
    currentUsers: { type: Number, default: 0 },

    // Legacy fields for compatibility
    popular: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Plan', planSchema);
