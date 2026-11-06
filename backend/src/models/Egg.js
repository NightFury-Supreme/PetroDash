const mongoose = require('mongoose');
require('./EggCategory');
const { generatePublicId } = require('../utils/publicId');

const EnvironmentVarSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

const EggSchema = new mongoose.Schema(
    {
        publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('egg') },
        name: { type: String, required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'EggCategory', required: true },
        icon: { type: String, required: true },
        pterodactylEggId: { type: Number, required: true },
        pterodactylNestId: { type: Number, required: true },
        recommended: { type: Boolean, default: false },
        description: { type: String },
        env: { type: [EnvironmentVarSchema], default: [] },
        allowedPlans: { type: [String], default: [] },
    },
    { timestamps: true }
);

EggSchema.pre('validate', function (next) {
    if (!this.publicId) {
        this.publicId = generatePublicId('egg');
    }
    next();
});

module.exports = mongoose.model('Egg', EggSchema);


