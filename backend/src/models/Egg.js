const mongoose = require('mongoose');

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
        category: { type: String, required: true },
        icon: { type: String }, // Changed from iconUrl to icon - stores file path
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


