const mongoose = require('mongoose');

const UptimeLogSchema = new mongoose.Schema(
    {
        nodeId: { type: String, required: true },
        date: { type: String, required: true },
        upChecks: { type: Number, default: 0 },
        downChecks: { type: Number, default: 0 },
        totalChecks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

UptimeLogSchema.index({ nodeId: 1, date: 1 }, { unique: true });
UptimeLogSchema.index({ date: -1, nodeId: 1 });

module.exports = mongoose.model('UptimeLog', UptimeLogSchema);
