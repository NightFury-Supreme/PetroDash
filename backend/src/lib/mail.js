const nodemailer = require('nodemailer');
const Email = require('../models/Email');

async function getTransport() {
  const emailSettings = await Email.getOrCreate();
  const smtp = emailSettings.smtp || {};

  // Check if SMTP is properly configured
  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP not configured. Please configure SMTP settings in admin panel.');
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port || 587),
    secure: !!smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass }
  });
}

function wrapHtmlWithBrand({ htmlBody, brand }) {
  const footerText = brand?.footerText || '';
  const logoUrl = brand?.logoUrl || brand?.siteIconUrl || '';
  const siteName = brand?.name || brand?.siteName || '';
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b0f1a;padding:32px;">
    <div style="max-width:680px;margin:0 auto;background:#0f1524;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;">
      <div style="padding:28px 28px 0 28px;text-align:center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${siteName || 'Logo'}" style="height:40px;object-fit:contain;display:inline-block;"/>` : ''}
        ${!logoUrl && siteName ? `<div style="color:#e5e7eb;font-weight:600;font-size:16px;">${siteName}</div>` : ''}
      </div>
      <div style="padding:24px 28px 28px 28px;color:#e5e7eb;line-height:1.7;">
        ${htmlBody}
      </div>
      ${footerText ? `<div style="padding:16px 20px;color:#9ca3af;font-size:12px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">${footerText}</div>` : ''}
    </div>
  </div>`;
}

function renderTemplateFromEmail(emailSettings, templateKey, data) {
  const templates = emailSettings.templates || new Map();
  const tpl = templates.get(templateKey) || {};
  const subjectTpl = tpl.subject || '';
  const htmlTpl = tpl.html || '';
  const textTpl = tpl.text || '';
  const interpolate = str =>
    String(str || '').replace(/{{\s*(\w+)\s*}}/g, (_, k) =>
      data && data[k] != null ? String(data[k]) : ''
    );
  const subject = interpolate(subjectTpl);
  const htmlBody = interpolate(htmlTpl);
  const text = interpolate(textTpl);
  return { subject, htmlBody, text };
}

async function sendMail({ to, subject, text, html, attachments }) {
  const emailSettings = await Email.getOrCreate();
  const from = emailSettings.smtp?.fromEmail || 'no-reply@example.com';

  // Fetch branding from branding API
  let brand = { name: '', logoUrl: '', brandColor: '#0ea5e9', footerText: '' };
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({}).lean();
    brand = {
      name: settings?.siteName || '',
      logoUrl: settings?.siteIconUrl || '',
      brandColor: '#0ea5e9',
      footerText: ''
    };
  } catch (e) {
    console.error('Failed to fetch branding:', e);
  }

  const transport = await getTransport();
  const finalHtml = html ? wrapHtmlWithBrand({ htmlBody: html, brand }) : undefined;
  return transport.sendMail({ from, to, subject, text, html: finalHtml, attachments });
}

async function sendMailTemplate({ to, templateKey, data, attachments }) {
  const emailSettings = await Email.getOrCreate();

  // Fetch branding from Settings model
  let siteName = '',
    siteIconUrl = '';
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({}).lean();
    siteName = settings?.siteName || '';
    siteIconUrl = settings?.siteIconUrl || '';
  } catch (e) {
    console.error('Failed to fetch branding:', e);
  }

  const brandColor = '#0ea5e9';
  const footerText = '';
  const enriched = {
    siteName,
    siteIconUrl,
    logoUrl: siteIconUrl,
    brandColor,
    footerText,
    ...(data || {})
  };
  const { subject, htmlBody, text } = renderTemplateFromEmail(emailSettings, templateKey, enriched);
  return sendMail({ to, subject, text, html: htmlBody, attachments });
}

module.exports = { sendMail, sendMailTemplate };
