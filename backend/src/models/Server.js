const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const ServerSchema = new mongoose.Schema(
    {
        publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('server') },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        panelServerId: { type: Number, index: true },
        identifier: { type: String, default: null },
        name: { type: String, required: true },
        eggId: { type: mongoose.Schema.Types.ObjectId, ref: 'Egg', required: true },
        locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
        limits: {
            diskMb: Number,
            memoryMb: Number,
            cpuPercent: Number,
            backups: Number,
            databases: Number,
            allocations: Number,
        },
        priority: { type: Number, default: 0 },
        status: { type: String, enum: ['queued', 'creating', 'active', 'error', 'deleting', 'suspended'], default: 'creating' },
        suspended: { type: Boolean, default: false },
        suspendedUntil: { type: Date, default: null },
        suspensionReason: { type: String, default: null },
    },
    { timestamps: true }
);

ServerSchema.index({ owner: 1 });
ServerSchema.index({ owner: 1, createdAt: -1 });
ServerSchema.index({ owner: 1, status: 1 });
ServerSchema.index({ locationId: 1 });
ServerSchema.index({ eggId: 1 });
ServerSchema.index({ status: 1, locationId: 1 });
ServerSchema.index({ status: 1, eggId: 1 });
ServerSchema.index({ status: 1, priority: -1, createdAt: 1 });
ServerSchema.index({ status: 1, createdAt: -1 });
ServerSchema.index({ status: 1, suspendedUntil: 1 });
ServerSchema.index({ createdAt: -1 });
ServerSchema.index({ panelServerId: 1, status: 1 });
ServerSchema.index({ identifier: 1 }, { sparse: true });

ServerSchema.pre('validate', function (next) {
    if (!this.publicId) {
        this.publicId = generatePublicId('server');
    }
    next();
});

module.exports = mongoose.model('Server', ServerSchema);
