const mongoose = require('mongoose');

const VerificationTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true, unique: true },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      default: 'email_verification'
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lockedUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationToken', VerificationTokenSchema);
