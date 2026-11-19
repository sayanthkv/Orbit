const { z } = require('zod');

const setBudgetSchema = z.object({
  body: z.object({
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    monthlyLimit: z.coerce.number().positive('Budget limit must be greater than zero'),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

module.exports = {
  setBudgetSchema,
};
