const { z } = require('zod');

const createRecurringSchema = z.object({
  body: z.object({
    type: z.enum(['expense', 'income']),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    frequency: z.enum(['weekly', 'monthly', 'yearly']),
    startDate: z.string().or(z.date()).optional(),
    note: z.string().max(250).optional().default(''),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional().default('UPI'),
  }),
});

const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recurring ID'),
  }),
  body: z.object({
    type: z.enum(['expense', 'income']).optional(),
    amount: z.coerce.number().positive().optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
    note: z.string().max(250).optional(),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  createRecurringSchema,
  updateRecurringSchema,
};
