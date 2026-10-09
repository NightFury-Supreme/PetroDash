const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Email = require('../../models/Email');

const router = express.Router();

function serialize(emailDoc, settingsDoc) {
  const e = emailDoc.toObject ? emailDoc.toObject() : emailDoc;
  const s = settingsDoc.toObject ? settingsDoc.toObject() : settingsDoc;
  return {
    payments: { smtp: e?.smtp || {} },
    auth: { emailVerification: !!s?.auth?.emailVerification }
  };
}

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('api:email:settings');
    if (cached && cached.payments) return res.json(cached);

    const emailSettings = await Email.getOrCreate();
    const Settings = require('../../models/Settings');
    let settingsDoc = await Settings.findOne({});
    if (!settingsDoc) settingsDoc = await Settings.create({});
    
    const result = serialize(emailSettings, settingsDoc);
    await setCache('api:email:settings', result, 60);
    return res.json(result);
  } catch (e) {
    console.error('GET /api/admin/email failed:', e);
    return res.status(500).json({ error: 'Failed to load email settings' });
  }
});

const payloadSchema = z.object({
  payments: z.object({
    smtp: z.object({
      host: z.string().min(1).max(200).optional(),
      port: z.coerce.number().int().min(1).max(65535).optional(),
      secure: z.coerce.boolean().optional(),
      user: z.string().max(200).optional(),
      pass: z.string().max(500).optional(),
      fromEmail: z.string().email().optional(),
    }).optional(),
  }).optional(),

  auth: z.object({
    emailVerification: z.boolean().optional()
  }).optional()
});

router.patch('/', requireAdmin, async (req, res) => {
  try {
    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    let emailSettings = await Email.findOne({});
    if (!emailSettings) emailSettings = await Email.create({});
    const Settings = require('../../models/Settings');
    let settingsDoc = await Settings.findOne({});
    if (!settingsDoc) settingsDoc = await Settings.create({});
    
    const { payments, auth } = parsed.data;

    if (payments?.smtp) {
      if (!emailSettings.smtp) emailSettings.smtp = {};
      for (const [key, value] of Object.entries(payments.smtp)) {
        if (value !== undefined) emailSettings.smtp[key] = value;
      }
    }

    
    await emailSettings.save();
    
    if (auth && auth.emailVerification !== undefined) {
      const smtp = emailSettings.smtp || {};
      const isSmtpConfigured = !!(smtp.host && smtp.fromEmail);
      
      settingsDoc.auth = settingsDoc.auth || {};
      settingsDoc.auth.emailVerification = auth.emailVerification && isSmtpConfigured;
      await settingsDoc.save();
      const { clearSettingsCache } = require('../../lib/settings');
      await clearSettingsCache();
    }
    
    // Invalidate the email settings cache
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('email:settings');
    await deleteCachePattern('api:email:settings');
    
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.email_settings.update', 'settings', emailSettings._id.toString(), {});
    
    return res.json(serialize(emailSettings, settingsDoc));
  } catch (e) {
    console.error('PATCH /api/admin/email failed:', e);
    return res.status(500).json({ error: 'Failed to update email settings' });
  }
});


module.exports = router;



