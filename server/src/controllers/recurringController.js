const Recurring = require('../models/Recurring');
const Category = require('../models/Category');
const { calculateNextRunDate, processDueRecurringTransactions } = require('../services/cronService');

// @desc    Get all recurring transaction rules for user
// @route   GET /api/recurring
// @access  Private
const getRecurringRules = async (req, res, next) => {
  try {
    const rules = await Recurring.find({ user: req.user._id })
      .populate('category', 'name icon color type isDefault')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Recurring rules retrieved.',
      data: rules,
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
    const { type, amount, category: categoryId, frequency, startDate, note, paymentMethod } = req.body;

    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ isDefault: true }, { user: req.user._id }],
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category specified.',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    // First run date is start date
    const nextRunDate = new Date(start);

    const rule = await Recurring.create({
      user: req.user._id,
      type,
      amount,
      category: category._id,
      frequency,
      startDate: start,
      nextRunDate,
      note: note ? note.trim() : '',
      paymentMethod: paymentMethod || 'UPI',
      isActive: true,
    });

    const populated = await Recurring.findById(rule._id).populate(
      'category',
      'name icon color type isDefault'
    );

    res.status(201).json({
      success: true,
      message: `Recurring ${frequency} schedule created for ${category.name}.`,
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

    const { type, amount, category: categoryId, frequency, note, paymentMethod, isActive } = req.body;

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

    if (type) rule.type = type;
    if (amount !== undefined) rule.amount = amount;
    if (frequency) rule.frequency = frequency;
    if (note !== undefined) rule.note = note.trim();
    if (paymentMethod) rule.paymentMethod = paymentMethod;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    const populated = await Recurring.findById(rule._id).populate(
      'category',
      'name icon color type isDefault'
    );

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
      message: 'Recurring schedule removed.',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually trigger process of due recurring transactions (for instant testing)
// @route   POST /api/recurring/process
// @access  Private
const triggerProcess = async (req, res, next) => {
  try {
    const result = await processDueRecurringTransactions();
    res.status(200).json({
      success: true,
      message: `Processed ${result.processedCount} due recurring transaction(s).`,
      data: result,
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
};
