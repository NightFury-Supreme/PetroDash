const { z } = require('zod');

const brandSchema = z.object({
  siteName: z
    .string()
    .min(1, 'Site name must be at least 1 character')
    .max(100, 'Site name must be less than 100 characters')
    .regex(/^[^<>]*$/, 'Site name cannot contain HTML tags')
    .optional(),
  siteIcon: z.string().max(500, 'Icon path must be less than 500 characters').optional().or(z.literal('')),
});

const timezoneRefinement = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (_e) {
    return false;
  }
};

const localizationSchema = z.object({
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().refine(timezoneRefinement, 'Invalid IANA timezone').optional(),
  localization: z.object({
    currency: z.string().min(3).max(3).optional(),
    timezone: z.string().refine(timezoneRefinement, 'Invalid IANA timezone').optional(),
  }).optional(),
});

const discordSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  autoJoin: z.coerce.boolean().optional(),
  clientId: z.string().max(200).optional().or(z.literal('')),
  clientSecret: z.string().max(200).optional().or(z.literal('')),
  redirectUri: z.string().max(500).optional().or(z.literal('')),
  botToken: z.string().max(200).optional().or(z.literal('')),
  guildId: z.string().max(50).optional().or(z.literal('')),
});

const googleSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  clientId: z.string().max(200).optional().or(z.literal('')),
  clientSecret: z.string().max(200).optional().or(z.literal('')),
  redirectUri: z.string().max(500).optional().or(z.literal('')),
});

const authObjectSchema = z.object({
  emailLogin: z.coerce.boolean().optional(),
  emailVerification: z.coerce.boolean().optional(),
  discord: discordSchema.optional(),
  google: googleSchema.optional(),
});

const authSchema = z.object({
  emailLogin: z.coerce.boolean().optional(),
  emailVerification: z.coerce.boolean().optional(),
  discord: discordSchema.optional(),
  google: googleSchema.optional(),
  auth: authObjectSchema.optional(),
});

const smtpObjectSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  host: z.string().min(1).max(200).optional().or(z.literal('')),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  secure: z.coerce.boolean().optional(),
  user: z.string().max(200).optional().or(z.literal('')),
  pass: z.string().max(500).optional().or(z.literal('')),
  fromEmail: z.string().email().optional().or(z.literal('')),
});

const emailSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  host: z.string().min(1).max(200).optional().or(z.literal('')),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  secure: z.coerce.boolean().optional(),
  user: z.string().max(200).optional().or(z.literal('')),
  pass: z.string().max(500).optional().or(z.literal('')),
  fromEmail: z.string().email().optional().or(z.literal('')),
  smtp: smtpObjectSchema.optional(),
  payments: z.object({
    smtp: smtpObjectSchema.optional(),
  }).optional(),
});

const defaultsObjectSchema = z.object({
  cpuPercent: z.coerce.number().int().min(0).max(1000000).optional(),
  memoryMb: z.coerce.number().int().min(0).max(100000000).optional(),
  diskMb: z.coerce.number().int().min(0).max(100000000).optional(),
  serverSlots: z.coerce.number().int().min(0).max(100000).optional(),
  backups: z.coerce.number().int().min(0).max(100000).optional(),
  allocations: z.coerce.number().int().min(0).max(100000).optional(),
  databases: z.coerce.number().int().min(0).max(100000).optional(),
  coins: z.coerce.number().int().min(0).max(1000000000).optional(),
});

const resourcesSchema = z.object({
  cpuPercent: z.coerce.number().int().min(0).max(1000000).optional(),
  memoryMb: z.coerce.number().int().min(0).max(100000000).optional(),
  diskMb: z.coerce.number().int().min(0).max(100000000).optional(),
  serverSlots: z.coerce.number().int().min(0).max(100000).optional(),
  backups: z.coerce.number().int().min(0).max(100000).optional(),
  allocations: z.coerce.number().int().min(0).max(100000).optional(),
  databases: z.coerce.number().int().min(0).max(100000).optional(),
  coins: z.coerce.number().int().min(0).max(1000000000).optional(),
  defaults: defaultsObjectSchema.optional(),
});

const referralsObjectSchema = z.object({
  referrerCoins: z.coerce.number().int().min(0).max(1000000).optional(),
  referredCoins: z.coerce.number().int().min(0).max(1000000).optional(),
  customCodeMinInvites: z.coerce.number().int().min(0).max(1000000).optional(),
});

const referralsSchema = z.object({
  referrerCoins: z.coerce.number().int().min(0).max(1000000).optional(),
  referredCoins: z.coerce.number().int().min(0).max(1000000).optional(),
  customCodeMinInvites: z.coerce.number().int().min(0).max(1000000).optional(),
  referrals: referralsObjectSchema.optional(),
});

const adsenseObjectSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  publisherId: z
    .string()
    .max(50)
    .regex(/^ca-pub-\d{10,16}$/, 'Invalid publisher ID format')
    .optional()
    .or(z.literal('')),
  adSlots: z
    .object({
      header: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
      sidebar: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
      footer: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
      content: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
      mobile: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
    })
    .optional(),
  adTypes: z
    .object({
      display: z.coerce.boolean().optional(),
      text: z.coerce.boolean().optional(),
      link: z.coerce.boolean().optional(),
      inFeed: z.coerce.boolean().optional(),
      inArticle: z.coerce.boolean().optional(),
      matchedContent: z.coerce.boolean().optional(),
    })
    .optional(),
});

const adsenseSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  publisherId: z.string().max(50).regex(/^ca-pub-\d{10,16}$/, 'Invalid publisher ID format').optional().or(z.literal('')),
  adSlots: z.object({
    header: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
    sidebar: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
    footer: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
    content: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
    mobile: z.string().max(100).regex(/^[a-zA-Z0-9_\s-]*$/).optional().or(z.literal('')),
  }).optional(),
  adTypes: z.object({
    display: z.coerce.boolean().optional(),
    text: z.coerce.boolean().optional(),
    link: z.coerce.boolean().optional(),
    inFeed: z.coerce.boolean().optional(),
    inArticle: z.coerce.boolean().optional(),
    matchedContent: z.coerce.boolean().optional(),
  }).optional(),
  adsense: adsenseObjectSchema.optional(),
});

const paypalObjectSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  clientId: z.string().max(200).optional().or(z.literal('')),
  clientSecret: z.string().max(200).optional().or(z.literal('')),
  webhookId: z.string().max(100).optional().or(z.literal('')),
  returnUrl: z.string().max(1000).optional().or(z.literal('')),
  cancelUrl: z.string().max(1000).optional().or(z.literal('')),
});

const paypalSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  clientId: z.string().max(200).optional().or(z.literal('')),
  clientSecret: z.string().max(200).optional().or(z.literal('')),
  webhookId: z.string().max(100).optional().or(z.literal('')),
  returnUrl: z.string().max(1000).optional().or(z.literal('')),
  cancelUrl: z.string().max(1000).optional().or(z.literal('')),
  paypal: paypalObjectSchema.optional(),
  payments: z.object({
    paypal: paypalObjectSchema.optional(),
  }).optional(),
});

module.exports = {
  brandSchema,
  localizationSchema,
  authSchema,
  emailSchema,
  resourcesSchema,
  referralsSchema,
  adsenseSchema,
  paypalSchema,
};
