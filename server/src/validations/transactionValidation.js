const { z } = require('zod');

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
    type: z.enum(['expense', 'income']).optional(),
    categoryId: z.string().optional(),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['date', 'amount']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
};
