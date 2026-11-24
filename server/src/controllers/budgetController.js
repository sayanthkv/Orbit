const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');

// GET /api/budgets - Get user's budgets with spent calculations for a month
const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const selMonth = month ? Number(month) : now.getUTCMonth() + 1;
    const selYear = year ? Number(year) : now.getUTCFullYear();

    const start = new Date(Date.UTC(selYear, selMonth - 1, 1));
    const end = new Date(Date.UTC(selYear, selMonth, 0, 23, 59, 59, 999));

    const budgets = await Budget.find({ user: req.user._id }).sort({ category: 1 }).lean();

    // Aggregate bank expenses by category
    const bankExpenses = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Aggregate cash expenses by category
    const cashExpenses = await CashTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const spentMap = {};
    for (const item of bankExpenses) {
      spentMap[item._id] = (spentMap[item._id] || 0) + item.total;
    }
    for (const item of cashExpenses) {
      spentMap[item._id] = (spentMap[item._id] || 0) + item.total;
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const data = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      let status = 'normal';
      if (percentage >= 100) status = 'danger';
      else if (percentage >= 80) status = 'warning';

      totalBudget += b.amount;
      totalSpent += spent;

      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        spent,
        remaining: Math.max(0, b.amount - spent),
        percentage: Number(percentage.toFixed(1)),
        status,
        createdAt: b.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        month: selMonth,
        year: selYear,
        budgets: data,
        totalBudget,
        totalSpent,
        totalPercentage: totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budgets - Set or update budget for a category
const setBudget = async (req, res, next) => {
  try {
    const { category, amount, period } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category: category.trim() },
      { amount, period: period || 'monthly' },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/budgets/:id - Delete a budget
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid budget ID' });
    }

    const budget = await Budget.findOneAndDelete({ _id: id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
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
