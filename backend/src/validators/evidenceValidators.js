const { z } = require('zod');

const uploadEvidenceSchema = z.object({
  caseId: z.string().min(1),
  description: z.string().optional().default(''),
});

const rejectEvidenceSchema = z.object({
  reason: z.string().min(3, 'A rejection reason is required'),
});

module.exports = { uploadEvidenceSchema, rejectEvidenceSchema };
