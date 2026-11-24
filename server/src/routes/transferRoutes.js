const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTransferSchema } = require('../validators/transferValidator');
const {
  createTransfer,
  getTransfers,
  deleteTransfer,
} = require('../controllers/transferController');

router.use(requireAuth);

router.route('/')
  .get(getTransfers)
  .post(validate(createTransferSchema), createTransfer);

router.route('/:id')
  .delete(deleteTransfer);

module.exports = router;
