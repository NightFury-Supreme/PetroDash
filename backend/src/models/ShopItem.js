const mongoose = require('mongoose');

const ShopItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    unit: { type: String, default: '' },
    amountPerUnit: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    maxPerPurchase: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

ShopItemSchema.index({ enabled: 1, key: 1 });

module.exports = mongoose.model('ShopItem', ShopItemSchema);
