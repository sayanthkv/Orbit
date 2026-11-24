const mongoose = require('mongoose');
const SavingsGoal = require('../models/SavingsGoal');
const GoalContribution = require('../models/GoalContribution');

// GET /api/goals - List all goals with progress and monthly needed
const getGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id })
      .populate('linkedAccount', 'name type')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const data = goals.map((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
      const percentage = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;

      let monthlyNeeded = null;
      if (goal.targetDate && remaining > 0) {
        const target = new Date(goal.targetDate);
        const diffMonths =
          (target.getFullYear() - now.getFullYear()) * 12 +
          (target.getMonth() - now.getMonth());
        const months = Math.max(1, diffMonths);
        monthlyNeeded = Number((remaining / months).toFixed(2));
      }

      return {
        ...goal,
        remaining,
        percentage: Math.min(100, Number(percentage.toFixed(1))),
        monthlyNeeded,
      };
    });

    res.status(200).json({
      success: true,
      data: { goals: data },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/goals - Create a goal
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, targetDate, linkedAccount, icon, color } = req.body;

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name: name.trim(),
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      linkedAccount: linkedAccount || undefined,
      icon: icon || 'Target',
      color: color || '#10b981',
      savedAmount: 0,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/goals/:id - Update goal
const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/goals/:id/contributions - Add or withdraw contribution
const addContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type = 'add', date, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await SavingsGoal.findOne({ _id: id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (type === 'withdraw' && amount > goal.savedAmount) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw ₹${amount} as current saved amount is ₹${goal.savedAmount}`,
      });
    }

    const contribution = await GoalContribution.create({
      user: req.user._id,
      goal: goal._id,
      amount,
      type,
      date: date || new Date(),
      note: note || '',
    });

    if (type === 'add') {
      goal.savedAmount += amount;
      if (goal.savedAmount >= goal.targetAmount) {
        goal.status = 'completed';
      }
    } else {
      goal.savedAmount = Math.max(0, goal.savedAmount - amount);
      if (goal.status === 'completed' && goal.savedAmount < goal.targetAmount) {
        goal.status = 'active';
      }
    }
    await goal.save();

    res.status(201).json({
      success: true,
      message: `Successfully ${type === 'add' ? 'added to' : 'withdrawn from'} goal`,
      data: { contribution, goal },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/goals/:id/contributions - Get contribution history
const getContributions = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const contributions = await GoalContribution.find({
      goal: id,
      user: req.user._id,
    }).sort({ date: -1, createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: { contributions },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/goals/:id - Delete goal & contributions
const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await SavingsGoal.findOneAndDelete({ _id: id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    await GoalContribution.deleteMany({ goal: id, user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Goal and contribution history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  addContribution,
  getContributions,
  deleteGoal,
};
