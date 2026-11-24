const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');
const Account = require('../models/Account');
const CashProfile = require('../models/CashProfile');
const { computeAccountBalance, computeCashBalance } = require('../utils/balanceHelper');

// POST /api/transfers - Create a new transfer
const createTransfer = async (req, res, next) => {
  try {
    const { fromType, fromAccount, toType, toAccount, amount, date, note } = req.body;

    // Check source balance
    if (fromType === 'account') {
      const srcAccount = await Account.findOne({ _id: fromAccount, user: req.user._id });
      if (!srcAccount) {
        return res.status(404).json({ success: false, message: 'Source account not found' });
      }
      const { currentBalance } = await computeAccountBalance(
        req.user._id,
        fromAccount,
        srcAccount.openingBalance
      );
      if (amount > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Transfer amount (₹${amount}) exceeds source account balance (₹${currentBalance.toFixed(2)})`,
        });
      }
    } else if (fromType === 'cash') {
      const cashProfile = await CashProfile.findOne({ user: req.user._id });
      const opening = cashProfile ? cashProfile.openingBalance : 0;
      const { currentBalance } = await computeCashBalance(req.user._id, opening);
      if (amount > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Transfer amount (₹${amount}) exceeds available cash balance (₹${currentBalance.toFixed(2)})`,
        });
      }
    }

    // Check destination existence
    if (toType === 'account') {
      const destAccount = await Account.findOne({ _id: toAccount, user: req.user._id });
      if (!destAccount) {
        return res.status(404).json({ success: false, message: 'Destination account not found' });
      }
    }

    const transfer = await Transfer.create({
      user: req.user._id,
      fromType,
      fromAccount: fromType === 'account' ? fromAccount : undefined,
      toType,
      toAccount: toType === 'account' ? toAccount : undefined,
      amount,
      date: date || new Date(),
      note: note || '',
    });

    const populated = await Transfer.findById(transfer._id)
      .populate('fromAccount', 'name type')
      .populate('toAccount', 'name type');

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: { transfer: populated },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transfers - List user's transfers
const getTransfers = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transfers, total] = await Promise.all([
      Transfer.find({ user: req.user._id })
        .populate('fromAccount', 'name type')
        .populate('toAccount', 'name type')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transfer.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transfers,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transfers/:id - Delete a transfer
const deleteTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid transfer ID' });
    }

    const transfer = await Transfer.findOneAndDelete({ _id: id, user: req.user._id });
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transfer deleted and balance reversed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  deleteTransfer,
};
