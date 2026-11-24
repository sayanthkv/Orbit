const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');
const Budget = require('../models/Budget');

// GET /api/insights - Compute prioritized insights for dashboard
const getInsights = async (req, res, next) => {
  try {
    const uId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed

    // Current month start & end
    const startCurrent = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endCurrent = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    // Last month start & end
    const startLast = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endLast = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    // 7 days ago
    const startWeek = new Date(now);
    startWeek.setDate(startWeek.getDate() - 7);

    // Fetch this month expenses (bank + cash)
    const [thisMonthBank, thisMonthCash, lastMonthBank, lastMonthCash, weekBank, weekCash, budgets] =
      await Promise.all([
        Transaction.find({ user: uId, type: 'expense', date: { $gte: startCurrent, $lte: endCurrent } }).lean(),
        CashTransaction.find({ user: uId, type: 'expense', date: { $gte: startCurrent, $lte: endCurrent } }).lean(),
        Transaction.find({ user: uId, type: 'expense', date: { $gte: startLast, $lte: endLast } }).lean(),
        CashTransaction.find({ user: uId, type: 'expense', date: { $gte: startLast, $lte: endLast } }).lean(),
        Transaction.find({ user: uId, type: 'expense', date: { $gte: startWeek } }).lean(),
        CashTransaction.find({ user: uId, type: 'expense', date: { $gte: startWeek } }).lean(),
        Budget.find({ user: uId }).lean(),
      ]);

    const thisMonthExpenses = [...thisMonthBank, ...thisMonthCash];
    const lastMonthExpenses = [...lastMonthBank, ...lastMonthCash];
    const weekExpenses = [...weekBank, ...weekCash];

    const insights = [];

    // 1. Budget Alerts (Danger >= 100%, Warning >= 80%)
    const catSpentMap = {};
    for (const tx of thisMonthExpenses) {
      catSpentMap[tx.category] = (catSpentMap[tx.category] || 0) + tx.amount;
    }

    for (const b of budgets) {
      const spent = catSpentMap[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (pct >= 100) {
        insights.push({
          id: `budget-exceeded-${b.category}`,
          priority: 1,
          type: 'danger',
          icon: 'AlertTriangle',
          title: 'Budget Exceeded',
          text: `You have spent ₹${spent.toFixed(0)} (${pct.toFixed(0)}%) of your ₹${b.amount} ${b.category} budget.`,
        });
      } else if (pct >= 80) {
        insights.push({
          id: `budget-warning-${b.category}`,
          priority: 2,
          type: 'warning',
          icon: 'AlertCircle',
          title: 'Budget Alert',
          text: `You have reached ${pct.toFixed(0)}% of your ${b.category} budget (₹${spent.toFixed(0)} / ₹${b.amount}).`,
        });
      }
    }

    const currentTotalExpense = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastTotalExpense = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // 2. Spend vs Last Month
    if (lastTotalExpense > 0 && currentTotalExpense > 0) {
      const diff = currentTotalExpense - lastTotalExpense;
      const pctChange = ((diff / lastTotalExpense) * 100).toFixed(0);
      if (Math.abs(pctChange) >= 5) {
        const isHigher = diff > 0;
        insights.push({
          id: 'spend-vs-last-month',
          priority: 3,
          type: isHigher ? 'warning' : 'success',
          icon: isHigher ? 'TrendingUp' : 'TrendingDown',
          title: isHigher ? 'Higher Monthly Spend' : 'Reduced Spending',
          text: isHigher
            ? `Your overall outflow is ${pctChange}% higher than last month's total at this stage.`
            : `Great job! You have spent ${Math.abs(pctChange)}% less than last month so far.`,
        });
      }
    }

    // 3. Average Daily Spend & Projected Month-End Spend
    const dayOfMonth = Math.max(1, now.getUTCDate());
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    if (currentTotalExpense > 0) {
      const dailyAvg = currentTotalExpense / dayOfMonth;
      const projected = dailyAvg * daysInMonth;

      insights.push({
        id: 'projected-spend',
        priority: 4,
        type: 'info',
        icon: 'Calendar',
        title: 'Projected Month Outflow',
        text: `At an average of ₹${dailyAvg.toFixed(0)}/day, your projected month-end outflow is ₹${projected.toFixed(0)}.`,
      });
    }

    // 4. Biggest Spending Day this month
    if (thisMonthExpenses.length > 0) {
      const dayMap = {};
      for (const tx of thisMonthExpenses) {
        const dayStr = new Date(tx.date).toISOString().split('T')[0];
        dayMap[dayStr] = (dayMap[dayStr] || 0) + tx.amount;
      }

      let maxDay = null;
      let maxAmount = 0;
      for (const [day, amount] of Object.entries(dayMap)) {
        if (amount > maxAmount) {
          maxAmount = amount;
          maxDay = day;
        }
      }

      if (maxDay && maxAmount > 0) {
        const dateObj = new Date(maxDay);
        const formatted = dateObj.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        });
        insights.push({
          id: 'biggest-spending-day',
          priority: 5,
          type: 'info',
          icon: 'Zap',
          title: 'Peak Spending Day',
          text: `${formatted} was your highest spending day this month, with ₹${maxAmount.toFixed(0)} recorded.`,
        });
      }
    }

    // 5. Top expense this week
    if (weekExpenses.length > 0) {
      const topWeek = [...weekExpenses].sort((a, b) => b.amount - a.amount)[0];
      if (topWeek && topWeek.amount > 0) {
        insights.push({
          id: 'top-expense-week',
          priority: 6,
          type: 'info',
          icon: 'ShoppingBag',
          title: 'Top Expense This Week',
          text: `Your largest single outflow in the past 7 days was ₹${topWeek.amount.toFixed(0)} on ${topWeek.category}.`,
        });
      }
    }

    // Fallback if no insights or new user
    if (insights.length === 0) {
      insights.push({
        id: 'welcome-insight',
        priority: 10,
        type: 'info',
        icon: 'Sparkles',
        title: 'Ready to Track',
        text: 'Add your first transactions to unlock personalized spending intelligence and budget tracking.',
      });
    }

    // Sort by priority and take at most 5
    const prioritized = insights.sort((a, b) => a.priority - b.priority).slice(0, 5);

    res.status(200).json({
      success: true,
      data: { insights: prioritized },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
};
