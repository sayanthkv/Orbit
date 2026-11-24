const express = require('express');
const authRoutes = require('./authRoutes');
const accountRoutes = require('./accountRoutes');
const cashRoutes = require('./cashRoutes');
const expenseRoutes = require('./expenseRoutes');
const summaryRoutes = require('./summaryRoutes');
const transferRoutes = require('./transferRoutes');
const budgetRoutes = require('./budgetRoutes');
const recurringRoutes = require('./recurringRoutes');
const categoryRoutes = require('./categoryRoutes');
const goalRoutes = require('./goalRoutes');
const searchRoutes = require('./searchRoutes');
const reportRoutes = require('./reportRoutes');
const insightRoutes = require('./insightRoutes');
const uploadRoutes = require('./uploadRoutes');
const vehicleRoutes = require('./vehicleRoutes');

const router = express.Router();

/**
 * Modular Tool Plug-in Registry:
 * Each future tool (reminders, notes, etc.) registers cleanly here
 */

// Core Auth Module
router.use('/auth', authRoutes);

// Tool: Expense Tracker
router.use('/accounts', accountRoutes);
router.use('/cash', cashRoutes);
router.use('/expenses', expenseRoutes);
router.use('/summary', summaryRoutes);
router.use('/transfers', transferRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring', recurringRoutes);
router.use('/categories', categoryRoutes);
router.use('/goals', goalRoutes);
router.use('/search', searchRoutes);
router.use('/reports', reportRoutes);
router.use('/insights', insightRoutes);
router.use('/uploads', uploadRoutes);

// Tool: Vehicle Log & Mileage Tracker
router.use('/vehicles', vehicleRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
