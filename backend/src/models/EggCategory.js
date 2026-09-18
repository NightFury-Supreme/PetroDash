const mongoose = require('mongoose');

const EggCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EggCategory', EggCategorySchema);
