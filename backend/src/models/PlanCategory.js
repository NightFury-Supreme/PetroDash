const mongoose = require('mongoose');

const PlanCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PlanCategory', PlanCategorySchema);
