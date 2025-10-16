const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Settings = require('../../models/Settings');
const DefaultResources = require('../../models/DefaultResources');
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
  } catch (error) {
    throw new Error('Failed to access settings database');
  }
}

// GET /api/admin/settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    const settings = await getOrCreate();
    const out = settings.toObject();
    
    // Hide deprecated and sensitive fields
    delete out.themePrimary;
    delete out.__v;
    
    return res.json(out);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch settings',
      message: 'An internal server error occurred'
    });
  }
});

// Validation schema for settings payload
const settingsPayloadSchema = z.object({
  siteName: z.string().min(1, 'Site name must be at least 1 character').max(100, 'Site name must be less than 100 characters').optional(),
  siteIcon: z.string().max(500, 'Icon path must be less than 500 characters').optional(), // Changed from siteIconUrl
  referrals: z.object({
    referrerCoins: z.coerce.number().int().min(0).max(1000000).optional(),
    referredCoins: z.coerce.number().int().min(0).max(1000000).optional(),
    customCodeMinInvites: z.coerce.number().int().min(0).max(1000000).optional(),
  }).optional(),
  auth: z.object({
    emailLogin: z.coerce.boolean().optional(),
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
  payments: z.object({
    paypal: z.object({
      enabled: z.coerce.boolean().optional(),
      mode: z.enum(['sandbox', 'live'], 'Invalid PayPal mode').optional(),
      clientId: z.string().max(200, 'Client ID must be less than 200 characters').optional(),
      clientSecret: z.string().max(200, 'Client secret must be less than 200 characters').optional(),
      currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters').optional(),
      webhookId: z.string().max(100, 'Webhook ID must be less than 100 characters').optional(),
      returnUrl: z.string().url('Invalid return URL format').optional(),
      cancelUrl: z.string().url('Invalid cancel URL format').optional(),
    }).optional(),
  }).optional(),
  defaults: z.object({
    cpuPercent: z.coerce.number().int('CPU percent must be a whole number').min(0, 'CPU percent cannot be negative').max(100, 'CPU percent cannot exceed 100%').optional(),
    memoryMb: z.coerce.number().int('Memory must be a whole number').min(0, 'Memory cannot be negative').max(1000000, 'Memory cannot exceed 1TB').optional(),
    diskMb: z.coerce.number().int('Disk must be a whole number').min(0, 'Disk cannot be negative').max(10000000, 'Disk cannot exceed 10TB').optional(),
    serverSlots: z.coerce.number().int('Server slots must be a whole number').min(0, 'Server slots cannot be negative').max(1000, 'Server slots cannot exceed 1000').optional(),
    backups: z.coerce.number().int('Backups must be a whole number').min(0, 'Backups cannot be negative').max(1000, 'Backups cannot exceed 1000').optional(),
    allocations: z.coerce.number().int('Allocations must be a whole number').min(0, 'Allocations cannot be negative').max(10000, 'Allocations cannot exceed 10000').optional(),
    databases: z.coerce.number().int('Databases must be a whole number').min(0, 'Databases cannot be negative').max(1000, 'Databases cannot exceed 1000').optional(),
    coins: z.coerce.number().int('Coins must be a whole number').min(0, 'Coins cannot be negative').max(1000000, 'Coins cannot exceed 1 million').optional(),
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

    const settings = await getOrCreate();
    const update = { ...parsed.data };

    // Explicitly ignore deprecated fields
    delete update.themePrimary;

    // Deep-merge payments.paypal to avoid clobbering other fields
    if (update.payments && update.payments.paypal) {
      settings.payments = settings.payments || {};
      settings.payments.paypal = { ...(settings.payments.paypal || {}), ...update.payments.paypal };
      delete update.payments.paypal;
    }
    if (update.payments && Object.keys(update.payments).length === 0) {
      delete update.payments;
    }

    // Deep-merge auth settings to avoid clobbering other fields
    if (update.auth) {
      settings.auth = settings.auth || {};
      if (update.auth.emailLogin !== undefined) {
        settings.auth.emailLogin = update.auth.emailLogin;
      }
      if (update.auth.discord) {
        settings.auth.discord = { ...(settings.auth.discord || {}), ...update.auth.discord };
      }
      if (update.auth.google) {
        settings.auth.google = { ...(settings.auth.google || {}), ...update.auth.google };
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
        settings.adsense.adSlots = { ...(settings.adsense.adSlots || {}), ...update.adsense.adSlots };
      }
      if (update.adsense.adTypes) {
        settings.adsense.adTypes = { ...(settings.adsense.adTypes || {}), ...update.adsense.adTypes };
      }
      delete update.adsense;
    }


    // Apply remaining shallow updates
    Object.assign(settings, update);
    
    // Validate business logic
    if (update.defaults) {
      if (update.defaults.cpuPercent && update.defaults.cpuPercent > 100) {
        return res.status(400).json({
          error: 'Invalid CPU percentage',
          message: 'CPU percentage cannot exceed 100%'
        });
      }
      
      if (update.defaults.memoryMb && update.defaults.memoryMb < 128) {
        return res.status(400).json({
          error: 'Invalid memory allocation',
          message: 'Memory must be at least 128MB'
        });
      }
      
      if (update.defaults.diskMb && update.defaults.diskMb < 512) {
        return res.status(400).json({
          error: 'Invalid disk allocation',
          message: 'Disk must be at least 512MB'
        });
      }
    }

    // Save settings
    await settings.save();

    // Reconfigure OAuth strategies if auth settings were updated
    if (update.auth) {
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
    delete response.__v;
    
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


