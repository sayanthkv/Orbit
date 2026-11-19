const { z } = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').max(40, 'Category name cannot exceed 40 characters').trim(),
    icon: z.string().optional().default('Tag'),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Valid HEX color code required').optional().default('#10B981'),
    type: z.enum(['expense', 'income']),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(40).trim().optional(),
    icon: z.string().optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Valid HEX color code required').optional(),
    type: z.enum(['expense', 'income']).optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
