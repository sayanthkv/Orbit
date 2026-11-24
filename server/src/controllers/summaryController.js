const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashProfile = require('../models/CashProfile');
const CashTransaction = require('../models/CashTransaction');
const Budget = require('../models/Budget');
const { computeAllAccountsWithBalances, computeCashBalance } = require('../utils/balanceHelper');

// GET /api/summary - Dashboard data with cards, charts, budgets, and recent transactions
const getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const selMonth = month ? Number(month) : now.getUTCMonth() + 1;
    const selYear = year ? Number(year) : now.getUTCFullYear();

    const startOfMonth = new Date(Date.UTC(selYear, selMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(selYear, selMonth, 0, 23, 59, 59, 999));
    const uId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Fetch non-archived Accounts with balances
    const accountsWithBalance = await computeAllAccountsWithBalances(req.user._id, { isArchived: false });
    const totalBankBalance = accountsWithBalance.reduce((sum, a) => sum + a.currentBalance, 0);

    // 2. Fetch Cash Profile with balance
    let cashProfile = await CashProfile.findOne({ user: req.user._id });
    if (!cashProfile) {
      cashProfile = await CashProfile.create({ user: req.user._id, openingBalance: 0 });
    }

    const { currentBalance: cashInHand } = await computeCashBalance(
      req.user._id,
      cashProfile.openingBalance
    );

    const grandTotal = totalBankBalance + cashInHand;

    // 3. This Month Income & Expense (Bank + Cash combined)
    const [monthlyBankAgg, monthlyCashAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: uId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      CashTransaction.aggregate([
        {
          $match: {
            user: uId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
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

    let bankMonthlyIncome = 0;
    let bankMonthlyExpense = 0;
    for (const item of monthlyBankAgg) {
      if (item._id === 'income') bankMonthlyIncome = item.total;
      if (item._id === 'expense') bankMonthlyExpense = item.total;
    }

    let cashMonthlyIncome = 0;
    let cashMonthlyExpense = 0;
    for (const item of monthlyCashAgg) {
      if (item._id === 'income') cashMonthlyIncome = item.total;
      if (item._id === 'expense') cashMonthlyExpense = item.total;
    }

    const monthlyIncome = bankMonthlyIncome + cashMonthlyIncome;
    const monthlyExpense = bankMonthlyExpense + cashMonthlyExpense;
    const netSavings = monthlyIncome - monthlyExpense;

    // 4. Category breakdown for pie / donut chart
    const [bankCategoryAgg, cashCategoryAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: uId,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]),
      CashTransaction.aggregate([
        {
          $match: {
            user: uId,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const categoryMap = {};
    for (const item of bankCategoryAgg) {
      categoryMap[item._id] = (categoryMap[item._id] || 0) + item.total;
    }
    for (const item of cashCategoryAgg) {
      categoryMap[item._id] = (categoryMap[item._id] || 0) + item.total;
    }

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([cat, total]) => ({
        category: cat,
        amount: total,
        percentage: monthlyExpense > 0 ? Number(((total / monthlyExpense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Daily Spending Trend for area/line chart
    const [bankDailyAgg, cashDailyAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: uId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      CashTransaction.aggregate([
        {
          $match: {
            user: uId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const daysInMonth = new Date(Date.UTC(selYear, selMonth, 0)).getUTCDate();
    const dailyData = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyData[d] = { day: d, income: 0, expense: 0 };
    }

    for (const item of [...bankDailyAgg, ...cashDailyAgg]) {
      const d = item._id.day;
      if (dailyData[d]) {
        dailyData[d][item._id.type] += item.total;
      }
    }

    const spendingTrend = Object.values(dailyData);

    // 6. Recent transactions (5 most recent bank + cash combined)
    const [recentBank, recentCash] = await Promise.all([
      Transaction.find({ user: uId })
        .populate('account', 'name type')
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      CashTransaction.find({ user: uId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const formattedRecent = [
      ...recentBank.map((t) => ({
        _id: t._id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        note: t.note,
        source: 'bank',
        sourceName: t.account?.name || 'Bank Account',
      })),
      ...recentCash.map((t) => ({
        _id: t._id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        note: t.note,
        source: 'cash',
        sourceName: 'Cash in Hand',
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // 7. Compact Budget Summary for Dashboard
    const budgets = await Budget.find({ user: uId }).lean();
    const budgetSummary = budgets.map((b) => {
      const spent = categoryMap[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        spent,
        percentage: Number(pct.toFixed(1)),
        status: pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'normal',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        month: selMonth,
        year: selYear,
        totalBankBalance,
        cashInHand,
        grandTotal,
        monthlyIncome,
        monthlyExpense,
        netSavings,
        accounts: accountsWithBalance,
        categoryBreakdown,
        spendingTrend,
        recentTransactions: formattedRecent,
        budgetSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
};
