const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get monthly category budgets with actual spending and 80%/100% warning flags
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. Fetch user's budgets for this month/year
    const budgets = await Budget.find({
      user: req.user._id,
      month,
      year,
    }).populate('category', 'name icon color type isDefault');

    // 2. Aggregate spending per category for this month
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = {};
    categorySpending.forEach((cs) => {
      spendingMap[cs._id.toString()] = cs.spent;
    });

    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;

    const enrichedBudgets = budgets.map((b) => {
      const catId = b.category?._id?.toString() || b.category?.toString();
      const spent = spendingMap[catId] || 0;
      const percentage = Math.round((spent / b.monthlyLimit) * 100);
      const remaining = Math.max(0, b.monthlyLimit - spent);
      const isExceeded = spent >= b.monthlyLimit; // 100%+
      const isWarning = spent >= b.monthlyLimit * 0.8 && !isExceeded; // 80%-99%

      totalBudgetLimit += b.monthlyLimit;
      totalBudgetSpent += spent;

      return {
        _id: b._id,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        month: b.month,
        year: b.year,
        spent,
        remaining,
        percentage,
        isWarning,
        isExceeded,
        isHealthy: !isWarning && !isExceeded,
      };
    });

    // Sort: exceeded first, then warning, then healthy
    enrichedBudgets.sort((a, b) => b.percentage - a.percentage);

    const warningsCount = enrichedBudgets.filter((b) => b.isWarning).length;
    const exceededCount = enrichedBudgets.filter((b) => b.isExceeded).length;

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        budgets: enrichedBudgets,
        overview: {
          totalLimit: totalBudgetLimit,
          totalSpent: totalBudgetSpent,
          totalRemaining: Math.max(0, totalBudgetLimit - totalBudgetSpent),
          overallPercentage:
            totalBudgetLimit > 0
              ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100)
              : 0,
          warningsCount,
          exceededCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set or update a monthly budget
// @route   POST /api/budgets
// @access  Private
const setBudget = async (req, res, next) => {
  try {
    const { category: categoryId, monthlyLimit, month, year } = req.body;

    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ isDefault: true }, { user: req.user._id }],
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category specified for budget.',
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category: category._id,
        month,
        year,
      },
      {
        monthlyLimit,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate('category', 'name icon color type isDefault');

    res.status(200).json({
      success: true,
      message: `Budget of ₹${monthlyLimit} set for ${category.name}.`,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget removed successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  setBudget,
  deleteBudget,
};
