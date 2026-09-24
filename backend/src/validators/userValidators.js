const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'INVESTIGATOR']),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'INVESTIGATOR']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

module.exports = { createUserSchema, updateUserSchema, resetPasswordSchema };
