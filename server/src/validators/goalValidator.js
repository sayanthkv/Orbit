const { z } = require('zod');

const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100).trim(),
  targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
  targetDate: z.coerce.date().optional().nullable(),
  linkedAccount: z.string().optional().nullable(),
  icon: z.string().optional().default('Target'),
  color: z.string().optional().default('#10b981'),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['active', 'completed', 'paused']).optional(),
});

const contributionSchema = z.object({
  amount: z.coerce.number().positive('Contribution amount must be greater than zero'),
  type: z.enum(['add', 'withdraw']).default('add'),
  date: z.coerce.date().optional(),
  note: z.string().max(500).optional().default(''),
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
  contributionSchema,
};
