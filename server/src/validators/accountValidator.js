const { z } = require('zod');

const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(100),
  type: z.enum(['Savings', 'Current', 'Salary', 'Investment', 'Other']).default('Savings'),
  openingBalance: z.coerce.number().default(0),
});

const updateAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(100).optional(),
  type: z.enum(['Savings', 'Current', 'Salary', 'Investment', 'Other']).optional(),
  openingBalance: z.coerce.number().optional(),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
};
