const express = require('express');
const router = express.Router();
const {
  getCashProfile,
  updateCashProfile,
  getCashTransactions,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction,
} = require('../controllers/cashController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateCashProfileSchema,
  createCashTransactionSchema,
} = require('../validators/cashValidator');

router.use(protect);

router.route('/')
  .get(getCashProfile)
  .put(validate(updateCashProfileSchema), updateCashProfile);

router.route('/transactions')
  .get(getCashTransactions)
  .post(validate(createCashTransactionSchema), createCashTransaction);

router.route('/transactions/:id')
  .put(updateCashTransaction)
  .delete(deleteCashTransaction);

module.exports = router;
