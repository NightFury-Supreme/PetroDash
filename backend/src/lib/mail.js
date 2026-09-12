const nodemailer = require('nodemailer');
const Email = require('../models/Email');

async function getTransport() {
  const emailSettings = await Email.getOrCreate();
  const smtp = emailSettings.smtp || {};
  
  // Check if SMTP is properly configured
  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP not configured. Please configure SMTP settings in admin panel.');
  }
  
  const port = Number(smtp.port || 587);
  let secure = !!smtp.secure;
  if (port === 587) secure = false; // Port 587 uses STARTTLS
  if (port === 465) secure = true;  // Port 465 uses Implicit TLS

  return nodemailer.createTransport({
    host: smtp.host,
    port,
    secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}



function renderTemplateFromEmail(templateKey, data) {
  const templates = require('../config/emailTemplates');
  const tpl = templates[templateKey] || {};
  const subjectTpl = tpl.subject || '';
  const htmlTpl = tpl.html || '';
  const textTpl = tpl.text || '';
  const interpolate = (str) => String(str || '').replace(/{{\s*(\w+)\s*}}/g, (_, k) => (data && data[k] != null ? String(data[k]) : ''));
  const subject = interpolate(subjectTpl);
  const htmlBody = interpolate(htmlTpl);
  const text = interpolate(textTpl);
  return { subject, htmlBody, text };
}

async function sendMail({ to, subject, text, html, attachments, fromName }) {
  const emailSettings = await Email.getOrCreate();
  const fromEmail = emailSettings.smtp?.fromEmail || 'no-reply@example.com';
  
  if (!fromName) {
    try {
      const { getSettings } = require('./settings');
      const settings = await getSettings();
      fromName = settings?.siteName || 'PteroDash';
    } catch {
      fromName = 'PteroDash';
    }
  }

  const from = {
    name: fromName,
    address: fromEmail
  };
  
  const transport = await getTransport();
  try {
    const result = await transport.sendMail({ from, to, subject, text, html, attachments });
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

async function sendMailTemplate({ to, templateKey, data, attachments }) {
  await Email.getOrCreate();
  
  // Fetch branding from Settings model
  let siteName = '', siteIcon = '';
  try {
    const { getSettings } = require('./settings');
    const settings = await getSettings();
    siteName = settings?.siteName || '';
    siteIcon = settings?.siteIcon || '';
  } catch (e) {
    console.error('Failed to fetch branding:', e);
  }
  
  const brandColor = '#0ea5e9';
  const footerText = '';
  
  let logoUrl = siteIcon || '/logo.svg';
  if (logoUrl && !logoUrl.startsWith('http')) {
    const baseUrl = (logoUrl === '/logo.svg' ? process.env.FRONTEND_URL : (process.env.API_URL || process.env.BACKEND_URL || process.env.FRONTEND_URL)) || '';
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

  const enriched = { siteName, siteIcon, logoUrl, logoHtml, brandColor, footerText, ...(data || {}) };
  const { subject, htmlBody, text } = renderTemplateFromEmail(templateKey, enriched);
  return sendMail({ to, subject, text, html: htmlBody, attachments, fromName: siteName });
}

module.exports = { sendMail, sendMailTemplate };



