const mongoose = require('mongoose');
const { generatePublicId } = require('../utils/publicId');

const AuditLogSchema = new mongoose.Schema(
  {
    publicId: { type: String, unique: true, index: true, sparse: true, default: () => generatePublicId('auditLog') },
    actorId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: false },
    actorRole: { type: String, enum: ['user', 'admin', 'system'], default: 'user' },
    actorUsername: { type: String },
    action: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'], default: 'INFO' },
    category: {
      type: String,
      enum: ['admin_activity', 'user_activity', 'billing_event', 'data_access', 'system_event', 'policy_denied'],
      default: 'system_event',
    },
    requestId: { type: String },
    sessionId: { type: String },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    targetUserId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: false },
    meta: { type: Object, default: {} },
    ip: { type: String },
    userAgent: { type: String },
    location: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
    success: { type: Boolean },
    durationMs: { type: Number },
    responsePreview: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetUserId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ requestId: 1 });

AuditLogSchema.pre('validate', function (next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('auditLog');
  }
  next();
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
