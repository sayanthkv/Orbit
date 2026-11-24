const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');
const Budget = require('../models/Budget');
const { seedDefaultCategories } = require('../utils/categorySeeder');

// GET /api/categories - List user categories (ensure defaults are seeded)
const getCategories = async (req, res, next) => {
  try {
    // Seed defaults if empty
    await seedDefaultCategories(req.user._id);

    const { type, includeHidden } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (includeHidden !== 'true') query.isHidden = false;

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories - Create custom category
const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${type} category with the name "${name.trim()}" already exists`,
      });
    }

    const category = await Category.create({
      user: req.user._id,
      name: name.trim(),
      type,
      color: color || '#10b981',
      icon: icon || 'Tag',
      isDefault: false,
      isHidden: false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id - Update custom category
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, icon, isHidden } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findOne({ _id: id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = category.name;

    if (name && name.trim() !== oldName) {
      // If default category, user can rename custom ones or hide defaults, but changing name of default should be guarded or permitted
      const newName = name.trim();
      category.name = newName;

      // Update name in all user's transactions & budgets
      await Promise.all([
        Transaction.updateMany({ user: req.user._id, category: oldName }, { category: newName }),
        CashTransaction.updateMany({ user: req.user._id, category: oldName }, { category: newName }),
        Budget.updateMany({ user: req.user._id, category: oldName }, { category: newName }),
      ]);
    }

    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (isHidden !== undefined) category.isHidden = isHidden;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id - Delete category with mandatory reassignment if in use
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body; // Replacement category name

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findOne({ _id: id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default system categories cannot be deleted. You can hide them instead.',
      });
    }

    // Check usage count in transactions & budgets
    const [txCount, cashTxCount, budgetCount] = await Promise.all([
      Transaction.countDocuments({ user: req.user._id, category: category.name }),
      CashTransaction.countDocuments({ user: req.user._id, category: category.name }),
      Budget.countDocuments({ user: req.user._id, category: category.name }),
    ]);

    const totalUsage = txCount + cashTxCount + budgetCount;

    if (totalUsage > 0) {
      if (!reassignTo || !reassignTo.trim()) {
        return res.status(400).json({
          success: false,
          requiresReassignment: true,
          message: `Category is used in ${totalUsage} records. Please select a replacement category to reassign them before deleting.`,
        });
      }

      const replacementTarget = reassignTo.trim();

      // Verify replacement exists
      const targetCat = await Category.findOne({
        user: req.user._id,
        name: replacementTarget,
        type: category.type,
      });

      if (!targetCat) {
        return res.status(400).json({
          success: false,
          message: `Replacement category "${replacementTarget}" not found`,
        });
      }

      // Reassign all records
      await Promise.all([
        Transaction.updateMany({ user: req.user._id, category: category.name }, { category: replacementTarget }),
        CashTransaction.updateMany({ user: req.user._id, category: category.name }, { category: replacementTarget }),
        Budget.updateMany({ user: req.user._id, category: category.name }, { category: replacementTarget }),
      ]);
    }

    await Category.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Category deleted and records reassigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
