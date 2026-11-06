const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const userSessionSchema = new mongoose.Schema({
  publicId: {
    type: String,
    unique: true,
    sparse: true,
    default: () => generatePublicId('userSession'),
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  device: {
    type: String,
    default: 'Unknown Device',
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: {
    type: String,
    default: 'Unknown Browser',
  },
  ip: {
    type: String,
    default: 'Unknown IP',
  },
  location: {
    type: String,
    default: 'Unknown Location',
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
userSessionSchema.index({ userId: 1, lastActive: -1 });

userSessionSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('userSession');
  }
  next();
});

const UserSession = mongoose.model('UserSession', userSessionSchema);

module.exports = UserSession;
