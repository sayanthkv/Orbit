const { z } = require('zod');

const attachmentSchema = z
  .object({
    url: z.string().url().nullable().optional(),
    publicId: z.string().nullable().optional(),
    fileType: z.string().nullable().optional(),
  })
  .optional()
  .nullable();

const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' }),
  }),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  category: z.string().trim().min(1, 'Category is required'),
  date: z.string().or(z.date()).optional().default(() => new Date()),
  note: z.string().trim().max(500).optional().default(''),
  tags: z.array(z.string().trim()).optional().default([]),
  attachment: attachmentSchema,
  recurringRuleId: z.string().optional().nullable(),
});

const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
  category: z.string().trim().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  note: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim()).optional(),
  attachment: attachmentSchema,
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
};
