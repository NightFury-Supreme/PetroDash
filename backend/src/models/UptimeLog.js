const mongoose = require('mongoose');

const UptimeLogSchema = new mongoose.Schema(
    {
        nodeId: { type: String, required: true }, // 'panel' or Location ID
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        upChecks: { type: Number, default: 0 },
        downChecks: { type: Number, default: 0 },
        totalChecks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Ensure fast lookup for a specific node on a specific day
UptimeLogSchema.index({ nodeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UptimeLog', UptimeLogSchema);
