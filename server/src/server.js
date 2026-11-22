const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInputs, preventHPP } = require('./middleware/security');
const { seedDefaultCategories } = require('./services/seedService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const exportRoutes = require('./routes/exportRoutes');
const accountRoutes = require('./routes/accountRoutes');
const recurringRoutes = require('./routes/recurringRoutes');

const app = express();

// Trust reverse proxy (Essential for Render.com, Cloudflare, rate limiting & secure cookies)
app.set('trust proxy', 1);

// Standard Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Handled by frontend client SPA
    frameguard: { action: 'deny' }, // Clickjacking protection
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection
  })
);
app.use(cors(corsOptions));
// Safe body size limits (prevents payload exhaustion / denial of service)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// NoSQL Injection Sanitization & HTTP Parameter Pollution (HPP) Prevention
app.use(sanitizeInputs);
app.use(preventHPP(['category', 'tags']));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', globalLimiter);

// Stricter Rate Limiter for Auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/registration attempts. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login/2fa', authLimiter);
app.use('/api/auth/2fa/verify', authLimiter);

// Per-route Rate Limiter for Refresh Token Rotation
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please try again later.',
  },
});
app.use('/api/auth/refresh', refreshLimiter);

// Per-route Rate Limiter for CSV Import
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 batch imports per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many import requests. Please try again after a few minutes.',
  },
});
app.use('/api/export/import', importLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Orbit API is healthy and operational.',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Swagger/OpenAPI Documentation Routes (Phase 8)
const openApiSpec = require('./docs/openapi.json');
app.get('/api/docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiSpec);
});

app.get('/api/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orbit API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #0b0c0e; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .info { margin: 20px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/export', exportRoutes);

// Catch-all 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found.`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultCategories();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Orbit API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
