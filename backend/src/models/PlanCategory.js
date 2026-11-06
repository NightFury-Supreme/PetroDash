const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const PlanCategorySchema = new mongoose.Schema(
  {
    publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('planCategory') },
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

PlanCategorySchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('planCategory');
  }
  next();
});

module.exports = mongoose.model('PlanCategory', PlanCategorySchema);
