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
  // eslint-disable-next-line unused-imports/no-unused-vars
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
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update email settings' });
  }
});

const testEmailSchema = z.object({
  email: z.string().email()
});

router.post('/test', requireAdmin, async (req, res) => {
  try {
    const parsed = testEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    
    const { email } = parsed.data;
    const { sendMail } = require('../../lib/mail');
    
    await sendMail({
      to: email,
      subject: 'PteroDash - Test Email Configuration',
      text: 'If you are receiving this email, your PteroDash SMTP configuration is working correctly.',
      html: '<p>If you are receiving this email, your <strong>PteroDash SMTP configuration</strong> is working correctly.</p>'
    });
    
    return res.json({ ok: true, message: 'Test email sent successfully' });
  } catch (e) {
    console.error('Test email failed:', e);
    return res.status(500).json({ error: 'Failed to send test email: ' + e.message });
  }
});

module.exports = router;



