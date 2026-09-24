const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'EVIDENCE_UPLOADED',
        'EVIDENCE_APPROVED',
        'EVIDENCE_REJECTED',
        'CASE_ASSIGNED',
        'CASE_UPDATED',
        'CASE_CLOSED',
        'INTEGRITY_FAILURE',
        'SYSTEM',
      ],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
