const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50).trim(),
  type: z.enum(['income', 'expense'], {
    required_error: 'Category type must be income or expense',
  }),
  color: z.string().optional().default('#10b981'),
  icon: z.string().optional().default('Tag'),
});

const deleteCategorySchema = z.object({
  reassignTo: z.string().min(1, 'Replacement category name is required'),
});

module.exports = {
  categorySchema,
  deleteCategorySchema,
};
