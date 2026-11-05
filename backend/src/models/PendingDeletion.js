const mongoose = require('mongoose');

const pendingDeletionSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['server', 'user'],
    required: true
  },
  panelId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Automatically clean up failed deletions after 30 days
  }
});

module.exports = mongoose.model('PendingDeletion', pendingDeletionSchema);
