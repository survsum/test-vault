const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['OPEN', 'CLOSED', 'ARCHIVED'], default: 'OPEN' },
    assignedInvestigators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

caseSchema.index({ status: 1 });
caseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Case', caseSchema);
