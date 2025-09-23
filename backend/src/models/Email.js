const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    smtp: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: '' },
      pass: { type: String, default: '' },
      fromEmail: { type: String, default: '' }
    },
    templates: {
      type: Map,
      of: {
        subject: { type: String, default: '' },
        html: { type: String, default: '' },
        text: { type: String, default: '' }
      },
      default: new Map([
        [
          'accountCreateWithVerification',
          {
            subject: 'Verify your {{siteName}} account',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Welcome to {{siteName}}, {{username}}!</h2>
            <p>To complete your account setup, please use the verification code below:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">{{verificationCode}}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p>If you didn't create an account with {{siteName}}, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">{{siteName}} Team</p>
          </div>
        `,
            text: 'Welcome to {{siteName}}, {{username}}! Your verification code is: {{verificationCode}}. This code will expire in 15 minutes.'
          }
        ],
        [
          'accountDeleted',
          {
            subject: 'Your account has been deleted',
            html: '<p>Your account was deleted as requested. We are sorry to see you go.</p>',
            text: 'Your account was deleted as requested.'
          }
        ],
        [
          'accountDeletedByAdmin',
          {
            subject: 'Your account has been removed by an administrator',
            html: '<p>Your account was removed by an administrator. Reason: {{reason}}</p>',
            text: 'Your account was removed by an administrator. Reason: {{reason}}'
          }
        ],
        [
          'accountBanned',
          {
            subject: 'Your account has been banned',
            html: '<p>Your account has been banned. Reason: {{reason}}. Until: {{until}}</p>',
            text: 'Your account has been banned. Reason: {{reason}}. Until: {{until}}'
          }
        ],
        [
          'loginAlert',
          {
            subject: 'New login to your account',
            html: '<p>New login detected from IP {{ip}} using {{userAgent}} at {{time}}.</p>',
            text: 'New login detected from IP {{ip}} using {{userAgent}} at {{time}}.'
          }
        ],
        [
          'serverCreated',
          {
            subject: 'Server created: {{serverName}}',
            html: '<p>Your server <strong>{{serverName}}</strong> has been created.</p>',
            text: 'Your server {{serverName}} has been created.'
          }
        ],
        [
          'serverDeleted',
          {
            subject: 'Server deleted: {{serverName}}',
            html: '<p>Your server <strong>{{serverName}}</strong> has been deleted.</p>',
            text: 'Your server {{serverName}} has been deleted.'
          }
        ],
        [
          'planPurchased',
          {
            subject: 'Plan purchased: {{planName}}',
            html: '<p>Thank you for purchasing <strong>{{planName}}</strong>.</p>',
            text: 'Thank you for purchasing {{planName}}.'
          }
        ],
        [
          'ticketCreated',
          {
            subject: 'Ticket created: {{title}}',
            html: '<p>Your ticket "{{title}}" has been created. We will get back to you soon.</p>',
            text: 'Your ticket "{{title}}" has been created.'
          }
        ],
        [
          'ticketReply',
          {
            subject: 'New reply to your ticket: {{title}}',
            html: '<p>There is a new reply to your ticket "{{title}}".</p><p>{{snippet}}</p>',
            text: 'New reply to your ticket "{{title}}": {{snippet}}'
          }
        ],
        [
          'passwordReset',
          {
            subject: 'Reset your {{siteName}} password',
            html: '<p>Your password reset code is: <strong>{{resetCode}}</strong>. It expires in 15 minutes.</p>',
            text: 'Your password reset code is: {{resetCode}}. It expires in 15 minutes.'
          }
        ]
      ])
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one email settings document exists
emailSchema.statics.getOrCreate = async function() {
  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('Email', emailSchema);
