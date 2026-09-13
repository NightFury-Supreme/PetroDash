const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Settings = require('../../models/Settings');
const DefaultResources = require('../../models/DefaultResources');
const { clearSettingsCache } = require('../../lib/settings');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { reconfigureStrategies } = require('../auth/oauth');

const router = express.Router();

// Rate limiting for settings endpoint
const settingsRateLimiter = createRateLimiter(50, 15 * 60 * 1000); // 50 requests per 15 minutes
router.use('/', settingsRateLimiter);

async function getOrCreate() {
  try {
    let doc = await Settings.findOne({});
    if (!doc) {
      doc = await Settings.create({});
    }
    return doc;
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    throw new Error('Failed to access settings database');
  }
}

// GET /api/admin/settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:settings');
    if (cached) return res.json(cached);

    // Fetch Global Settings and SMTP settings in parallel for optimized latency (ISO 25010)
    const Email = require('../../models/Email');
    const [settings, emailSettings] = await Promise.all([
      getOrCreate(),
      Email.getOrCreate()
    ]);

    const out = settings.toObject();
    
    out.payments = out.payments || {};
    out.payments.smtp = emailSettings.smtp || {};

    out.auth = out.auth || {};
    out.auth.emailLogin = out.auth.emailLogin ?? true;
    out.auth.emailVerification = out.auth.emailVerification ?? false;
    
    // Hide deprecated and sensitive fields
    delete out.themePrimary;
    delete out.__v;
    delete out.earn;
    delete out.ticketCategories;
    
    // Mask secrets for API transport (OWASP ASVS Write-Only Pattern)
    if (out.auth?.discord?.clientSecret) out.auth.discord.clientSecret = '***';
    if (out.auth?.discord?.botToken) out.auth.discord.botToken = '***';
    if (out.auth?.google?.clientSecret) out.auth.google.clientSecret = '***';
    if (out.payments?.paypal?.clientSecret) out.payments.paypal.clientSecret = '***';
    if (out.payments?.smtp?.pass) out.payments.smtp.pass = '***';
    
    await setCache('admin:settings', out, 30);
    return res.json(out);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch settings',
      message: 'An internal server error occurred'
    });
  }
});

