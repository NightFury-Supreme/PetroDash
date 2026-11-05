const mongoose = require('mongoose');

const giftRedemptionSchema = new mongoose.Schema(
  {
    gift: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

giftRedemptionSchema.index({ gift: 1, user: 1 }, { unique: true });
giftRedemptionSchema.index({ gift: 1, redeemedAt: -1 });
giftRedemptionSchema.index({ user: 1, redeemedAt: -1 });

module.exports = mongoose.model('GiftRedemption', giftRedemptionSchema);
