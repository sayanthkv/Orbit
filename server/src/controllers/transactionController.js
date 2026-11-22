const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Account = require('../models/Account');
const { ensureDefaultAccount } = require('./accountController');

// @desc    Get paginated transactions with multi-criteria filtering and search
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      categoryId,
      accountId,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };

    if (type && ['expense', 'income', 'transfer'].includes(type)) {
      query.type = type;
    }

    if (categoryId) {
      query.category = categoryId;
    }

    if (accountId) {
      query.$or = [{ account: accountId }, { toAccount: accountId }];
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of the day if date only string is provided
        const end = new Date(endDate);
        if (endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        query.date.$lte = end;
      }
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined) query.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined) query.amount.$lte = Number(maxAmount);
    }

    // Keyword search on note
    if (search && search.trim()) {
      query.note = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy !== '_id') {
      sort._id = -1; // deterministic secondary sort
    }

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(query)
        .populate('category', 'name icon color type isDefault')
        .populate('account', 'name bankName type color icon isDefault')
        .populate('toAccount', 'name bankName type color icon isDefault')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let filteredExpense = 0;
    let filteredIncome = 0;
    summary.forEach((item) => {
      if (item._id === 'expense') filteredExpense = item.totalAmount;
      if (item._id === 'income') filteredIncome = item.totalAmount;
    });

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully.',
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
        summary: {
          totalIncome: filteredIncome,
          totalExpense: filteredExpense,
          netBalance: filteredIncome - filteredExpense,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction details retrieved.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category: categoryId,
      account: accountId,
      toAccount: toAccountId,
      date,
      note,
      paymentMethod,
    } = req.body;

    // Handle Transfer Type
    if (type === 'transfer') {
      if (!accountId || !toAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Both source (from) and destination (to) accounts are required for transfers.',
        });
      }
      if (accountId.toString() === toAccountId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Source and destination accounts must be different.',
        });
      }

      const [fromAccountDoc, toAccountDoc] = await Promise.all([
        Account.findOne({ _id: accountId, user: req.user._id }),
        Account.findOne({ _id: toAccountId, user: req.user._id }),
      ]);

      if (!fromAccountDoc || !toAccountDoc) {
        return res.status(400).json({
          success: false,
          message: 'One or both specified accounts are invalid or inaccessible.',
        });
      }

      // Find or create Transfer category
      let transferCategory = await Category.findOne({
        name: 'Transfer',
        $or: [{ isDefault: true }, { user: req.user._id }],
      });

      if (!transferCategory) {
        transferCategory = await Category.create({
          user: req.user._id,
          name: 'Transfer',
          icon: 'ArrowRightLeft',
          color: '#8B5CF6',
          type: 'expense',
          isDefault: false,
        });
      }

      let createdTx;
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const [tx] = await Transaction.create(
          [
            {
              user: req.user._id,
              account: fromAccountDoc._id,
              toAccount: toAccountDoc._id,
              type: 'transfer',
              amount: Number(amount),
              category: transferCategory._id,
              date: date ? new Date(date) : new Date(),
              note: note ? note.trim() : `Transfer to ${toAccountDoc.bankName || toAccountDoc.name}`,
              paymentMethod: paymentMethod || 'bank',
            },
          ],
          { session }
        );
        await session.commitTransaction();
        createdTx = tx;
      } catch (sessErr) {
        await session.abortTransaction();
        // Standalone fallback if MongoDB transaction replica sets are unavailable
        createdTx = await Transaction.create({
          user: req.user._id,
          account: fromAccountDoc._id,
          toAccount: toAccountDoc._id,
          type: 'transfer',
          amount: Number(amount),
          category: transferCategory._id,
          date: date ? new Date(date) : new Date(),
          note: note ? note.trim() : `Transfer to ${toAccountDoc.bankName || toAccountDoc.name}`,
          paymentMethod: paymentMethod || 'bank',
        });
      } finally {
        session.endSession();
      }

      const populated = await Transaction.findById(createdTx._id)
        .populate('category', 'name icon color type isDefault')
        .populate('account', 'name bankName type color icon isDefault')
        .populate('toAccount', 'name bankName type color icon isDefault');

      return res.status(201).json({
        success: true,
        message: 'Transfer completed successfully!',
        data: populated,
      });
    }

    // Standard Expense / Income Flow
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ isDefault: true }, { user: req.user._id }],
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inaccessible category specified.',
      });
    }

    // Resolve Account
    let accountDoc;
    if (accountId) {
      accountDoc = await Account.findOne({ _id: accountId, user: req.user._id });
      if (!accountDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inaccessible account specified.',
        });
      }
    } else {
      accountDoc = await Account.findOne({ user: req.user._id, isDefault: true });
      if (!accountDoc) {
        accountDoc = await Account.findOne({ user: req.user._id });
      }
      if (!accountDoc) {
        accountDoc = await ensureDefaultAccount(req.user._id, req.user.initialBalance || 0);
      }
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      account: accountDoc ? accountDoc._id : undefined,
      type,
      amount: Number(amount),
      category: category._id,
      date: date ? new Date(date) : new Date(),
      note: note ? note.trim() : '',
      paymentMethod: paymentMethod || 'UPI',
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault');

    res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    const { type, amount, category: categoryId, account: accountId, toAccount: toAccountId, date, note, paymentMethod } = req.body;

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        $or: [{ isDefault: true }, { user: req.user._id }],
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inaccessible category specified.',
        });
      }
      transaction.category = category._id;
    }

    if (accountId) {
      const accountDoc = await Account.findOne({
        _id: accountId,
        user: req.user._id,
      });

      if (!accountDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inaccessible account specified.',
        });
      }
      transaction.account = accountDoc._id;
    }

    if (toAccountId !== undefined) {
      if (toAccountId) {
        const toAccountDoc = await Account.findOne({
          _id: toAccountId,
          user: req.user._id,
        });

        if (!toAccountDoc) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inaccessible destination account specified.',
          });
        }
        transaction.toAccount = toAccountDoc._id;
      } else {
        transaction.toAccount = undefined;
      }
    }

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (date) transaction.date = new Date(date);
    if (note !== undefined) transaction.note = note.trim();
    if (paymentMethod) transaction.paymentMethod = paymentMethod;

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault');

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already deleted.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
