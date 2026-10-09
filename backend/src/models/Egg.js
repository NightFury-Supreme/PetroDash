const mongoose = require('mongoose');
require('./EggCategory');

const EnvironmentVarSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

const EggSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'EggCategory', required: true },
        icon: { type: String, required: true }, // Changed from iconUrl to icon - stores file path
        pterodactylEggId: { type: Number, required: true },
        pterodactylNestId: { type: Number, required: true },
        recommended: { type: Boolean, default: false },
        description: { type: String },
        env: { type: [EnvironmentVarSchema], default: [] },
        allowedPlans: { type: [String], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Egg', EggSchema);


