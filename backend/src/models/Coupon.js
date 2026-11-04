const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const couponSchema = new mongoose.Schema({
  publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('coupon') },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage','fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  appliesToPlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }],
  maxRedemptions: { type: Number, default: 0 },
  redeemedCount: { type: Number, default: 0 },
  validFrom: { type: Date },
  validUntil: { type: Date },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('coupon');
  }
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);



