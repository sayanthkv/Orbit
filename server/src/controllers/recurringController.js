const Recurring = require('../models/Recurring');
const Category = require('../models/Category');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { calculateNextRunDate, processDueRecurringTransactions } = require('../services/cronService');

// Helper to compute monthly equivalent
const computeMonthlyEquivalent = (amount, frequency) => {
  if (frequency === 'daily') return amount * 30;
  if (frequency === 'weekly') return amount * (52 / 12);
  if (frequency === 'monthly') return amount;
  if (frequency === 'yearly') return amount / 12;
  return amount;
};

// @desc    Get all recurring transaction rules for user with summary stats
// @route   GET /api/recurring
// @access  Private
const getRecurringRules = async (req, res, next) => {
  try {
    // Run catch-up for any due items for this user
    await processDueRecurringTransactions(req.user._id).catch(() => {});

    const rules = await Recurring.find({ user: req.user._id })
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault')
      .sort({ isActive: -1, nextRunDate: 1 });

    let monthlyCommittedSpend = 0;
    let activeCount = 0;
    let pausedCount = 0;
    let nextUpcoming = null;

    rules.forEach((r) => {
      if (r.isActive) {
        activeCount++;
        if (r.type === 'expense') {
          monthlyCommittedSpend += computeMonthlyEquivalent(r.amount, r.frequency);
        }
        if (!nextUpcoming || new Date(r.nextRunDate) < new Date(nextUpcoming.nextRunDate)) {
          nextUpcoming = r;
        }
      } else {
        pausedCount++;
      }
    });

    res.status(200).json({
      success: true,
      message: 'Recurring rules retrieved.',
      data: {
        rules,
        summary: {
          monthlyCommittedSpend: Math.round(monthlyCommittedSpend * 100) / 100,
          activeCount,
          pausedCount,
          totalCount: rules.length,
          nextUpcoming,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new recurring transaction rule
// @route   POST /api/recurring
// @access  Private
const createRecurringRule = async (req, res, next) => {
  try {
    const {
      type = 'expense',
      amount,
      category: categoryId,
      account: accountId,
      toAccount: toAccountId,
      frequency,
      startDate,
      endDate,
      note,
      paymentMethod,
    } = req.body;

    let categoryDoc = null;
    if (type !== 'transfer') {
      categoryDoc = await Category.findOne({
        _id: categoryId,
        $or: [{ isDefault: true }, { user: req.user._id }],
      });

      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified.',
        });
      }
    } else {
      // Find or create Transfer category
      categoryDoc = await Category.findOne({
        name: 'Transfer',
        $or: [{ isDefault: true }, { user: req.user._id }],
      });
      if (!categoryDoc) {
        categoryDoc = await Category.create({
          user: req.user._id,
          name: 'Transfer',
          icon: 'ArrowRightLeft',
          color: '#8B5CF6',
          type: 'expense',
          isDefault: false,
        });
      }
    }

    // Resolve Account
    let accountDoc = null;
    if (accountId) {
      accountDoc = await Account.findOne({ _id: accountId, user: req.user._id });
    }
    if (!accountDoc) {
      accountDoc = await Account.findOne({ user: req.user._id, isDefault: true }) ||
                   await Account.findOne({ user: req.user._id });
    }

    // Destination account for transfers
    let toAccountDoc = null;
    if (type === 'transfer' && toAccountId) {
      toAccountDoc = await Account.findOne({ _id: toAccountId, user: req.user._id });
      if (!toAccountDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid destination account specified for transfer.',
        });
      }
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextRunDate = new Date(start);

    const rule = await Recurring.create({
      user: req.user._id,
      type,
      amount: Number(amount),
      category: categoryDoc?._id,
      account: accountDoc?._id,
      toAccount: toAccountDoc?._id,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextRunDate,
      note: note ? note.trim() : '',
      paymentMethod: paymentMethod || 'bank',
      isActive: true,
    });

    const populated = await Recurring.findById(rule._id)
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault');

    res.status(201).json({
      success: true,
      message: `Recurring ${frequency} schedule created successfully.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a recurring rule (or toggle active/paused status)
// @route   PUT /api/recurring/:id
// @access  Private
const updateRecurringRule = async (req, res, next) => {
  try {
    const rule = await Recurring.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Recurring rule not found.',
      });
    }

    const {
      type,
      amount,
      category: categoryId,
      account: accountId,
      toAccount: toAccountId,
      frequency,
      startDate,
      endDate,
      note,
      paymentMethod,
      isActive,
    } = req.body;

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        $or: [{ isDefault: true }, { user: req.user._id }],
      });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid category specified.' });
      }
      rule.category = category._id;
    }

    if (accountId) {
      const accountDoc = await Account.findOne({ _id: accountId, user: req.user._id });
      if (accountDoc) rule.account = accountDoc._id;
    }

    if (toAccountId !== undefined) {
      if (toAccountId) {
        const toAccountDoc = await Account.findOne({ _id: toAccountId, user: req.user._id });
        if (toAccountDoc) rule.toAccount = toAccountDoc._id;
      } else {
        rule.toAccount = undefined;
      }
    }

    if (type) rule.type = type;
    if (amount !== undefined) rule.amount = Number(amount);
    if (frequency) rule.frequency = frequency;
    if (startDate) rule.startDate = new Date(startDate);
    if (endDate !== undefined) rule.endDate = endDate ? new Date(endDate) : null;
    if (note !== undefined) rule.note = note.trim();
    if (paymentMethod) rule.paymentMethod = paymentMethod;
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    await rule.save();

    const populated = await Recurring.findById(rule._id)
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault');

    res.status(200).json({
      success: true,
      message: 'Recurring rule updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a recurring rule
// @route   DELETE /api/recurring/:id
// @access  Private
const deleteRecurringRule = async (req, res, next) => {
  try {
    const rule = await Recurring.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Recurring rule not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring schedule deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger catch-up processing for current user
// @route   POST /api/recurring/process
// @access  Private
const triggerProcess = async (req, res, next) => {
  try {
    const result = await processDueRecurringTransactions(req.user._id);
    res.status(200).json({
      success: true,
      message: `Processed ${result.processedCount} due recurring transaction(s).`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually execute a recurring rule once right now
// @route   POST /api/recurring/:id/run
// @access  Private
const runRuleNow = async (req, res, next) => {
  try {
    const rule = await Recurring.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Recurring rule not found.',
      });
    }

    const now = new Date();
    const newTx = await Transaction.create({
      user: req.user._id,
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      account: rule.account,
      toAccount: rule.toAccount,
      date: now,
      note: rule.note ? `[Recurring] ${rule.note}` : `[Recurring] ${rule.frequency}`,
      paymentMethod: rule.paymentMethod,
      recurringRule: rule._id,
    });

    // Advance nextRunDate
    rule.lastProcessed = now;
    rule.nextRunDate = calculateNextRunDate(rule.nextRunDate, rule.frequency);
    if (rule.endDate && rule.nextRunDate > rule.endDate) {
      rule.isActive = false;
    }
    await rule.save();

    const populated = await Transaction.findById(newTx._id)
      .populate('category', 'name icon color type isDefault')
      .populate('account', 'name bankName type color icon isDefault')
      .populate('toAccount', 'name bankName type color icon isDefault');

    res.status(200).json({
      success: true,
      message: `Triggered recurring entry for "${rule.note || rule.frequency}"!`,
      data: { transaction: populated, nextRunDate: rule.nextRunDate },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  triggerProcess,
  runRuleNow,
};
