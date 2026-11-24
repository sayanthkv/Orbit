const mongoose = require('mongoose');
const CashProfile = require('../models/CashProfile');
const CashTransaction = require('../models/CashTransaction');
const Transfer = require('../models/Transfer');
const { computeCashBalance } = require('../utils/balanceHelper');
const { deleteReceipt } = require('./uploadController');

// GET /api/cash - Get profile, current balance, and monthly summary
const getCashProfile = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    let profile = await CashProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CashProfile.create({
        user: req.user._id,
        openingBalance: 0,
      });
    }

    const { currentBalance, totalIncome, totalExpense, transfersIn, transfersOut } =
      await computeCashBalance(req.user._id, profile.openingBalance);

    // Selected or current month stats
    const now = new Date();
    const selMonth = month ? Number(month) : now.getUTCMonth() + 1;
    const selYear = year ? Number(year) : now.getUTCFullYear();

    const start = new Date(Date.UTC(selYear, selMonth - 1, 1));
    const end = new Date(Date.UTC(selYear, selMonth, 0, 23, 59, 59, 999));

    const monthlyAgg = await CashTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
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

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    for (const item of monthlyAgg) {
      if (item._id === 'income') monthlyIncome = item.total;
      if (item._id === 'expense') monthlyExpense = item.total;
    }

    res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: profile._id,
          openingBalance: profile.openingBalance,
          currentBalance,
          totalIncome,
          totalExpense,
          transfersIn,
          transfersOut,
        },
        monthlySummary: {
          month: selMonth,
          year: selYear,
          income: monthlyIncome,
          expense: monthlyExpense,
          net: monthlyIncome - monthlyExpense,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cash - Update cash opening balance
const updateCashProfile = async (req, res, next) => {
  try {
    const { openingBalance } = req.body;

    let profile = await CashProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new CashProfile({ user: req.user._id });
    }

    profile.openingBalance = Number(openingBalance) || 0;
    await profile.save();

    const { currentBalance } = await computeCashBalance(req.user._id, profile.openingBalance);

    res.status(200).json({
      success: true,
      message: 'Cash opening balance updated successfully!',
      data: {
        profile: {
          _id: profile._id,
          openingBalance: profile.openingBalance,
          currentBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cash/transactions - List cash transactions with filters
const getCashTransactions = async (req, res, next) => {
  try {
    const { month, year, type, category, tag, search, page = 1, limit = 50 } = req.query;

    const filter = { user: req.user._id };

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
      CashTransaction.find(filter)
        .populate('recurringRuleId', 'frequency')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CashTransaction.countDocuments(filter),
    ]);

    // Fetch cash transfers to show swap rows
    const transfers = await Transfer.find({
      user: req.user._id,
      $or: [{ fromType: 'cash' }, { toType: 'cash' }],
    })
      .populate('fromAccount', 'name')
      .populate('toAccount', 'name')
      .sort({ date: -1 })
      .lean();

    const formattedTransfers = transfers.map((tr) => {
      const isOutflow = tr.fromType === 'cash';
      return {
        _id: tr._id,
        isTransfer: true,
        type: 'transfer',
        transferDirection: isOutflow ? 'out' : 'in',
        amount: tr.amount,
        category: 'Transfer',
        date: tr.date,
        note: tr.note || (isOutflow ? `Deposit to ${tr.toAccount?.name || 'Bank'}` : `ATM Withdrawal from ${tr.fromAccount?.name || 'Bank'}`),
        fromType: tr.fromType,
        toType: tr.toType,
        fromAccountName: tr.fromAccount?.name || 'Cash',
        toAccountName: tr.toAccount?.name || 'Cash',
      };
    });

    let profile = await CashProfile.findOne({ user: req.user._id });
    const { currentBalance } = await computeCashBalance(
      req.user._id,
      profile?.openingBalance || 0
    );

    res.status(200).json({
      success: true,
      data: {
        transactions,
        transfers: formattedTransfers,
        totalCount,
        page: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        cashBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cash/transactions - Record a cash transaction
const createCashTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, date, note, tags, attachment, recurringRuleId } = req.body;

    const transaction = await CashTransaction.create({
      user: req.user._id,
      type,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      note: note || '',
      tags: Array.isArray(tags) ? tags : [],
      attachment: attachment || null,
      recurringRuleId: recurringRuleId || null,
    });

    let profile = await CashProfile.findOne({ user: req.user._id });
    const { currentBalance } = await computeCashBalance(
      req.user._id,
      profile?.openingBalance || 0
    );

    res.status(201).json({
      success: true,
      message: 'Cash transaction recorded successfully!',
      data: {
        transaction,
        cashBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cash/transactions/:id - Update cash transaction
const updateCashTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, note, tags, attachment } = req.body;

    const transaction = await CashTransaction.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Cash transaction not found.',
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

    let profile = await CashProfile.findOne({ user: req.user._id });
    const { currentBalance } = await computeCashBalance(
      req.user._id,
      profile?.openingBalance || 0
    );

    res.status(200).json({
      success: true,
      message: 'Cash transaction updated successfully!',
      data: {
        transaction,
        cashBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cash/transactions/:id - Delete cash transaction
const deleteCashTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await CashTransaction.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Cash transaction not found.',
      });
    }

    // Delete attachment from Cloudinary if exists
    if (transaction.attachment?.publicId) {
      try {
        await deleteReceipt({ params: { publicId: transaction.attachment.publicId } }, { status: () => ({ json: () => {} }) });
      } catch (e) {}
    }

    await CashTransaction.deleteOne({ _id: id });

    let profile = await CashProfile.findOne({ user: req.user._id });
    const { currentBalance } = await computeCashBalance(
      req.user._id,
      profile?.openingBalance || 0
    );

    res.status(200).json({
      success: true,
      message: 'Cash transaction deleted successfully!',
      data: {
        deletedTransactionId: id,
        cashBalance: currentBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCashProfile,
  updateCashProfile,
  getCashTransactions,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction,
};
