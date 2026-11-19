const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters').trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).optional().default('INR'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const preferencesSchema = z.object({
  body: z.object({
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).optional(),
    themePreference: z.enum(['light', 'dark', 'system']).optional(),
    name: z.string().min(2).max(60).optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  preferencesSchema,
};
