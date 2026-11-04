const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const UserSchema = new mongoose.Schema(
    {
        publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('user') },
        email: { type: String, required: true, unique: true, index: true },
        username: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passwordHash: { type: String, select: false },
        profilePicture: { type: String, default: '' },
        
        tfaSecret: { type: String, default: null, select: false },
        tfaEnabled: { type: Boolean, default: false },
        tfaBackupCodes: { type: [String], select: false },
        
        oauthProviders: {
            discord: {
                id: { type: String },
                username: { type: String },
                discriminator: { type: String },
                avatar: { type: String },
            },
            google: {
                id: { type: String },
                name: { type: String },
                email: { type: String },
                picture: { type: String },
            },
        },
        pterodactylUserId: { type: Number },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        coins: { type: Number, default: 0 },
        serverLock: { type: Date, default: null },
        emailVerified: { type: Boolean, default: false },
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        referralRewardReceived: { type: Boolean, default: false },
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
            until: { type: Date, default: null },
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        },
    },
    { timestamps: true }
);

UserSchema.index({ referredBy: 1 });
UserSchema.index({ referredBy: 1, createdAt: -1 });
UserSchema.index({ 'oauthProviders.discord.id': 1 }, { sparse: true });
UserSchema.index({ 'oauthProviders.google.id': 1 }, { sparse: true });

UserSchema.pre('validate', function (next) {
    if (!this.publicId) {
        this.publicId = generatePublicId('user');
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
