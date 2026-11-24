const { z } = require('zod');

const createTransferSchema = z
  .object({
    fromType: z.enum(['account', 'cash'], {
      required_error: 'Source type is required',
    }),
    fromAccount: z.string().optional(),
    toType: z.enum(['account', 'cash'], {
      required_error: 'Destination type is required',
    }),
    toAccount: z.string().optional(),
    amount: z.coerce.number().positive('Transfer amount must be greater than zero'),
    date: z.coerce.date().optional(),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.fromType === 'account' && !data.fromAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Source bank account is required',
        path: ['fromAccount'],
      });
    }
    if (data.toType === 'account' && !data.toAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination bank account is required',
        path: ['toAccount'],
      });
    }
    if (
      data.fromType === data.toType &&
      (data.fromType === 'cash' || String(data.fromAccount) === String(data.toAccount))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Source and destination cannot be the same',
        path: ['toAccount'],
      });
    }
  });

module.exports = {
  createTransferSchema,
};
