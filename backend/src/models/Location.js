const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

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
        publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('location') },
        name: { type: String, required: true },
        flag: { type: String, default: '' },
        latencyUrl: { type: String, default: '' },
        serverLimit: { type: Number, default: 0 },
        platform: { type: PlatformSettingsSchema, default: () => ({}) },
        allowedPlans: { type: [String], default: [] },
    },
    { timestamps: true }
);

LocationSchema.index({ createdAt: -1 });

LocationSchema.pre('validate', function (next) {
    if (!this.publicId) {
        this.publicId = generatePublicId('location');
    }
    next();
});

module.exports = mongoose.model('Location', LocationSchema);




