const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createRecurringSchema = z.object({
  body: z.object({
    type: z.enum(['expense', 'income', 'transfer']).default('expense'),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    category: z.string().regex(objectIdRegex, 'Invalid category ID').optional(),
    account: z.string().regex(objectIdRegex, 'Invalid account ID').optional(),
    toAccount: z.string().regex(objectIdRegex, 'Invalid destination account ID').optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).nullable().optional(),
    note: z.string().max(250).optional().default(''),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional().default('bank'),
  }).refine((data) => {
    if (data.type === 'transfer') {
      return Boolean(data.account && data.toAccount && data.account !== data.toAccount);
    }
    return Boolean(data.category);
  }, {
    message: 'Transfers require distinct source and destination accounts; expenses/income require a valid category.',
  }),
});

const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid recurring ID'),
  }),
  body: z.object({
    type: z.enum(['expense', 'income', 'transfer']).optional(),
    amount: z.coerce.number().positive().optional(),
    category: z.string().regex(objectIdRegex).optional(),
    account: z.string().regex(objectIdRegex).optional(),
    toAccount: z.string().regex(objectIdRegex).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).nullable().optional(),
    note: z.string().max(250).optional(),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  createRecurringSchema,
  updateRecurringSchema,
};
