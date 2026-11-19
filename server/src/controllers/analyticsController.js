const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

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
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const { startDate, endDate } = getMonthDateRange(month, year);
    const { startDate: priorStart, endDate: priorEnd } = getPriorMonthDateRange(month, year);

    // Current month totals
    const currentTotals = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
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

    // Prior month totals for MoM comparisons
    const priorTotals = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
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

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate,
        priorIncome,
        priorExpense,
        incomeChangeMoM,
        expenseChangeMoM,
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

    const { startDate, endDate } = getMonthDateRange(month, year);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
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

    const { startDate, endDate } = getMonthDateRange(month, year);

    // 1. Daily spending trend for selected month
    const dailyExpenses = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
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

    res.status(200).json({
      success: true,
      data: {
        dailyTrend,
        sixMonthsTrend,
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

    const { startDate, endDate } = getMonthDateRange(month, year);
    const { startDate: priorStart, endDate: priorEnd } = getPriorMonthDateRange(month, year);

    // Current month by category
    const [currentCats, priorCats, currentTotals] = await Promise.all([
      Transaction.aggregate([
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

    // 3. Savings Rate insight
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
