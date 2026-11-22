const { z } = require('zod');

const emptyToUndefined = z.literal('').transform(() => undefined);
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTransactionSchema = z
  .object({
    body: z.object({
      type: z.enum(['expense', 'income', 'transfer'], {
        required_error: 'Type is required (expense, income, or transfer)',
      }),
      amount: z.coerce.number().positive('Amount must be greater than zero'),
      category: z.union([z.string().regex(objectIdRegex, 'Invalid category ID'), emptyToUndefined]).optional(),
      date: z.string().or(z.date()).optional(),
      note: z.string().max(250, 'Note cannot exceed 250 characters').optional().default(''),
      paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional().default('bank'),
      account: z.union([z.string().regex(objectIdRegex, 'Invalid account ID'), emptyToUndefined]).optional(),
      toAccount: z.union([z.string().regex(objectIdRegex, 'Invalid destination account ID'), emptyToUndefined]).optional(),
      tags: z.union([z.array(z.string()), z.string()]).optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.type === 'transfer') {
        return !!data.body.account && !!data.body.toAccount && data.body.account !== data.body.toAccount;
      }
      return !!data.body.category;
    },
    {
      message: 'Transfers require distinct source and destination accounts. Expenses/income require a category.',
      path: ['body', 'toAccount'],
    }
  );

const updateTransactionSchema = z
  .object({
    params: z.object({
      id: z.string().regex(objectIdRegex, 'Invalid transaction ID'),
    }),
    body: z.object({
      type: z.enum(['expense', 'income', 'transfer']).optional(),
      amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
      category: z.union([z.string().regex(objectIdRegex, 'Invalid category ID'), emptyToUndefined]).optional(),
      date: z.string().or(z.date()).optional(),
      note: z.string().max(250).optional(),
      paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank']).optional(),
      account: z.union([z.string().regex(objectIdRegex, 'Invalid account ID'), emptyToUndefined]).optional(),
      toAccount: z.union([z.string().regex(objectIdRegex, 'Invalid destination account ID'), emptyToUndefined]).optional(),
      tags: z.union([z.array(z.string()), z.string()]).optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.type === 'transfer' && data.body.account && data.body.toAccount) {
        return data.body.account !== data.body.toAccount;
      }
      return true;
    },
    {
      message: 'Source and destination accounts must be different.',
      path: ['body', 'toAccount'],
    }
  );

const listTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    type: z.union([z.enum(['expense', 'income', 'transfer']), emptyToUndefined]).optional(),
    categoryId: z.union([z.string().regex(objectIdRegex), emptyToUndefined]).optional(),
    accountId: z.union([z.string().regex(objectIdRegex), emptyToUndefined]).optional(),
    paymentMethod: z.union([z.enum(['cash', 'UPI', 'card', 'bank']), emptyToUndefined]).optional(),
    startDate: z.union([z.string(), emptyToUndefined]).optional(),
    endDate: z.union([z.string(), emptyToUndefined]).optional(),
    minAmount: z.union([z.coerce.number(), emptyToUndefined]).optional(),
    maxAmount: z.union([z.coerce.number(), emptyToUndefined]).optional(),
    tag: z.union([z.string(), emptyToUndefined]).optional(),
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
