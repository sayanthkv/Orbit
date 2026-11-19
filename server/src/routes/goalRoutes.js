const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  depositGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createGoalSchema,
  updateGoalSchema,
  depositGoalSchema,
} = require('../validations/goalValidation');

router.use(protect);

router.get('/', getGoals);
router.post('/', validate(createGoalSchema), createGoal);
router.put('/:id', validate(updateGoalSchema), updateGoal);
router.post('/:id/deposit', validate(depositGoalSchema), depositGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
