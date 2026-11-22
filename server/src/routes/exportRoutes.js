const express = require('express');
const router = express.Router();
const {
  exportCSV,
  previewCSVImport,
  commitCSVImport,
} = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/csv', exportCSV);
router.post('/import/preview', previewCSVImport);
router.post('/import/commit', commitCSVImport);

module.exports = router;
