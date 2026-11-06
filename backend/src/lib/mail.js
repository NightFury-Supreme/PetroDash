const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const AppError = require('../utils/AppError');
const { getSettings } = require('./settings');

async function getTransport() {
  const emailSettings = await Email.getOrCreate();
  const smtp = emailSettings.smtp || {};

  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw AppError.badRequest('SMTP not configured. Please configure SMTP settings in admin panel.', 'ERR_SMTP_NOT_CONFIGURED');
  }

  const port = Number(smtp.port || 587);
  let secure = Boolean(smtp.secure);
  if (port === 587) secure = false;
  if (port === 465) secure = true;

  return nodemailer.createTransport({
    host: smtp.host,
    port,
    secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTemplateFromEmail(templateKey, data) {
  const templates = require('../config/emailTemplates');
  const tpl = templates[templateKey] || {};
  const subjectTpl = tpl.subject || '';
  const htmlTpl = tpl.html || '';
  const textTpl = tpl.text || '';
  const rawKeys = new Set(['logoHtml', 'statusBg', 'statusColor', 'statusBorder']);
  const interpolateText = (str) => String(str || '').replace(/{{\s*(\w+)\s*}}/g, (_, k) => (data && data[k] != null ? String(data[k]) : ''));
  const interpolateHtml = (str) =>
    String(str || '').replace(/{{\s*(\w+)\s*}}/g, (_, k) => {
      if (!data || data[k] == null) return '';
      const val = String(data[k]);
      if (rawKeys.has(k) || k.toLowerCase().endsWith('html')) return val;
      return escapeHtml(val);
    });
  return {
    subject: interpolateText(subjectTpl),
    htmlBody: interpolateHtml(htmlTpl),
    text: interpolateText(textTpl),
  };
}

async function sendMail({ to, subject, text, html, attachments, fromName }) {
  const emailSettings = await Email.getOrCreate();
  const fromEmail = emailSettings.smtp?.fromEmail || emailSettings.smtp?.user || '';

  let resolvedFromName = fromName;
  if (!resolvedFromName) {
    try {
      const settings = await getSettings();
      resolvedFromName = settings?.siteName || '';
    } catch (_settingsErr) {
      resolvedFromName = '';
    }
  }

  const from = resolvedFromName ? { name: resolvedFromName, address: fromEmail } : fromEmail;
  const transport = await getTransport();
  return transport.sendMail({ from, to, subject, text, html, attachments });
}

async function sendMailTemplate({ to, templateKey, data, attachments }) {
  await Email.getOrCreate();

  let siteName = '';
  let siteIcon = '';
  try {
    const settings = await getSettings();
    siteName = settings?.siteName || '';
    siteIcon = settings?.siteIcon || '';
  } catch (_tplSettingsErr) {}

  const frontendUrl = process.env.FRONTEND_URL || '';
  let logoUrl = siteIcon || '/logo.svg';
  if (logoUrl && !logoUrl.startsWith('http')) {
    const baseUrl = (logoUrl === '/logo.svg' ? frontendUrl : (process.env.API_URL || process.env.BACKEND_URL || frontendUrl)) || '';
    logoUrl = `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
  }

  const logoHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0;">
      <tr>
        <td valign="middle">
          <img src="${logoUrl}" alt="${siteName}" style="height: 48px; max-width: 100%; object-fit: contain; display: block;" />
        </td>
        <td valign="middle" style="padding-left: 16px;">
          <span style="color: #eeeeee; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${siteName}</span>
        </td>
      </tr>
    </table>
  `;

  const enriched = { siteName, siteIcon, logoUrl, logoHtml, frontendUrl, ...(data || {}) };
  const { subject, htmlBody, text } = renderTemplateFromEmail(templateKey, enriched);
  return sendMail({ to, subject, text, html: htmlBody, attachments, fromName: siteName });
}

module.exports = { sendMail, sendMailTemplate };
