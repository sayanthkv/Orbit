const express = require('express');
const router = express.Router();
const {
  getBudgets,
  setBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { setBudgetSchema } = require('../validations/budgetValidation');

router.use(protect);

router.get('/', getBudgets);
router.post('/', validate(setBudgetSchema), setBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