// Validation schema for settings payload
const settingsPayloadSchema = z.object({
  siteName: z.string().min(1, 'Site name must be at least 1 character').max(100, 'Site name must be less than 100 characters').regex(/^[^<>]*$/, 'Site name cannot contain HTML tags').optional(),
  siteIcon: z.string().max(500, 'Icon path must be less than 500 characters').optional(), // Changed from siteIconUrl
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
      // eslint-disable-next-line unused-imports/no-unused-vars
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

// PATCH /api/admin/settings
router.patch('/', requireAdmin, async (req, res) => {
  try {
    // Validate and sanitize payload
    const parsed = settingsPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten()
      });
    }

    // Strip masked secrets so we don't accidentally overwrite real secrets with '***'
    if (parsed.data.auth?.discord?.clientSecret === '***') delete parsed.data.auth.discord.clientSecret;
    if (parsed.data.auth?.discord?.botToken === '***') delete parsed.data.auth.discord.botToken;
    if (parsed.data.auth?.google?.clientSecret === '***') delete parsed.data.auth.google.clientSecret;
    if (parsed.data.payments?.paypal?.clientSecret === '***') delete parsed.data.payments.paypal.clientSecret;
    if (parsed.data.payments?.smtp?.pass === '***') delete parsed.data.payments.smtp.pass;

    const settings = await getOrCreate();
    const originalSettings = settings.toObject();
    const update = { ...parsed.data };
    let authUpdated = false;

    // Explicitly ignore deprecated fields
    delete update.themePrimary;

    // Deep-merge payments.paypal to avoid clobbering other fields
    if (update.payments) {
      if (update.payments.paypal) {
        settings.payments = settings.payments || {};
        settings.payments.paypal = { ...(originalSettings.payments?.paypal || {}), ...update.payments.paypal };
        delete update.payments.paypal;
      }
      if (update.payments.smtp) {
        const Email = require('../../models/Email');
        let emailSettings = await Email.findOne({});
        if (!emailSettings) emailSettings = await Email.create({});
        const originalEmailSettings = emailSettings.toObject();
        emailSettings.smtp = { ...(originalEmailSettings.smtp || {}), ...update.payments.smtp };
        await emailSettings.save();
        const { deleteCachePattern } = require('../../lib/redis');
        await deleteCachePattern('email:settings');
        await deleteCachePattern('api:email:settings');
        delete update.payments.smtp;
      }
    }
    if (update.payments && Object.keys(update.payments).length === 0) {
      delete update.payments;
    }

    // Deep-merge auth settings to avoid clobbering other fields
    if (update.auth) {
      authUpdated = true;
      settings.auth = settings.auth || {};
      if (update.auth.emailLogin !== undefined) {
        settings.auth.emailLogin = update.auth.emailLogin;
      }
      if (update.auth.emailVerification !== undefined) {
        settings.auth.emailVerification = update.auth.emailVerification;
      }
      if (update.auth.discord) {
        settings.auth.discord = { ...(originalSettings.auth?.discord || {}), ...update.auth.discord };
      }
      if (update.auth.google) {
        settings.auth.google = { ...(originalSettings.auth?.google || {}), ...update.auth.google };
      }
      delete update.auth;
    }

    // Deep-merge adsense settings to avoid clobbering other fields
    if (update.adsense) {
      settings.adsense = settings.adsense || {};
      if (update.adsense.enabled !== undefined) {
        settings.adsense.enabled = update.adsense.enabled;
      }
      if (update.adsense.publisherId !== undefined) {
        settings.adsense.publisherId = update.adsense.publisherId;
      }
      if (update.adsense.adSlots) {
        settings.adsense.adSlots = { ...(originalSettings.adsense?.adSlots || {}), ...update.adsense.adSlots };
      }
      if (update.adsense.adTypes) {
        settings.adsense.adTypes = { ...(originalSettings.adsense?.adTypes || {}), ...update.adsense.adTypes };
      }
      delete update.adsense;
    }


    // Apply remaining shallow updates
    Object.assign(settings, update);

    const isValidUrl = (v) => {
      try {
        const s = String(v || '').trim();
        if (!s) return false;
        // Allow relative URLs starting with /
        if (s.startsWith('/')) return true;
        new URL(s);
        return true;
      } catch {
        return false;
      }
    };

    const paypalCfg = settings?.payments?.paypal || {};
    if (paypalCfg?.enabled) {
      const returnUrl = String(paypalCfg.returnUrl || '').trim();
      const cancelUrl = String(paypalCfg.cancelUrl || '').trim();
      // Only validate if a URL was explicitly provided — empty means "use FRONTEND_URL default"
      if (returnUrl && !isValidUrl(returnUrl)) {
        return res.status(400).json({ error: 'Invalid payload', details: { formErrors: [], fieldErrors: { payments: ['Invalid return URL format'] } } });
      }
      if (cancelUrl && !isValidUrl(cancelUrl)) {
        return res.status(400).json({ error: 'Invalid payload', details: { formErrors: [], fieldErrors: { payments: ['Invalid cancel URL format'] } } });
      }
    }

    
    // Save settings
    await settings.save();
    await clearSettingsCache();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:settings');
    await deleteCachePattern('auth:oauth:status');
    await deleteCachePattern('api:ads');

    // Reconfigure OAuth strategies if auth settings were updated
    if (authUpdated) {
      try {
        await reconfigureStrategies();
      } catch (error) {
        console.error('Failed to reconfigure OAuth strategies after settings update:', error);
        // Don't fail the entire request if OAuth reconfiguration fails
      }
    }

    // If defaults provided, mirror into DefaultResources for auth/register
    if (parsed.data?.defaults) {
      try {
        let defaultResources = await DefaultResources.findOne({});
        if (!defaultResources) {
          defaultResources = await DefaultResources.create({});
        }
        Object.assign(defaultResources, parsed.data.defaults);
        await defaultResources.save();
      } catch (error) {
        console.error('Failed to update default resources:', error);
        // Don't fail the entire request if this fails
      }
    }

    // Return updated settings (excluding sensitive fields)
    const response = settings.toObject();
    
    // Attach SMTP to response
    const EmailResponse = require('../../models/Email');
    const updatedEmailSettings = await EmailResponse.getOrCreate();
    response.payments = response.payments || {};
    response.payments.smtp = updatedEmailSettings.smtp || {};

    delete response.__v;
    
    // Mask secrets for API transport (OWASP ASVS Write-Only Pattern)
    if (response.auth?.discord?.clientSecret) response.auth.discord.clientSecret = '***';
    if (response.auth?.discord?.botToken) response.auth.discord.botToken = '***';
    if (response.auth?.google?.clientSecret) response.auth.google.clientSecret = '***';
    if (response.payments?.paypal?.clientSecret) response.payments.paypal.clientSecret = '***';
    if (response.payments?.smtp?.pass) response.payments.smtp.pass = '***';
    
    const changes = {};
    const sensitiveKeys = ['clientSecret', 'botToken', 'pass', 'webhookId', 'apiKey'];
    const checkDiff = (target, source, original, prefix = '') => {
      for (const k of Object.keys(source || {})) {
        if (typeof source[k] === 'object' && source[k] !== null && !Array.isArray(source[k])) {
          checkDiff(target, source[k], (original[k] || {}), prefix ? `${prefix}.${k}` : k);
        } else {
          const keyName = prefix ? `${prefix}.${k}` : k;
          if (JSON.stringify(original[k]) !== JSON.stringify(source[k])) {
            const isSensitive = sensitiveKeys.includes(k);
            target[keyName] = { 
              old: isSensitive ? (original[k] ? '***' : null) : original[k], 
              new: isSensitive ? (source[k] ? '***' : null) : source[k] 
            };
          }
        }
      }
    };
    checkDiff(changes, parsed.data, originalSettings);

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.settings.update', 'settings', settings._id.toString(), { changes });
    
    return res.json(response);

  } catch (error) {
    console.error('Failed to update settings:', error);
    
    return res.status(500).json({
      error: 'Failed to update settings',
      message: 'An internal server error occurred'
    });
  }
});


module.exports = router;


