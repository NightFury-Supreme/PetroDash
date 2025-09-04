const mongoose = require('mongoose');

const DefaultResourcesSchema = new mongoose.Schema(
  {
    cpuPercent: { type: Number, default: 80 },
    memoryMb: { type: Number, default: 2048 },
    diskMb: { type: Number, default: 5120 },
    serverSlots: { type: Number, default: 1 },
    backups: { type: Number, default: 0 },
    allocations: { type: Number, default: 0 },
    databases: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DefaultResources', DefaultResourcesSchema);


