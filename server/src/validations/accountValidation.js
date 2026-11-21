const { z } = require('zod');

const createAccountSchema = z.object({
  name: z
    .string({ required_error: 'Account name is required' })
    .trim()
    .min(1, 'Account name cannot be empty')
    .max(50, 'Account name cannot exceed 50 characters'),
  bankName: z.string().trim().max(50).optional().default(''),
  accountNumber: z.string().trim().max(20).optional().default(''),
  type: z
    .enum(['bank', 'cash', 'card', 'savings', 'wallet', 'other'])
    .default('bank'),
  initialBalance: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val === undefined || val === '' ? 0 : Number(val)))
    .refine((val) => !isNaN(val), 'Initial balance must be a valid number'),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code')
    .default('#10B981'),
  icon: z.string().trim().default('Building'),
  isDefault: z.boolean().optional().default(false),
});

const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Account name cannot be empty')
    .max(50, 'Account name cannot exceed 50 characters')
    .optional(),
  bankName: z.string().trim().max(50).optional(),
  accountNumber: z.string().trim().max(20).optional(),
  type: z
    .enum(['bank', 'cash', 'card', 'savings', 'wallet', 'other'])
    .optional(),
  initialBalance: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val === undefined || val === '' ? undefined : Number(val)))
    .refine((val) => val === undefined || !isNaN(val), 'Initial balance must be a valid number'),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code')
    .optional(),
  icon: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
};
