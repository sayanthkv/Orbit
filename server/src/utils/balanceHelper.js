const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');
const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const CashProfile = require('../models/CashProfile');

/**
 * Compute balance for a single account including income, expense, and transfers
 */
const computeAccountBalance = async (userId, accountId, openingBalance = 0) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(accountId);

  // Income and Expense
  const txAgg = await Transaction.aggregate([
    { $match: { user: uId, account: aId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  let income = 0;
  let expense = 0;
  for (const item of txAgg) {
    if (item._id === 'income') income = item.total;
    if (item._id === 'expense') expense = item.total;
  }

  // Transfers In
  const inAgg = await Transfer.aggregate([
    { $match: { user: uId, toType: 'account', toAccount: aId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const transfersIn = inAgg.length > 0 ? inAgg[0].total : 0;

  // Transfers Out
  const outAgg = await Transfer.aggregate([
    { $match: { user: uId, fromType: 'account', fromAccount: aId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const transfersOut = outAgg.length > 0 ? outAgg[0].total : 0;

  const currentBalance = (openingBalance || 0) + income - expense + transfersIn - transfersOut;

  return {
    currentBalance,
    totalIncome: income,
    totalExpense: expense,
    transfersIn,
    transfersOut,
  };
};

/**
 * Compute cash balance including income, expense, and transfers
 */
const computeCashBalance = async (userId, openingBalance = 0) => {
  const uId = new mongoose.Types.ObjectId(userId);

  // Income and Expense
  const txAgg = await CashTransaction.aggregate([
    { $match: { user: uId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  let income = 0;
  let expense = 0;
  for (const item of txAgg) {
    if (item._id === 'income') income = item.total;
    if (item._id === 'expense') expense = item.total;
  }

  // Transfers In (to cash)
  const inAgg = await Transfer.aggregate([
    { $match: { user: uId, toType: 'cash' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const transfersIn = inAgg.length > 0 ? inAgg[0].total : 0;

  // Transfers Out (from cash)
  const outAgg = await Transfer.aggregate([
    { $match: { user: uId, fromType: 'cash' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const transfersOut = outAgg.length > 0 ? outAgg[0].total : 0;

  const currentBalance = (openingBalance || 0) + income - expense + transfersIn - transfersOut;

  return {
    currentBalance,
    totalIncome: income,
    totalExpense: expense,
    transfersIn,
    transfersOut,
  };
};

/**
 * Compute all accounts with balance
 */
const computeAllAccountsWithBalances = async (userId, filter = {}) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const accounts = await Account.find({ user: uId, ...filter }).sort({ createdAt: 1 });

  // Batch aggregate transactions
  const txTotals = await Transaction.aggregate([
    { $match: { user: uId } },
    {
      $group: {
        _id: { account: '$account', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const txMap = {};
  for (const item of txTotals) {
    const accId = item._id.account.toString();
    if (!txMap[accId]) txMap[accId] = { income: 0, expense: 0 };
    txMap[accId][item._id.type] = item.total;
  }

  // Batch aggregate transfers in
  const transfersInAgg = await Transfer.aggregate([
    { $match: { user: uId, toType: 'account' } },
    { $group: { _id: '$toAccount', total: { $sum: '$amount' } } },
  ]);
  const inMap = {};
  for (const item of transfersInAgg) {
    if (item._id) inMap[item._id.toString()] = item.total;
  }

  // Batch aggregate transfers out
  const transfersOutAgg = await Transfer.aggregate([
    { $match: { user: uId, fromType: 'account' } },
    { $group: { _id: '$fromAccount', total: { $sum: '$amount' } } },
  ]);
  const outMap = {};
  for (const item of transfersOutAgg) {
    if (item._id) outMap[item._id.toString()] = item.total;
  }

  const result = accounts.map((acc) => {
    const id = acc._id.toString();
    const stats = txMap[id] || { income: 0, expense: 0 };
    const transfersIn = inMap[id] || 0;
    const transfersOut = outMap[id] || 0;
    const currentBalance = (acc.openingBalance || 0) + stats.income - stats.expense + transfersIn - transfersOut;

    return {
      _id: acc._id,
      name: acc.name,
      type: acc.type,
      openingBalance: acc.openingBalance,
      isArchived: acc.isArchived || false,
      currentBalance,
      totalIncome: stats.income,
      totalExpense: stats.expense,
      transfersIn,
      transfersOut,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    };
  });

  return result;
};

module.exports = {
  computeAccountBalance,
  computeCashBalance,
  computeAllAccountsWithBalances,
};
