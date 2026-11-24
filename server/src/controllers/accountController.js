const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Transfer = require('../models/Transfer');
const { computeAccountBalance, computeAllAccountsWithBalances } = require('../utils/balanceHelper');
const { deleteReceipt } = require('./uploadController');

// GET /api/accounts - List accounts with live balances
const getAccounts = async (req, res, next) => {
  try {
    const { includeArchived } = req.query;
    const filter = {};
    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const accountsWithBalance = await computeAllAccountsWithBalances(req.user._id, filter);

    const activeAccounts = accountsWithBalance.filter((a) => !a.isArchived);
    const archivedAccounts = accountsWithBalance.filter((a) => a.isArchived);

    const totalBankBalance = activeAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    res.status(200).json({
      success: true,
      data: {
        accounts: accountsWithBalance,
        activeAccounts,
        archivedAccounts,
        totalBankBalance,
        count: accountsWithBalance.length,
        activeCount: activeAccounts.length,
        archivedCount: archivedAccounts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts - Create a new account
const createAccount = async (req, res, next) => {
  try {
    const { name, type, openingBalance } = req.body;

    const account = await Account.create({
      user: req.user._id,
      name,
      type: type || 'Savings',
      openingBalance: Number(openingBalance) || 0,
      isArchived: false,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        account: {
          _id: account._id,
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance,
          currentBalance: account.openingBalance,
          isArchived: false,
          createdAt: account.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:id - Get account details and monthly stats
const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const account = await Account.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const { currentBalance, totalIncome, totalExpense, transfersIn, transfersOut } =
      await computeAccountBalance(req.user._id, account._id, account.openingBalance);

    // Monthly stats if month and year provided
    let monthlyStats = null;
    if (month && year) {
      const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

      const monthlyAgg = await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            account: new mongoose.Types.ObjectId(account._id),
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      let mIncome = 0;
      let mExpense = 0;
      for (const item of monthlyAgg) {
        if (item._id === 'income') mIncome = item.total;
        if (item._id === 'expense') mExpense = item.total;
      }

      monthlyStats = {
        month: Number(month),
        year: Number(year),
        income: mIncome,
        expense: mExpense,
        net: mIncome - mExpense,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        account: {
          _id: account._id,
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance,
          isArchived: account.isArchived || false,
          currentBalance,
          totalIncome,
          totalExpense,
          transfersIn,
          transfersOut,
          createdAt: account.createdAt,
        },
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/accounts/:id - Update an account
const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, openingBalance } = req.body;

    const account = await Account.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (openingBalance !== undefined) account.openingBalance = Number(openingBalance);

    await account.save();

    const { currentBalance } = await computeAccountBalance(
      req.user._id,
      account._id,
      account.openingBalance
    );

    res.status(200).json({
      success: true,
      message: 'Account updated successfully!',
      data: {
        account: {
          _id: account._id,
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance,
          currentBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/accounts/:id/archive - Archive or unarchive account
const archiveAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const willArchive = !account.isArchived;

    // Block archiving if it leaves 0 active accounts
    if (willArchive) {
      const activeCount = await Account.countDocuments({
        user: req.user._id,
        isArchived: false,
      });
      if (activeCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot archive this account. You must keep at least one active bank account.',
        });
      }
    }

    account.isArchived = willArchive;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Account "${account.name}" ${willArchive ? 'archived' : 'restored'} successfully.`,
      data: { account },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/accounts/:id - Delete account
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteTransactions = req.query.deleteTransactions === 'true' || req.body?.deleteTransactions === true;

    const account = await Account.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    let deletedTransactionsCount = 0;
    if (deleteTransactions) {
      const deleteResult = await Transaction.deleteMany({
        user: req.user._id,
        account: account._id,
      });
      deletedTransactionsCount = deleteResult.deletedCount;
    }

    // Also delete any transfers referencing this account
    await Transfer.deleteMany({
      user: req.user._id,
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    });

    await Account.deleteOne({ _id: account._id });

    res.status(200).json({
      success: true,
      message: `Account "${account.name}" deleted successfully.${
        deleteTransactions ? ` Deleted ${deletedTransactionsCount} associated transaction(s).` : ''
      }`,
      data: {
        deletedAccountId: id,
        deletedTransactionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:id/transactions
const getAccountTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, year, type, category, tag, search, page = 1, limit = 50 } = req.query;

    const account = await Account.findOne({ _id: id, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const filter = {
      user: req.user._id,
      account: account._id,
    };

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (month && year) {
      const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    if (search) {
      filter.$or = [
        { note: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .populate('recurringRuleId', 'frequency')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Also fetch transfers for this account to display swap row types
    const transfers = await Transfer.find({
      user: req.user._id,
      $or: [
        { fromType: 'account', fromAccount: account._id },
        { toType: 'account', toAccount: account._id },
      ],
    })
      .populate('fromAccount', 'name')
      .populate('toAccount', 'name')
      .sort({ date: -1 })
      .lean();

    const formattedTransfers = transfers.map((tr) => {
      const isOutflow = tr.fromType === 'account' && tr.fromAccount?._id?.toString() === account._id.toString();
      return {
        _id: tr._id,
        isTransfer: true,
        type: 'transfer',
        transferDirection: isOutflow ? 'out' : 'in',
        amount: tr.amount,
        category: 'Transfer',
        date: tr.date,
        note: tr.note || (isOutflow ? `Transfer to ${tr.toType === 'cash' ? 'Cash' : tr.toAccount?.name || 'Account'}` : `Transfer from ${tr.fromType === 'cash' ? 'Cash' : tr.fromAccount?.name || 'Account'}`),
        fromType: tr.fromType,
        toType: tr.toType,
        fromAccountName: tr.fromAccount?.name || 'Cash',
        toAccountName: tr.toAccount?.name || 'Cash',
      };
    });

    const { currentBalance } = await computeAccountBalance(
      req.user._id,
      account._id,
      account.openingBalance
    );

    res.status(200).json({
      success: true,
      data: {
        transactions,
        transfers: formattedTransfers,
        totalCount,
        page: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        accountBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts/:id/transactions
const createAccountTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, note, tags, attachment, recurringRuleId } = req.body;

    const account = await Account.findOne({ _id: id, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      account: account._id,
      type,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      note: note || '',
      tags: Array.isArray(tags) ? tags : [],
      attachment: attachment || null,
      recurringRuleId: recurringRuleId || null,
    });

    const { currentBalance } = await computeAccountBalance(
      req.user._id,
      account._id,
      account.openingBalance
    );

    res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`,
      data: {
        transaction,
        accountBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/accounts/:id/transactions/:txId
const updateAccountTransaction = async (req, res, next) => {
  try {
    const { id, txId } = req.params;
    const { type, amount, category, date, note, tags, attachment } = req.body;

    const transaction = await Transaction.findOne({
      _id: txId,
      account: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (note !== undefined) transaction.note = note;
    if (tags !== undefined) transaction.tags = tags;
    if (attachment !== undefined) transaction.attachment = attachment;

    await transaction.save();

    const account = await Account.findById(id);
    const { currentBalance } = await computeAccountBalance(
      req.user._id,
      account._id,
      account.openingBalance
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully!',
      data: {
        transaction,
        accountBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/accounts/:id/transactions/:txId
const deleteAccountTransaction = async (req, res, next) => {
  try {
    const { id, txId } = req.params;

    const transaction = await Transaction.findOne({
      _id: txId,
      account: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    // Delete attachment from Cloudinary if exists
    if (transaction.attachment?.publicId) {
      try {
        await deleteReceipt({ params: { publicId: transaction.attachment.publicId } }, { status: () => ({ json: () => {} }) });
      } catch (e) {}
    }

    await Transaction.deleteOne({ _id: txId });

    const account = await Account.findById(id);
    const { currentBalance } = await computeAccountBalance(
      req.user._id,
      account._id,
      account.openingBalance
    );

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully!',
      data: {
        deletedTransactionId: txId,
        accountBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  archiveAccount,
  deleteAccount,
  getAccountTransactions,
  createAccountTransaction,
  updateAccountTransaction,
  deleteAccountTransaction,
};
