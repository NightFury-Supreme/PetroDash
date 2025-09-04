const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

async function getTransport() {
  const s = await Settings.findOne({}).lean();
  const smtp = s?.smtp || {};
  if (!smtp.host || !smtp.user) throw new Error('SMTP not configured');
  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port || 587),
    secure: !!smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

async function sendMail({ to, subject, text, html, attachments }) {
  const s = await Settings.findOne({}).lean();
  const from = s?.smtp?.fromEmail || 'no-reply@example.com';
  const transport = await getTransport();
  return transport.sendMail({ from, to, subject, text, html, attachments });
}

module.exports = { sendMail };



