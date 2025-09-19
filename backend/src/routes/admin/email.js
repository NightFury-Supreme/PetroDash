const express = require('express');
const { z } = require('zod');
const { requireAdmin } = require('../../middleware/auth');
const Email = require('../../models/Email');

const router = express.Router();

function serialize(emailDoc) {
  const e = emailDoc.toObject ? emailDoc.toObject() : emailDoc;
  return {
    payments: { smtp: e?.smtp || {} },
    emailTemplates: Object.fromEntries(e?.templates || new Map()),
  };
}

router.get('/', requireAdmin, async (req, res) => {
  try {
    const emailSettings = await Email.getOrCreate();
    return res.json(serialize(emailSettings));
  } catch (e) {
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
  emailTemplates: z.record(z.string(), z.object({
    subject: z.string().max(200).optional(),
    html: z.string().max(10000).optional(),
    text: z.string().max(10000).optional(),
  })).optional()
});

router.patch('/', requireAdmin, async (req, res) => {
  try {
    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    const emailSettings = await Email.getOrCreate();
    const { payments, emailTemplates } = parsed.data;

    if (payments?.smtp) {
      emailSettings.smtp = { ...(emailSettings.smtp || {}), ...payments.smtp };
    }
    if (emailTemplates) {
      const templatesMap = new Map(Object.entries(emailTemplates));
      emailSettings.templates = templatesMap;
    }
    
    await emailSettings.save();
    
    return res.json(serialize(emailSettings));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update email settings' });
  }
});

router.post('/test', requireAdmin, async (req, res) => {
  return res.status(404).json({ error: 'Not found' });
});

module.exports = router;



