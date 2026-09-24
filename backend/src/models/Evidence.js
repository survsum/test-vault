const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    sha256: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    description: { type: String, default: '' },
    lastIntegrityCheck: {
      checkedAt: { type: Date, default: null },
      valid: { type: Boolean, default: null },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

evidenceSchema.index({ case: 1 });
evidenceSchema.index({ status: 1 });
evidenceSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Evidence', evidenceSchema);
