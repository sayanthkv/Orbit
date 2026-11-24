const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createAccountSchema,
  updateAccountSchema,
} = require('../validators/accountValidator');
const {
  createTransactionSchema,
  updateTransactionSchema,
} = require('../validators/transactionValidator');
const {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  archiveAccount,
  deleteAccount,
  getAccountTransactions,
  createAccountTransaction,
  updateAccountTransaction,
  deleteAccountTransaction,
} = require('../controllers/accountController');

const router = express.Router();

router.use(requireAuth);

router
  .route('/')
  .get(getAccounts)
  .post(validate(createAccountSchema), createAccount);

router
  .route('/:id')
  .get(getAccountById)
  .put(validate(updateAccountSchema), updateAccount)
  .delete(deleteAccount);

router.patch('/:id/archive', archiveAccount);

router
  .route('/:id/transactions')
  .get(getAccountTransactions)
  .post(validate(createTransactionSchema), createAccountTransaction);

router
  .route('/:id/transactions/:txId')
  .put(validate(updateTransactionSchema), updateAccountTransaction)
  .delete(deleteAccountTransaction);

module.exports = router;
