const mongoose = require('mongoose');

const PlatformSettingsSchema = new mongoose.Schema(
    {
        platformLocationId: { type: String },
        swapMb: { type: Number, default: -1 },
        blockIoWeight: { type: Number, default: 500 },
        cpuPinning: { type: String, default: '' },
    },
    { _id: false }
);

const LocationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        flagUrl: { type: String, default: '' },
        latencyUrl: { type: String, default: '' },
        serverLimit: { type: Number, default: 0 },
        platform: { type: PlatformSettingsSchema, default: () => ({}) },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Location', LocationSchema);




