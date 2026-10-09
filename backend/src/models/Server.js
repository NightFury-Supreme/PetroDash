const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        panelServerId: { type: Number, index: true },
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
        status: { type: String, enum: ['queued', 'creating', 'active', 'error', 'deleting'], default: 'creating' },
    },
    { timestamps: true }
);

// Indexes for common queries
ServerSchema.index({ owner: 1 });
ServerSchema.index({ locationId: 1 });

module.exports = mongoose.model('Server', ServerSchema);




