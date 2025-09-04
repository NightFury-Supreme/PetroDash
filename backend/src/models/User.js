const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        username: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passwordHash: { type: String, required: true },
        pterodactylUserId: { type: Number },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        coins: { type: Number, default: 0 },
        // Referrals
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        referralStats: {
            referredCount: { type: Number, default: 0 },
            coinsEarned: { type: Number, default: 0 },
        },
        resources: {
            diskMb: { type: Number, default: 5120 },
            memoryMb: { type: Number, default: 2048 },
            cpuPercent: { type: Number, default: 100 },
            backups: { type: Number, default: 0 },
            databases: { type: Number, default: 0 },
            allocations: { type: Number, default: 1 },
            serverSlots: { type: Number, default: 1 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


