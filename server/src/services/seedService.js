const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'Utensils', color: '#F97316', type: 'expense', isDefault: true },
  { name: 'Travel', icon: 'Plane', color: '#06B6D4', type: 'expense', isDefault: true },
  { name: 'Rent', icon: 'Home', color: '#8B5CF6', type: 'expense', isDefault: true },
  { name: 'Bills', icon: 'Receipt', color: '#EF4444', type: 'expense', isDefault: true },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', isDefault: true },
  { name: 'Health', icon: 'HeartPulse', color: '#10B981', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: 'Tv', color: '#6366F1', type: 'expense', isDefault: true },
  { name: 'Salary', icon: 'Briefcase', color: '#059669', type: 'income', isDefault: true },
  { name: 'Freelance', icon: 'Laptop', color: '#0284C7', type: 'income', isDefault: true },
  { name: 'Investment', icon: 'TrendingUp', color: '#14B8A6', type: 'income', isDefault: true },
  { name: 'Other Expense', icon: 'MoreHorizontal', color: '#64748B', type: 'expense', isDefault: true },
  { name: 'Other Income', icon: 'Coins', color: '#10B981', type: 'income', isDefault: true },
];

/**
 * Ensures system default categories are present in the database.
 */
const seedDefaultCategories = async () => {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: cat.name, type: cat.type, isDefault: true, user: null },
        { $setOnInsert: cat },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Default categories verified & seeded');
  } catch (error) {
    console.error('⚠️ Error seeding default categories:', error.message);
  }
};

module.exports = {
  DEFAULT_CATEGORIES,
  seedDefaultCategories,
};
