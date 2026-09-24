const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userRole: { type: String, default: null },
    emailAttempted: { type: String, default: null },
    eventType: {
      type: String,
      enum: ['AUTHENTICATION', 'AUTHORIZATION', 'EVIDENCE', 'CASE', 'USER', 'TOKEN', 'SYSTEM', 'SECURITY'],
      required: true,
    },
    action: { type: String, required: true },
    resourceType: { type: String, default: null },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['SUCCESS', 'FAILURE', 'BLOCKED'], required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true, default: 'LOW' },
    description: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ eventType: 1 });
securityEventSchema.index({ riskLevel: 1 });
securityEventSchema.index({ user: 1 });
securityEventSchema.index({ ip: 1 });
securityEventSchema.index({ action: 1 });

securityEventSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function (next) {
  next(new Error('Security events are immutable'));
});

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
