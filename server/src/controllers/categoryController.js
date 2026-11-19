const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// @desc    Get all accessible categories (default + user's custom)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = {
      $or: [{ isDefault: true }, { user: req.user._id }],
    };

    if (type && ['expense', 'income'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully.',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;

    // Check if category already exists for this user (or as default)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type,
      $or: [{ isDefault: true }, { user: req.user._id }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${type} category named "${name}" already exists.`,
      });
    }

    const category = await Category.create({
      user: req.user._id,
      name: name.trim(),
      icon: icon || 'Tag',
      color: color || '#10B981',
      type,
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Custom category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a custom category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'System default categories cannot be modified.',
      });
    }

    if (category.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category.',
      });
    }

    const { name, icon, color, type } = req.body;
    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (type) category.type = type;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a custom category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'System default categories cannot be deleted.',
      });
    }

    if (category.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category.',
      });
    }

    // Check if any transactions are currently linked to this category
    const transactionCount = await Transaction.countDocuments({
      user: req.user._id,
      category: category._id,
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${transactionCount} existing transaction(s) are linked to it. Please reassign or delete those transactions first.`,
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
      data: { id: category._id },
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
