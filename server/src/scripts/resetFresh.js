const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Recurring = require('../models/Recurring');
const Goal = require('../models/Goal');
const { seedDefaultCategories } = require('../services/seedService');
const dotenv = require('dotenv');

dotenv.config();

const resetToFresh = async () => {
  console.log('🧹 Purging all seeded demo data from Orbit database...');

  try {
    await connectDB();

    // 1. Remove all transactions
    const txRes = await Transaction.deleteMany({});
    console.log(`Deleted ${txRes.deletedCount} transactions.`);

    // 2. Remove all budgets
    const bRes = await Budget.deleteMany({});
    console.log(`Deleted ${bRes.deletedCount} budgets.`);

    // 3. Remove all recurring schedules
    const rRes = await Recurring.deleteMany({});
    console.log(`Deleted ${rRes.deletedCount} recurring rules.`);

    // 4. Remove all goals
    const gRes = await Goal.deleteMany({});
    console.log(`Deleted ${gRes.deletedCount} goals.`);

    // 5. Remove all users (including demo@orbit.app)
    const uRes = await User.deleteMany({});
    console.log(`Deleted ${uRes.deletedCount} users.`);

    // 6. Delete user-custom categories, keeping only default system categories
    const catCustomRes = await Category.deleteMany({ isDefault: false });
    console.log(`Deleted ${catCustomRes.deletedCount} custom categories.`);

    // Ensure default system categories are clean and present
    await seedDefaultCategories();

    console.log('\n✨ Database is now 100% FRESH and ready for a new user!');
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

resetToFresh();
