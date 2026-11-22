const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const { processDueRecurringTransactions } = require('../services/cronService');

// Helper to get start and end Date for a given month and year
const getMonthDateRange = (month, year) => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  // Last day of month
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

// Helper for prior month range
const getPriorMonthDateRange = (month, year) => {
  let m = parseInt(month, 10) - 1;
  let y = parseInt(year, 10);
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return getMonthDateRange(m, y);
};

// @desc    Get monthly KPI summary (income, expense, balance, savings rate, MoM change)
// @route   GET /api/analytics/summary
// @access  Private
const getMonthlySummary = async (req, res, next) => {
  try {
    // Run catch-up for any due recurring transactions (handles Render wake up)
    await processDueRecurringTransactions(req.user._id).catch(() => {});

    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const accountId = req.query.accountId;
    const accountFilter = accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)
      ? { account: new mongoose.Types.ObjectId(accountId) }
      : {};

    const { startDate, endDate } = getMonthDateRange(month, year);
    const { startDate: priorStart, endDate: priorEnd } = getPriorMonthDateRange(month, year);

    // Current month totals (strictly expense & income, excluding internal transfers)
    const currentTotals = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          type: { $in: ['expense', 'income'] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Prior month totals for MoM comparisons (strictly expense & income)
    const priorTotals = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          type: { $in: ['expense', 'income'] },
          date: { $gte: priorStart, $lte: priorEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    currentTotals.forEach((t) => {
      if (t._id === 'income') totalIncome = t.total;
      if (t._id === 'expense') totalExpense = t.total;
    });

    let priorIncome = 0;
    let priorExpense = 0;
    priorTotals.forEach((t) => {
      if (t._id === 'income') priorIncome = t.total;
      if (t._id === 'expense') priorExpense = t.total;
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 0;

    // Month-over-month percentage changes
    const incomeChangeMoM =
      priorIncome > 0 ? Math.round(((totalIncome - priorIncome) / priorIncome) * 100) : 0;
    const expenseChangeMoM =
      priorExpense > 0 ? Math.round(((totalExpense - priorExpense) / priorExpense) * 100) : 0;

    // All-time totals & balance (strictly expense & income)
    const allTimeTotals = await Transaction.aggregate([
      { $match: { user: req.user._id, ...accountFilter, type: { $in: ['expense', 'income'] } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeTotals.forEach((t) => {
      if (t._id === 'income') allTimeIncome = t.total;
      if (t._id === 'expense') allTimeExpense = t.total;
    });

    let initialBalance = 0;
    let activeAccount = null;
    let accountTransfersDelta = 0;

    if (accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)) {
      activeAccount = await Account.findOne({ _id: accountId, user: req.user._id });
      initialBalance = activeAccount ? (activeAccount.initialBalance || 0) : 0;

      if (activeAccount) {
        const [transfersOutRes, transfersInRes] = await Promise.all([
          Transaction.aggregate([
            { $match: { user: req.user._id, account: activeAccount._id, type: 'transfer' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Transaction.aggregate([
            { $match: { user: req.user._id, toAccount: activeAccount._id, type: 'transfer' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);
        const transfersOut = transfersOutRes[0]?.total || 0;
        const transfersIn = transfersInRes[0]?.total || 0;
        accountTransfersDelta = transfersIn - transfersOut;
      }
    } else {
      const accounts = await Account.find({ user: req.user._id });
      initialBalance = accounts.reduce((acc, a) => acc + (a.initialBalance || 0), 0);
      if (accounts.length === 0) {
        initialBalance = req.user.initialBalance || 0;
      }
    }

    const allTimeBalance = initialBalance + allTimeIncome - allTimeExpense + accountTransfersDelta;

    // Safe to Spend calculation per day for the rest of the month
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();
    const isFutureMonth = year > now.getFullYear() || (year === now.getFullYear() && month > (now.getMonth() + 1));

    let daysRemaining = 0;
    if (isCurrentMonth) {
      daysRemaining = Math.max(1, totalDaysInMonth - now.getDate() + 1);
    } else if (isFutureMonth) {
      daysRemaining = totalDaysInMonth;
    } else {
      daysRemaining = 0;
    }

    const userBudgets = await Budget.find({ user: req.user._id, month, year }).populate(
      'category',
      'name icon color'
    );
    const totalBudgetLimit = userBudgets.reduce((acc, b) => acc + (b.monthlyLimit || 0), 0);

    const poolType = totalBudgetLimit > 0 ? 'budget' : 'income';
    const poolTotal = totalBudgetLimit > 0 ? totalBudgetLimit : totalIncome;
    const remainingPool = Math.max(0, poolTotal - totalExpense);
    const safeToSpendDaily = daysRemaining > 0 ? Math.round((remainingPool / daysRemaining) * 100) / 100 : 0;

    // Budget warnings & exceeded alerts for this month
    const budgetAlerts = [];
    if (userBudgets.length > 0) {
      const catSpend = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]);
      const catSpendMap = {};
      catSpend.forEach((cs) => {
        catSpendMap[cs._id.toString()] = cs.total;
      });

      userBudgets.forEach((b) => {
        const spent = catSpendMap[b.category?._id?.toString()] || 0;
        const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
        if (pct >= 100) {
          budgetAlerts.push({
            id: b._id,
            category: b.category?.name || 'Category',
            type: 'danger',
            percentage: pct,
            spent,
            limit: b.monthlyLimit,
            message: `${b.category?.name || 'Category'} budget exceeded (${pct}% spent)`,
          });
        } else if (pct >= 80) {
          budgetAlerts.push({
            id: b._id,
            category: b.category?.name || 'Category',
            type: 'warning',
            percentage: pct,
            spent,
            limit: b.monthlyLimit,
            message: `${b.category?.name || 'Category'} is at ${pct}% of budget limit`,
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        accountId: accountId || 'all',
        account: activeAccount ? {
          id: activeAccount._id,
          name: activeAccount.name,
          type: activeAccount.type,
          color: activeAccount.color,
          icon: activeAccount.icon,
        } : null,
        initialBalance,
        totalIncome,
        totalExpense,
        netBalance,
        allTimeBalance,
        allTimeIncome,
        allTimeExpense,
        savingsRate,
        priorIncome,
        priorExpense,
        incomeChangeMoM,
        expenseChangeMoM,
        safeToSpend: {
          dailyAmount: safeToSpendDaily,
          daysRemaining,
          totalDays: totalDaysInMonth,
          poolType,
          poolTotal,
          remainingPool,
        },
        budgetAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breakdown donut chart data
// @route   GET /api/analytics/category-breakdown
// @access  Private
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const type = req.query.type || 'expense';
    const accountId = req.query.accountId;
    const accountFilter = accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)
      ? { account: new mongoose.Types.ObjectId(accountId) }
      : {};

    const { startDate, endDate } = getMonthDateRange(month, year);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          type,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          _id: 1,
          categoryId: '$_id',
          name: '$categoryDetails.name',
          icon: '$categoryDetails.icon',
          color: '$categoryDetails.color',
          totalAmount: 1,
          count: 1,
        },
      },
    ]);

    const totalSum = breakdown.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const formatted = breakdown.map((item) => ({
      ...item,
      percentage: totalSum > 0 ? Math.round((item.totalAmount / totalSum) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSum,
        items: formatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending trends: daily spending for active month and 6-month historical overview
// @route   GET /api/analytics/trends
// @access  Private
const getTrends = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const accountId = req.query.accountId;
    const accountFilter = accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)
      ? { account: new mongoose.Types.ObjectId(accountId) }
      : {};

    const { startDate, endDate } = getMonthDateRange(month, year);

    // 1. Daily spending trend for selected month
    const dailyExpenses = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = {};
    dailyExpenses.forEach((d) => {
      dailyMap[d._id] = d.amount;
    });

    const dailyTrend = [];
    let runningCumulative = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAmount = dailyMap[day] || 0;
      runningCumulative += dayAmount;
      dailyTrend.push({
        day: `Day ${day}`,
        dayNumber: day,
        amount: dayAmount,
        cumulative: runningCumulative,
      });
    }

    // 2. Last 6 months income vs expense overview
    const sixMonthsAgo = new Date(year, month - 6, 1);
    const monthlyComparison = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          date: { $gte: sixMonthsAgo, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format 6-month data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};

    monthlyComparison.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = {
          name: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(2)}`,
          month: item._id.month,
          year: item._id.year,
          income: 0,
          expense: 0,
        };
      }
      if (item._id.type === 'income') monthlyDataMap[key].income = item.total;
      if (item._id.type === 'expense') monthlyDataMap[key].expense = item.total;
    });

    const sixMonthsTrend = Object.values(monthlyDataMap);

    // Calculate Net Worth trajectory across the historical 6-month timeline
    const allAccounts = await Account.find({ user: req.user._id });
    const totalStartingBalance = allAccounts.reduce((acc, a) => acc + (a.initialBalance || 0), 0);
    let runningNetWorth = totalStartingBalance;

    const netWorthTrend = sixMonthsTrend.map((m) => {
      runningNetWorth += (m.income - m.expense);
      return {
        ...m,
        netWorth: runningNetWorth,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        dailyTrend,
        sixMonthsTrend,
        netWorthTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic smart insights (MoM category comparisons, top expense, savings highlight)
// @route   GET /api/analytics/insights
// @access  Private
const getSmartInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const accountId = req.query.accountId;
    const accountFilter = accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)
      ? { account: new mongoose.Types.ObjectId(accountId) }
      : {};

    const { startDate, endDate } = getMonthDateRange(month, year);
    const { startDate: priorStart, endDate: priorEnd } = getPriorMonthDateRange(month, year);

    // Current month by category
    const [currentCats, priorCats, currentTotals] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            ...accountFilter,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: '$cat' },
        {
          $project: {
            name: '$cat.name',
            color: '$cat.color',
            total: 1,
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            ...accountFilter,
            type: 'expense',
            date: { $gte: priorStart, $lte: priorEnd },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: '$cat' },
        {
          $project: {
            name: '$cat.name',
            total: 1,
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            ...accountFilter,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const insights = [];

    // Map prior month categories
    const priorMap = {};
    priorCats.forEach((c) => {
      priorMap[c.name] = c.total;
    });

    let totalExpense = 0;
    let totalIncome = 0;
    currentTotals.forEach((t) => {
      if (t._id === 'expense') totalExpense = t.total;
      if (t._id === 'income') totalIncome = t.total;
    });

    // 1. Category MoM comparison insights (e.g. "You spent 30% more on Food than last month")
    currentCats.forEach((cat) => {
      const prevAmount = priorMap[cat.name];
      if (prevAmount && prevAmount > 0) {
        const diffPercent = Math.round(((cat.total - prevAmount) / prevAmount) * 100);
        if (diffPercent >= 20) {
          insights.push({
            type: 'warning',
            title: `Spending spike in ${cat.name}`,
            message: `You spent ${diffPercent}% more on ${cat.name} than last month.`,
            category: cat.name,
            color: cat.color,
          });
        } else if (diffPercent <= -20) {
          insights.push({
            type: 'success',
            title: `Savings in ${cat.name}`,
            message: `Great job! Your spending on ${cat.name} decreased by ${Math.abs(diffPercent)}% compared to last month.`,
            category: cat.name,
            color: cat.color,
          });
        }
      }
    });

    // 2. Top spending category insight
    if (currentCats.length > 0 && totalExpense > 0) {
      const topCategory = [...currentCats].sort((a, b) => b.total - a.total)[0];
      const percentOfTotal = Math.round((topCategory.total / totalExpense) * 100);
      insights.push({
        type: 'info',
        title: `Primary Outflow: ${topCategory.name}`,
        message: `${topCategory.name} was your largest expense, accounting for ${percentOfTotal}% of all money spent this month.`,
        category: topCategory.name,
        color: topCategory.color,
      });
    }

    // 3. Weekend vs Weekday spending insight
    const weekendTxs = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          ...accountFilter,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          amount: 1,
          dayOfWeek: { $dayOfWeek: '$date' }, // 1 is Sunday, 7 is Saturday
        },
      },
      {
        $group: {
          _id: { $in: ['$dayOfWeek', [1, 7]] }, // true = weekend
          total: { $sum: '$amount' },
        },
      },
    ]);

    let weekendSpent = 0;
    weekendTxs.forEach((w) => {
      if (w._id === true) weekendSpent = w.total;
    });

    if (totalExpense > 0) {
      const weekendPct = Math.round((weekendSpent / totalExpense) * 100);
      if (weekendPct >= 40) {
        insights.push({
          type: 'info',
          title: 'High Weekend Outflow',
          message: `Weekend spending accounts for ${weekendPct}% of your total expenses this month.`,
          icon: 'Calendar',
        });
      }
    }

    // 4. Savings Rate insight
    if (totalIncome > 0) {
      const rate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      if (rate >= 30) {
        insights.push({
          type: 'success',
          title: 'Healthy Savings Rate',
          message: `You saved ${rate}% of your income this month. Excellent financial discipline!`,
        });
      } else if (rate <= 0) {
        insights.push({
          type: 'danger',
          title: 'Deficit Warning',
          message: `Expenses exceeded income by ₹${Math.abs(totalIncome - totalExpense).toLocaleString('en-IN')}. Consider curbing non-essential expenses.`,
        });
      }
    }

    // Default insight if none triggered yet
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Track consistently',
        message: 'Log daily expenses to unlock personalized AI-driven financial insights and alerts.',
      });
    }

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrends,
  getSmartInsights,
};
