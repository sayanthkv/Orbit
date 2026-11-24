const express = require('express');
const router = express.Router();
const { getAllExpenses, exportExpensesCSV } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllExpenses);
router.get('/export', exportExpensesCSV);

module.exports = router;
