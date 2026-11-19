const express = require('express');
const router = express.Router();
const {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrends,
  getSmartInsights,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getMonthlySummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/trends', getTrends);
router.get('/insights', getSmartInsights);

module.exports = router;
