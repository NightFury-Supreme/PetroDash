const mongoose = require('mongoose');

const ShopItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // diskMb, memoryMb, cpuPercent, backups, databases, allocations, serverSlots
    name: { type: String, required: true },
    unit: { type: String, default: '' }, // e.g., MB, %, count
    amountPerUnit: { type: Number, required: true }, // how much limit increases per quantity (e.g., 512 MB)
    pricePerUnit: { type: Number, required: true }, // coins per quantity
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    maxPerPurchase: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopItem', ShopItemSchema);


