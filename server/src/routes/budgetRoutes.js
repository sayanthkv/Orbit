const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { budgetSchema } = require('../validators/budgetValidator');
const {
  getBudgets,
  setBudget,
  deleteBudget,
} = require('../controllers/budgetController');

router.use(requireAuth);

router.route('/')
  .get(getBudgets)
  .post(validate(budgetSchema), setBudget);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
