const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createGoalSchema,
  updateGoalSchema,
  contributionSchema,
} = require('../validators/goalValidator');
const {
  getGoals,
  createGoal,
  updateGoal,
  addContribution,
  getContributions,
  deleteGoal,
} = require('../controllers/goalController');

router.use(requireAuth);

router.route('/')
  .get(getGoals)
  .post(validate(createGoalSchema), createGoal);

router.route('/:id')
  .put(validate(updateGoalSchema), updateGoal)
  .delete(deleteGoal);

router.route('/:id/contributions')
  .get(getContributions)
  .post(validate(contributionSchema), addContribution);

module.exports = router;
