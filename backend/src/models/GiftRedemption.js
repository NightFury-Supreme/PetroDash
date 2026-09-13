const mongoose = require('mongoose');

const giftRedemptionSchema = new mongoose.Schema(
  {
    gift: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Security & Integrity: Ensure a user can only redeem a gift once
giftRedemptionSchema.index({ gift: 1, user: 1 }, { unique: true });
// Performance: Fetch redemptions for a specific gift sorted by date
giftRedemptionSchema.index({ gift: 1, redeemedAt: -1 });
// Performance: Identify gifts redeemed by a user
giftRedemptionSchema.index({ user: 1, redeemedAt: -1 });

module.exports = mongoose.model('GiftRedemption', giftRedemptionSchema);
