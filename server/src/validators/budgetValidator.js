const { z } = require('zod');

const budgetSchema = z.object({
  category: z.string().min(1, 'Category name is required').trim(),
  amount: z.coerce.number().min(1, 'Budget amount must be at least ₹1'),
  period: z.enum(['monthly']).optional().default('monthly'),
});

module.exports = {
  budgetSchema,
};
