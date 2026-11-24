const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { searchTransactions, getTags } = require('../controllers/searchController');

router.use(requireAuth);

router.get('/', searchTransactions);
router.get('/tags', getTags);

module.exports = router;
