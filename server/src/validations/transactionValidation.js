const { z } = require('zod');

const emptyToUndefined = z.literal('').transform(() => undefined);

const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['expense', 'income'], {
      required_error: 'Type is required (expense or income)',
    }),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    date: z.string().or(z.date()).optional(),
    note: z.string().max(250, 'Note cannot exceed 250 characters').optional().default(''),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional().default('UPI'),
  }),
});

const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid transaction ID'),
  }),
  body: z.object({
    type: z.enum(['expense', 'income']).optional(),
    amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
    date: z.string().or(z.date()).optional(),
    note: z.string().max(250).optional(),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional(),
  }),
});

const listTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    type: z.union([z.enum(['expense', 'income']), emptyToUndefined]).optional(),
    categoryId: z.union([z.string().regex(/^[0-9a-fA-F]{24}$/), emptyToUndefined]).optional(),
    paymentMethod: z.union([z.enum(['cash', 'UPI', 'card', 'bank']), emptyToUndefined]).optional(),
    startDate: z.union([z.string(), emptyToUndefined]).optional(),
    endDate: z.union([z.string(), emptyToUndefined]).optional(),
    minAmount: z.union([z.coerce.number(), emptyToUndefined]).optional(),
    maxAmount: z.union([z.coerce.number(), emptyToUndefined]).optional(),
    search: z.union([z.string(), emptyToUndefined]).optional(),
    sortBy: z.enum(['date', 'amount']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
};
