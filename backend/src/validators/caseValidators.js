const { z } = require('zod');

const createCaseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(''),
  assignedInvestigators: z.array(z.string()).optional().default([]),
});

const updateCaseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']).optional(),
});

const assignInvestigatorsSchema = z.object({
  investigatorIds: z.array(z.string()).min(1),
});

module.exports = { createCaseSchema, updateCaseSchema, assignInvestigatorsSchema };
