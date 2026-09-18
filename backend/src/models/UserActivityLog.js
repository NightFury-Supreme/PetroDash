const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  ip: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Automatically delete logs older than 90 days to save space
userActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const UserActivityLog = mongoose.models.UserActivityLog || mongoose.model('UserActivityLog', userActivityLogSchema);
module.exports = UserActivityLog;
