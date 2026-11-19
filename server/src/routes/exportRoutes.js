const express = require('express');
const router = express.Router();
const { exportCSV } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/csv', exportCSV);

module.exports = router;
