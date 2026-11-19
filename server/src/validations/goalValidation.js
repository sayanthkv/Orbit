const { z } = require('zod');

const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Goal title must be at least 2 characters').max(60).trim(),
    targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
    currentAmount: z.coerce.number().min(0).optional().default(0),
    targetDate: z.string().or(z.date()).optional().nullable(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().default('#10B981'),
  }),
});

const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid goal ID'),
  }),
  body: z.object({
    title: z.string().min(2).max(60).trim().optional(),
    targetAmount: z.coerce.number().positive().optional(),
    currentAmount: z.coerce.number().min(0).optional(),
    targetDate: z.string().or(z.date()).optional().nullable(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  }),
});

const depositGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid goal ID'),
  }),
  body: z.object({
    amount: z.coerce.number().positive('Deposit amount must be greater than zero'),
  }),
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
  depositGoalSchema,
};
