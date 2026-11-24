const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const sanitize = require('./middleware/sanitize');
const { generalLimiter } = require('./middleware/security');
const apiRoutes = require('./routes');
const { processRecurringRules } = require('./services/recurringService');

const app = express();

// Trust reverse proxy for cloud deployments (Render, Vercel)
app.set('trust proxy', 1);

// Standard Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing with safe payload limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// NoSQL Injection sanitization
app.use(sanitize);

// General rate limiter
app.use('/api', generalLimiter);

// Main API Router (Modular Plug-in Architecture)
app.use('/api', apiRoutes);

// Root fallback / ping
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Orbit API',
    version: '2.0.0',
    status: 'online',
    tools: ['Expense Tracker'],
    docs: '/api/health',
  });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    // Catch-up missed recurring transactions on startup (especially for sleeping Render instances)
    processRecurringRules().catch((err) => {
      console.error('Failed to run initial recurring transactions catch-up:', err.message);
    });

    // Schedule daily recurring transactions runner at midnight
    cron.schedule('0 0 * * *', () => {
      console.log('⏰ Running daily recurring transactions scheduler...');
      processRecurringRules().catch((err) => {
        console.error('Cron recurring runner error:', err.message);
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Orbit Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  });
}

module.exports = app;
