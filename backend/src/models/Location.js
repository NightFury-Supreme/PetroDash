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
        flag: { type: String, default: '' }, // Changed from flagUrl to flag - stores file path
        latencyUrl: { type: String, default: '' }, // Keep latencyUrl as it's for ping testing, not a file
        serverLimit: { type: Number, default: 0 },
        platform: { type: PlatformSettingsSchema, default: () => ({}) },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Location', LocationSchema);




