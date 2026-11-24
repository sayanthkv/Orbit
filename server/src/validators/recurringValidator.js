const { z } = require('zod');

const recurringRuleSchema = z
  .object({
    type: z.enum(['income', 'expense'], {
      required_error: 'Transaction type is required',
    }),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    category: z.string().min(1, 'Category is required').trim(),
    target: z.enum(['account', 'cash'], {
      required_error: 'Target is required',
    }),
    targetAccountId: z.string().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
      required_error: 'Frequency is required',
    }),
    startDate: z.coerce.date({
      required_error: 'Start date is required',
    }),
    endDate: z.coerce.date().optional().nullable(),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional().default(''),
    active: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.target === 'account' && !data.targetAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank account is required when target is account',
        path: ['targetAccountId'],
      });
    }
  });

module.exports = {
  recurringRuleSchema,
};
