const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { recurringRuleSchema } = require('../validators/recurringValidator');
const {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  toggleRecurringRule,
  deleteRecurringRule,
} = require('../controllers/recurringController');

router.use(requireAuth);

router.route('/')
  .get(getRecurringRules)
  .post(validate(recurringRuleSchema), createRecurringRule);

router.route('/:id')
  .put(validate(recurringRuleSchema), updateRecurringRule)
  .delete(deleteRecurringRule);

router.patch('/:id/toggle', toggleRecurringRule);

module.exports = router;
