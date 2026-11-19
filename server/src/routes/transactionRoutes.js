const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} = require('../validations/transactionValidation');

router.use(protect);

router.get('/', validate(listTransactionsQuerySchema), getTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
