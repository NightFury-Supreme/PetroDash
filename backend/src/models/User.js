const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        username: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passwordHash: { type: String }, // Made optional for OAuth users
        // OAuth providers
        oauthProviders: {
            discord: {
                id: { type: String },
                username: { type: String },
                discriminator: { type: String },
                avatar: { type: String },
                accessToken: { type: String }, // For Discord server joining
            },
            google: {
                id: { type: String },
                name: { type: String },
                email: { type: String },
                picture: { type: String },
                accessToken: { type: String }, // For future Google API calls
            },
        },
        pterodactylUserId: { type: Number },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        coins: { type: Number, default: 0 },
        emailVerified: { type: Boolean, default: false },
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
        ban: {
            isBanned: { type: Boolean, default: false },
            reason: { type: String, default: '' },
            until: { type: Date, default: null }, // null => lifetime
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


