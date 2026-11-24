const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');

// Build query conditions for combined expenses
const buildExpenseConditions = (userId, query) => {
  const { startDate, endDate, category, minAmount, maxAmount, search, tag } = query;
  const conditions = {
    user: new mongoose.Types.ObjectId(userId),
    type: 'expense',
  };

  if (startDate || endDate) {
    conditions.date = {};
    if (startDate) conditions.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      conditions.date.$lte = end;
    }
  }

  if (category && category !== 'all') {
    conditions.category = category;
  }

  if (tag) {
    conditions.tags = tag;
  }

  if (minAmount || maxAmount) {
    conditions.amount = {};
    if (minAmount) conditions.amount.$gte = Number(minAmount);
    if (maxAmount) conditions.amount.$lte = Number(maxAmount);
  }

  if (search && search.trim()) {
    conditions.$or = [
      { note: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
    ];
  }

  return conditions;
};

// GET /api/expenses - Combined all-expenses list across all bank accounts and cash
const getAllExpenses = async (req, res, next) => {
  try {
    const {
      source = 'all', // 'all' | 'cash' | accountId
      sortBy = 'date', // 'date' | 'amount'
      sortOrder = 'desc', // 'desc' | 'asc'
      page = 1,
      limit = 25,
    } = req.query;

    const baseConditions = buildExpenseConditions(req.user._id, req.query);
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy === 'amount' ? 'amount' : 'date';

    let allExpenses = [];

    // Query Bank Expenses
    if (source === 'all' || (source !== 'cash' && mongoose.Types.ObjectId.isValid(source))) {
      const bankConditions = { ...baseConditions };
      if (source !== 'all') {
        bankConditions.account = new mongoose.Types.ObjectId(source);
      }

      const bankExpenses = await Transaction.aggregate([
        { $match: bankConditions },
        {
          $lookup: {
            from: 'accounts',
            localField: 'account',
            foreignField: '_id',
            as: 'accountDetails',
          },
        },
        { $unwind: '$accountDetails' },
        {
          $project: {
            _id: 1,
            amount: 1,
            category: 1,
            date: 1,
            note: 1,
            tags: 1,
            attachment: 1,
            recurringRuleId: 1,
            createdAt: 1,
            sourceType: { $literal: 'bank' },
            sourceId: '$account',
            sourceName: '$accountDetails.name',
            sourceTypeLabel: '$accountDetails.type',
            isArchived: '$accountDetails.isArchived',
          },
        },
      ]);
      allExpenses.push(...bankExpenses);
    }

    // Query Cash Expenses
    if (source === 'all' || source === 'cash') {
      const cashExpenses = await CashTransaction.aggregate([
        { $match: baseConditions },
        {
          $project: {
            _id: 1,
            amount: 1,
            category: 1,
            date: 1,
            note: 1,
            tags: 1,
            attachment: 1,
            recurringRuleId: 1,
            createdAt: 1,
            sourceType: { $literal: 'cash' },
            sourceId: { $literal: 'cash' },
            sourceName: { $literal: 'Cash in Hand' },
            sourceTypeLabel: { $literal: 'Cash' },
            isArchived: { $literal: false },
          },
        },
      ]);
      allExpenses.push(...cashExpenses);
    }

    // In-memory sort of merged result
    allExpenses.sort((a, b) => {
      if (sortField === 'amount') {
        return (a.amount - b.amount) * sortMultiplier;
      }
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * sortMultiplier;
    });

    const totalCount = allExpenses.length;
    const totalAmount = allExpenses.reduce((sum, item) => sum + item.amount, 0);

    // Apply pagination
    const currentPage = Math.max(1, Number(page));
    const itemsPerPage = Math.max(1, Number(limit));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedExpenses = allExpenses.slice(startIndex, startIndex + itemsPerPage);

    // Category breakdown aggregation
    const categoryTotals = {};
    for (const exp of allExpenses) {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([cat, total]) => ({
        category: cat,
        total,
        percentage: totalAmount > 0 ? Number(((total / totalAmount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      data: {
        expenses: paginatedExpenses,
        totalCount,
        totalAmount,
        totalPages: Math.ceil(totalCount / itemsPerPage) || 1,
        currentPage,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

const { exportCSV } = require('./reportController');

module.exports = {
  getAllExpenses,
  exportExpensesCSV: exportCSV,
};
