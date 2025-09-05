const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'PteroDash' },
    siteIconUrl: { type: String, default: '' },
    referrals: {
      referrerCoins: { type: Number, default: 50 },
      referredCoins: { type: Number, default: 25 },
      customCodeMinInvites: { type: Number, default: 10 },
    },
    auth: {
      emailLogin: { type: Boolean, default: true },
      discord: {
        enabled: { type: Boolean, default: false },
        autoJoin: { type: Boolean, default: false },
        clientId: { type: String, default: '' },
        clientSecret: { type: String, default: '' },
        redirectUri: { type: String, default: '' },
        botToken: { type: String, default: '' },
        guildId: { type: String, default: '' },
      },
      google: {
        enabled: { type: Boolean, default: false },
        clientId: { type: String, default: '' },
        clientSecret: { type: String, default: '' },
        redirectUri: { type: String, default: '' },
      },
    },
    payments: {
      paypal: {
        enabled: { type: Boolean, default: false },
        mode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
        clientId: { type: String, default: '' },
        clientSecret: { type: String, default: '' },
        currency: { type: String, default: 'USD' },
        returnUrl: { type: String, default: '' },
        cancelUrl: { type: String, default: '' },
        webhookId: { type: String, default: '' },
        businessName: { type: String, default: '' },
        businessAddress: { type: String, default: '' },
        businessVatId: { type: String, default: '' },
        invoicePrefix: { type: String, default: 'INV-' },
        taxRatePercent: { type: Number, default: 0 },
        taxLabel: { type: String, default: 'Tax' },
        currencyLocale: { type: String, default: 'en-US' },
      },
      smtp: {
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        user: { type: String, default: '' },
        pass: { type: String, default: '' },
        fromEmail: { type: String, default: '' },
      }
    },
    defaults: {
      cpuPercent: { type: Number, default: 80 },
      memoryMb: { type: Number, default: 2048 },
      diskMb: { type: Number, default: 5120 },
      serverSlots: { type: Number, default: 1 },
      backups: { type: Number, default: 0 },
      allocations: { type: Number, default: 0 },
      databases: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);


