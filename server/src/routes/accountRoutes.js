const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateObjectId } = require('../middleware/security');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} = require('../controllers/accountController');
const {
  createAccountSchema,
  updateAccountSchema,
} = require('../validations/accountValidation');

router.use(protect);
router.use('/:id', validateObjectId('id'));

router
  .route('/')
  .get(getAccounts)
  .post(validate(createAccountSchema), createAccount);

router
  .route('/:id')
  .get(getAccountById)
  .put(validate(updateAccountSchema), updateAccount)
  .delete(deleteAccount);

module.exports = router;
