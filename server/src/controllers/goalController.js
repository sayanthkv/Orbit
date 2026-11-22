const Goal = require('../models/Goal');

// @desc    Get all savings goals for user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });

    const formattedGoals = goals.map((g) => {
      const percentage = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);

      let daysRemaining = null;
      let suggestedMonthlyContribution = 0;
      if (g.targetDate) {
        const diffTime = new Date(g.targetDate) - new Date();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining > 0 && remaining > 0) {
          const monthsRemaining = Math.max(1, daysRemaining / 30.4375);
          suggestedMonthlyContribution = Math.round((remaining / monthsRemaining) * 100) / 100;
        }
      }

      return {
        _id: g._id,
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        color: g.color,
        percentage,
        remaining,
        daysRemaining,
        suggestedMonthlyContribution,
        isCompleted: g.currentAmount >= g.targetAmount,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedGoals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new savings goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, currentAmount, targetDate, color } = req.body;

    const goal = await Goal.create({
      user: req.user._id,
      title: title.trim(),
      targetAmount,
      currentAmount: currentAmount || 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      color: color || '#10B981',
    });

    res.status(201).json({
      success: true,
      message: `Savings goal "${goal.title}" created!`,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { title, targetAmount, currentAmount, targetDate, color } = req.body;
    if (title) goal.title = title.trim();
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : null;
    if (color) goal.color = color;

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deposit funds into a goal
// @route   POST /api/goals/:id/deposit
// @access  Private
const depositGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { amount } = req.body;
    goal.currentAmount += Number(amount);
    await goal.save();

    res.status(200).json({
      success: true,
      message: `Deposited ₹${amount} towards "${goal.title}"!`,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Goal removed successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  depositGoal,
  deleteGoal,
};
