const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { exportCSV, exportPDF } = require('../controllers/reportController');

router.use(requireAuth);

router.get('/csv', exportCSV);
router.get('/pdf', exportPDF);

module.exports = router;
