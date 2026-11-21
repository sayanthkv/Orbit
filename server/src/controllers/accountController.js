const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Helper to get start and end Date for current month
const getCurrentMonthRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

// Helper: Ensure user has at least one account. If not, auto-create a default one.
const ensureDefaultAccount = async (userId, userInitialBalance = 0) => {
  const count = await Account.countDocuments({ user: userId });
  if (count === 0) {
    const defaultAcc = await Account.create({
      user: userId,
      name: 'Primary Account',
      type: 'bank',
      initialBalance: Number(userInitialBalance) || 0,
      color: '#10B981',
      icon: 'Building',
      isDefault: true,
    });

    // Link any existing user transactions that don't have an account
    await Transaction.updateMany(
      { user: userId, account: { $exists: false } },
      { $set: { account: defaultAcc._id } }
    );

    return defaultAcc;
  }
  return null;
};

// @desc    Get all user accounts with computed balances & month spending
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Ensure default account exists
    await ensureDefaultAccount(userId, req.user.initialBalance || 0);

    const accounts = await Account.find({ user: userId }).sort({ isDefault: -1, createdAt: 1 });

    const { startDate, endDate } = getCurrentMonthRange();

    // Aggregate all-time income & expense by account
    const allTimeStats = await Transaction.aggregate([
      { $match: { user: userId, account: { $ne: null } } },
      {
        $group: {
          _id: { account: '$account', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate current month income & expense by account
    const monthStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          account: { $ne: null },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { account: '$account', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build stat lookups
    const allTimeMap = {};
    allTimeStats.forEach((stat) => {
      const accId = stat._id.account.toString();
      if (!allTimeMap[accId]) {
        allTimeMap[accId] = { income: 0, expense: 0, count: 0 };
      }
      if (stat._id.type === 'income') allTimeMap[accId].income += stat.total;
      if (stat._id.type === 'expense') allTimeMap[accId].expense += stat.total;
      allTimeMap[accId].count += stat.count;
    });

    const monthMap = {};
    monthStats.forEach((stat) => {
      const accId = stat._id.account.toString();
      if (!monthMap[accId]) {
        monthMap[accId] = { income: 0, expense: 0 };
      }
      if (stat._id.type === 'income') monthMap[accId].income += stat.total;
      if (stat._id.type === 'expense') monthMap[accId].expense += stat.total;
    });

    let totalCombinedBalance = 0;
    let totalCombinedInitialBalance = 0;
    let totalCombinedAllTimeIncome = 0;
    let totalCombinedAllTimeExpense = 0;
    let totalCombinedMonthIncome = 0;
    let totalCombinedMonthExpense = 0;

    const formattedAccounts = accounts.map((acc) => {
      const accId = acc._id.toString();
      const stats = allTimeMap[accId] || { income: 0, expense: 0, count: 0 };
      const mStats = monthMap[accId] || { income: 0, expense: 0 };

      const initBal = Number(acc.initialBalance) || 0;
      const currentBalance = initBal + stats.income - stats.expense;

      totalCombinedBalance += currentBalance;
      totalCombinedInitialBalance += initBal;
      totalCombinedAllTimeIncome += stats.income;
      totalCombinedAllTimeExpense += stats.expense;
      totalCombinedMonthIncome += mStats.income;
      totalCombinedMonthExpense += mStats.expense;

      return {
        ...acc.toJSON(),
        currentBalance,
        allTimeIncome: stats.income,
        allTimeExpense: stats.expense,
        monthIncome: mStats.income,
        monthExpense: mStats.expense,
        monthNet: mStats.income - mStats.expense,
        transactionCount: stats.count,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Accounts retrieved successfully.',
      data: {
        accounts: formattedAccounts,
        combined: {
          totalBalance: totalCombinedBalance,
          totalInitialBalance: totalCombinedInitialBalance,
          allTimeIncome: totalCombinedAllTimeIncome,
          allTimeExpense: totalCombinedAllTimeExpense,
          monthIncome: totalCombinedMonthIncome,
          monthExpense: totalCombinedMonthExpense,
          monthNet: totalCombinedMonthIncome - totalCombinedMonthExpense,
          totalAccounts: formattedAccounts.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account by ID with its balance and details
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const { startDate, endDate } = getCurrentMonthRange();

    const [allTimeStats, monthStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: req.user._id, account: account._id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            account: account._id,
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

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    let count = 0;
    allTimeStats.forEach((s) => {
      if (s._id === 'income') allTimeIncome = s.total;
      if (s._id === 'expense') allTimeExpense = s.total;
      count += s.count;
    });

    let monthIncome = 0;
    let monthExpense = 0;
    monthStats.forEach((s) => {
      if (s._id === 'income') monthIncome = s.total;
      if (s._id === 'expense') monthExpense = s.total;
    });

    const initBal = Number(account.initialBalance) || 0;
    const currentBalance = initBal + allTimeIncome - allTimeExpense;

    res.status(200).json({
      success: true,
      data: {
        ...account.toJSON(),
        currentBalance,
        allTimeIncome,
        allTimeExpense,
        monthIncome,
        monthExpense,
        monthNet: monthIncome - monthExpense,
        transactionCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new account
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  try {
    const { name, bankName = '', accountNumber = '', type, initialBalance = 0, color, icon, isDefault } = req.body;

    const existingCount = await Account.countDocuments({ user: req.user._id });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await Account.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const account = await Account.create({
      user: req.user._id,
      name,
      bankName: bankName ? bankName.trim() : '',
      accountNumber: accountNumber ? accountNumber.trim() : '',
      type: type || 'bank',
      initialBalance: Number(initialBalance) || 0,
      color: color || '#10B981',
      icon: icon || 'Building',
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        ...account.toJSON(),
        currentBalance: Number(initialBalance) || 0,
        allTimeIncome: 0,
        allTimeExpense: 0,
        monthIncome: 0,
        monthExpense: 0,
        monthNet: 0,
        transactionCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const { name, bankName, accountNumber, type, initialBalance, color, icon, isDefault } = req.body;

    if (isDefault) {
      await Account.updateMany(
        { user: req.user._id, _id: { $ne: account._id } },
        { $set: { isDefault: false } }
      );
      account.isDefault = true;
    } else if (isDefault === false && account.isDefault) {
      // If user is un-setting default, ensure another account becomes default
      const another = await Account.findOne({ user: req.user._id, _id: { $ne: account._id } });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
      account.isDefault = false;
    }

    if (name) account.name = name;
    if (bankName !== undefined) account.bankName = bankName.trim();
    if (accountNumber !== undefined) account.accountNumber = accountNumber.trim();
    if (type) account.type = type;
    if (initialBalance !== undefined) account.initialBalance = Number(initialBalance);
    if (color) account.color = color;
    if (icon) account.icon = icon;

    await account.save();

    // Recalculate balance
    const allTimeStats = await Transaction.aggregate([
      { $match: { user: req.user._id, account: account._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0;
    let expense = 0;
    let count = 0;
    allTimeStats.forEach((s) => {
      if (s._id === 'income') income = s.total;
      if (s._id === 'expense') expense = s.total;
      count += s.count;
    });

    const currentBalance = Number(account.initialBalance) + income - expense;

    res.status(200).json({
      success: true,
      message: 'Account updated successfully.',
      data: {
        ...account.toJSON(),
        currentBalance,
        allTimeIncome: income,
        allTimeExpense: expense,
        transactionCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const totalAccounts = await Account.countDocuments({ user: req.user._id });

    if (totalAccounts <= 1) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your only account. At least one account is required.',
      });
    }

    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Check if account has transactions
    const txCount = await Transaction.countDocuments({ user: req.user._id, account: account._id });

    if (txCount > 0) {
      return res.status(400).json({
        success: false,
        message: `This account has ${txCount} transaction(s) linked to it. Please reassign or delete those transactions first before removing this account.`,
      });
    }

    await Account.deleteOne({ _id: account._id });

    // If deleted account was default, set another account as default
    if (account.isDefault) {
      const remaining = await Account.findOne({ user: req.user._id });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  ensureDefaultAccount,
};
