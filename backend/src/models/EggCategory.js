const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const EggCategorySchema = new mongoose.Schema(
  {
    publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('eggCategory') },
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

EggCategorySchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('eggCategory');
  }
  next();
});

module.exports = mongoose.model('EggCategory', EggCategorySchema);
