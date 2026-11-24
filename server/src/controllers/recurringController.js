const mongoose = require('mongoose');
const RecurringRule = require('../models/RecurringRule');
const { getNextDate, processRecurringRules } = require('../services/recurringService');

// GET /api/recurring - List recurring rules for current user
const getRecurringRules = async (req, res, next) => {
  try {
    // Process catch-up runs first so user always sees up-to-date state
    await processRecurringRules(req.user._id);

    const rules = await RecurringRule.find({ user: req.user._id })
      .populate('targetAccountId', 'name type')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { rules },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recurring - Create recurring rule
const createRecurringRule = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category,
      target,
      targetAccountId,
      frequency,
      startDate,
      endDate,
      note,
      active,
    } = req.body;

    const start = new Date(startDate);
    const rule = await RecurringRule.create({
      user: req.user._id,
      type,
      amount,
      category: category.trim(),
      target,
      targetAccountId: target === 'account' ? targetAccountId : undefined,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : undefined,
      note: note || '',
      active: active !== undefined ? active : true,
      nextRunDate: start,
    });

    // Run catch-up immediately if start date is in the past or today
    await processRecurringRules(req.user._id);

    const populated = await RecurringRule.findById(rule._id).populate('targetAccountId', 'name type');

    res.status(201).json({
      success: true,
      message: 'Recurring rule created successfully',
      data: { rule: populated },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/recurring/:id - Update recurring rule
const updateRecurringRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid rule ID' });
    }

    const {
      type,
      amount,
      category,
      target,
      targetAccountId,
      frequency,
      startDate,
      endDate,
      note,
      active,
    } = req.body;

    const rule = await RecurringRule.findOne({ _id: id, user: req.user._id });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Recurring rule not found' });
    }

    if (type) rule.type = type;
    if (amount) rule.amount = amount;
    if (category) rule.category = category.trim();
    if (target) rule.target = target;
    if (target === 'account') rule.targetAccountId = targetAccountId;
    else if (target === 'cash') rule.targetAccountId = undefined;
    if (frequency) rule.frequency = frequency;
    if (startDate) rule.startDate = new Date(startDate);
    if (endDate !== undefined) rule.endDate = endDate ? new Date(endDate) : undefined;
    if (note !== undefined) rule.note = note;
    if (active !== undefined) rule.active = active;

    await rule.save();
    const populated = await RecurringRule.findById(rule._id).populate('targetAccountId', 'name type');

    res.status(200).json({
      success: true,
      message: 'Recurring rule updated successfully',
      data: { rule: populated },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/recurring/:id/toggle - Toggle active status
const toggleRecurringRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid rule ID' });
    }

    const rule = await RecurringRule.findOne({ _id: id, user: req.user._id });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Recurring rule not found' });
    }

    rule.active = !rule.active;
    await rule.save();

    res.status(200).json({
      success: true,
      message: `Rule ${rule.active ? 'resumed' : 'paused'} successfully`,
      data: { rule },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/recurring/:id - Delete recurring rule
const deleteRecurringRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid rule ID' });
    }

    const rule = await RecurringRule.findOneAndDelete({ _id: id, user: req.user._id });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Recurring rule not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  toggleRecurringRule,
  deleteRecurringRule,
};
