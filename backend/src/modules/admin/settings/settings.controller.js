const { z } = require('zod');
const { getSettings, updateSettings } = require('./settings.service');
const AppError = require('../../../../utils/AppError');
const { writeAudit } = require('../../../../middleware/audit');

const settingsPayloadSchema = z.object({
  siteName: z.string().min(1, 'Site name must be at least 1 character').max(100, 'Site name must be less than 100 characters').regex(/^[^<>]*$/, 'Site name cannot contain HTML tags').optional(),
  siteIcon: z.string().max(500, 'Icon path must be less than 500 characters').optional(),
  referrals: z.object({
    referrerCoins: z.coerce.number().int().min(0).max(1000000).optional(),
    referredCoins: z.coerce.number().int().min(0).max(1000000).optional(),
    customCodeMinInvites: z.coerce.number().int().min(0).max(1000000).optional(),
  }).optional(),
  auth: z.object({
    emailLogin: z.coerce.boolean().optional(),
    emailVerification: z.coerce.boolean().optional(),
    discord: z.object({
      enabled: z.coerce.boolean().optional(),
      autoJoin: z.coerce.boolean().optional(),
      clientId: z.string().max(200, 'Discord Client ID must be less than 200 characters').optional(),
      clientSecret: z.string().max(200, 'Discord Client Secret must be less than 200 characters').optional(),
      redirectUri: z.string().max(500, 'Discord redirect URI must be less than 500 characters').optional().or(z.literal('')),
      botToken: z.string().max(200, 'Discord Bot Token must be less than 200 characters').optional(),
      guildId: z.string().max(50, 'Discord Guild ID must be less than 50 characters').optional(),
    }).optional(),
    google: z.object({
      enabled: z.coerce.boolean().optional(),
      clientId: z.string().max(200, 'Google Client ID must be less than 200 characters').optional(),
      clientSecret: z.string().max(200, 'Google Client Secret must be less than 200 characters').optional(),
      redirectUri: z.string().max(500, 'Google redirect URI must be less than 500 characters').optional().or(z.literal('')),
    }).optional(),
  }).optional(),
  localization: z.object({
    currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters').optional(),
    timezone: z.string().refine((tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch (e) {
        return false;
      }
    }, 'Invalid IANA timezone').optional(),
  }).optional(),
  payments: z.object({
    smtp: z.object({
      enabled: z.coerce.boolean().optional(),
      host: z.string().min(1).max(200).optional(),
      port: z.coerce.number().int().min(1).max(65535).optional(),
      secure: z.coerce.boolean().optional(),
      user: z.string().max(200).optional(),
      pass: z.string().max(500).optional(),
      fromEmail: z.string().email().optional(),
    }).optional(),
    paypal: z.object({
      enabled: z.coerce.boolean().optional(),
      mode: z.enum(['sandbox', 'live'], 'Invalid PayPal mode').optional(),
      clientId: z.string().max(200, 'Client ID must be less than 200 characters').optional(),
      clientSecret: z.string().max(200, 'Client secret must be less than 200 characters').optional(),
      webhookId: z.string().max(100, 'Webhook ID must be less than 100 characters').optional(),
      returnUrl: z.string().max(1000, 'Return URL must be less than 1000 characters').optional().or(z.literal('')),
      cancelUrl: z.string().max(1000, 'Cancel URL must be less than 1000 characters').optional().or(z.literal('')),
    }).optional(),
  }).optional(),
  defaults: z.object({
    cpuPercent: z.coerce.number().int('CPU percent must be a whole number').min(0, 'CPU percent cannot be negative').max(1000000, 'CPU percent exceeds maximum allowed').optional(),
    memoryMb: z.coerce.number().int('Memory must be a whole number').min(0, 'Memory cannot be negative').max(100000000, 'Memory exceeds maximum allowed').optional(),
    diskMb: z.coerce.number().int('Disk must be a whole number').min(0, 'Disk cannot be negative').max(100000000, 'Disk exceeds maximum allowed').optional(),
    serverSlots: z.coerce.number().int('Server slots must be a whole number').min(0, 'Server slots cannot be negative').max(100000, 'Server slots exceeds maximum allowed').optional(),
    backups: z.coerce.number().int('Backups must be a whole number').min(0, 'Backups cannot be negative').max(100000, 'Backups exceeds maximum allowed').optional(),
    allocations: z.coerce.number().int('Allocations must be a whole number').min(0, 'Allocations cannot be negative').max(100000, 'Allocations exceeds maximum allowed').optional(),
    databases: z.coerce.number().int('Databases must be a whole number').min(0, 'Databases cannot be negative').max(100000, 'Databases exceeds maximum allowed').optional(),
    coins: z.coerce.number().int('Coins must be a whole number').min(0, 'Coins cannot be negative').max(1000000000, 'Coins exceeds maximum allowed').optional(),
  }).optional(),
  adsense: z.object({
    enabled: z.coerce.boolean().optional(),
    publisherId: z.string()
      .max(50, 'Publisher ID must be less than 50 characters')
      .regex(/^ca-pub-\d{10,16}$/, 'Invalid publisher ID format. Must be ca-pub- followed by 10-16 digits')
      .optional(),
    adSlots: z.object({
      header: z.string()
        .max(100, 'Header ad slot must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_\s-]*$/, 'Ad slot ID can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
      sidebar: z.string()
        .max(100, 'Sidebar ad slot must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_\s-]*$/, 'Ad slot ID can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
      footer: z.string()
        .max(100, 'Footer ad slot must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_\s-]*$/, 'Ad slot ID can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
      content: z.string()
        .max(100, 'Content ad slot must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_\s-]*$/, 'Ad slot ID can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
      mobile: z.string()
        .max(100, 'Mobile ad slot must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_\s-]*$/, 'Ad slot ID can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
    }).optional(),
    adTypes: z.object({
      display: z.coerce.boolean().optional(),
      text: z.coerce.boolean().optional(),
      link: z.coerce.boolean().optional(),
      inFeed: z.coerce.boolean().optional(),
      inArticle: z.coerce.boolean().optional(),
      matchedContent: z.coerce.boolean().optional(),
    }).optional(),
  }).optional(),
});

async function getSettingsHandler(req, res, next) {
  try {
    const data = await getSettings();
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateSettingsHandler(req, res, next) {
  try {
    const parsed = settingsPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid payload', 400, parsed.error.flatten());
    }

    const { response, changes, settingsId } = await updateSettings(parsed.data);

    await writeAudit(req, 'admin.settings.update', 'settings', settingsId, { changes });

    return res.json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSettingsHandler, updateSettingsHandler };
