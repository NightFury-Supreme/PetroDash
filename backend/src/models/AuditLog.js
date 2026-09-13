const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    actorRole: { type: String, enum: ['user', 'admin'], default: 'user' },
    actorUsername: { type: String },
    action: { type: String, required: true }, // e.g., server.create, admin.user.update
    severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'], default: 'INFO' },
    category: { type: String, enum: ['admin_activity', 'user_activity', 'billing_event', 'data_access', 'system_event', 'policy_denied'], default: 'system_event' },
    requestId: { type: String },
    sessionId: { type: String },
    resourceType: { type: String, required: true }, // server, user, shop, auth, admin
    resourceId: { type: String },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: { type: Object, default: {} },
    ip: { type: String },
    userAgent: { type: String },
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
AuditLogSchema.index({ resourceType: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ requestId: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);


