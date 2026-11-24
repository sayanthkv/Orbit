const Category = require('../models/Category');

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', color: '#10b981', icon: 'Briefcase' },
  { name: 'Freelance', color: '#06b6d4', icon: 'Laptop' },
  { name: 'Investment', color: '#8b5cf6', icon: 'TrendingUp' },
  { name: 'Gift', color: '#ec4899', icon: 'Gift' },
  { name: 'Refund', color: '#14b8a6', icon: 'RotateCcw' },
  { name: 'Other Income', color: '#64748b', icon: 'PlusCircle' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', color: '#f97316', icon: 'Utensils' },
  { name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Housing', color: '#3b82f6', icon: 'Home' },
  { name: 'Utilities', color: '#06b6d4', icon: 'Zap' },
  { name: 'Transportation', color: '#eab308', icon: 'Car' },
  { name: 'Entertainment', color: '#a855f7', icon: 'Film' },
  { name: 'Health & Fitness', color: '#ef4444', icon: 'HeartPulse' },
  { name: 'Education', color: '#6366f1', icon: 'GraduationCap' },
  { name: 'Bills', color: '#f43f5e', icon: 'FileText' },
  { name: 'Travel', color: '#14b8a6', icon: 'Plane' },
  { name: 'Other', color: '#71717a', icon: 'MoreHorizontal' },
];

const seedDefaultCategories = async (userId) => {
  const existing = await Category.find({ user: userId });
  if (existing.length > 0) return;

  const docs = [
    ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
      user: userId,
      name: cat.name,
      type: 'income',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
      isHidden: false,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
      user: userId,
      name: cat.name,
      type: 'expense',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
      isHidden: false,
    })),
  ];

  await Category.insertMany(docs);
};

module.exports = {
  seedDefaultCategories,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
};
