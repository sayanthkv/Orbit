const express = require('express');
const router = express.Router();
const {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  triggerProcess,
  runRuleNow,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createRecurringSchema,
  updateRecurringSchema,
} = require('../validations/recurringValidation');

router.use(protect);

router.get('/', getRecurringRules);
router.post('/', validate(createRecurringSchema), createRecurringRule);
router.put('/:id', validate(updateRecurringSchema), updateRecurringRule);
router.delete('/:id', deleteRecurringRule);
router.post('/process', triggerProcess);
router.post('/:id/run', runRuleNow);

module.exports = router;
