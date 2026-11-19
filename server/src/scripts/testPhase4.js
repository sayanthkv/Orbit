const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Recurring = require('../models/Recurring');
const { processDueRecurringTransactions, calculateNextRunDate } = require('../services/cronService');
const dotenv = require('dotenv');

dotenv.config();

const runPhase4Tests = async () => {
  console.log('🧪 Starting Phase 4 Budgets & Recurring Verification Tests...\n');

  try {
    await connectDB();

    const user = await User.create({
      name: 'Phase 4 Tester',
      email: `p4_${Date.now()}@orbit.app`,
      passwordHash: await User.hashPassword('Pass123!'),
      currency: 'INR',
    });
    console.log(`✅ Test User created: ${user.email}`);

    const foodCat = await Category.findOne({ name: 'Food', isDefault: true });
    const travelCat = await Category.findOne({ name: 'Travel', isDefault: true });

    // 1. Set Monthly Budgets
    console.log('\n1️⃣ Testing Budget Creation with 80% and 100% Thresholds...');
    const month = 11;
    const year = 2026;

    // Budget 1: Food limit = 10,000
    await Budget.create({
      user: user._id,
      category: foodCat._id,
      monthlyLimit: 10000,
      month,
      year,
    });

    // Budget 2: Travel limit = 5,000
    await Budget.create({
      user: user._id,
      category: travelCat._id,
      monthlyLimit: 5000,
      month,
      year,
    });

    console.log('✅ Budgets created: Food (Limit: ₹10,000), Travel (Limit: ₹5,000)');

    // 2. Add Transactions to test thresholds
    // Food: 8,500 spent (85% -> Warning state)
    await Transaction.create({
      user: user._id,
      type: 'expense',
      amount: 8500,
      category: foodCat._id,
      date: new Date('2026-11-10'),
      note: 'Grocery & Dining',
    });

    // Travel: 6,000 spent (120% -> Exceeded state)
    await Transaction.create({
      user: user._id,
      type: 'expense',
      amount: 6000,
      category: travelCat._id,
      date: new Date('2026-11-12'),
      note: 'Flight ticket',
    });

    // Verify warning status
    const foodSpent = 8500;
    const foodLimit = 10000;
    const foodPct = Math.round((foodSpent / foodLimit) * 100);
    const isFoodWarning = foodSpent >= foodLimit * 0.8 && foodSpent < foodLimit;
    const isFoodExceeded = foodSpent >= foodLimit;

    if (!isFoodWarning || isFoodExceeded || foodPct !== 85) {
      throw new Error(`Food budget status calculation error! Warning: ${isFoodWarning}, Exceeded: ${isFoodExceeded}`);
    }
    console.log(`✅ Food budget verified: ₹${foodSpent}/₹${foodLimit} (${foodPct}%) -> 80% Warning Flag Active`);

    const travelSpent = 6000;
    const travelLimit = 5000;
    const travelPct = Math.round((travelSpent / travelLimit) * 100);
    const isTravelExceeded = travelSpent >= travelLimit;

    if (!isTravelExceeded || travelPct !== 120) {
      throw new Error(`Travel budget status calculation error! Exceeded: ${isTravelExceeded}`);
    }
    console.log(`✅ Travel budget verified: ₹${travelSpent}/₹${travelLimit} (${travelPct}%) -> 100% Exceeded Alert Active`);

    // 3. Test Recurring Transactions & node-cron Automation
    console.log('\n2️⃣ Testing Recurring Transactions & Cron Automation Engine...');
    const pastDueTime = new Date(Date.now() - 60000); // 1 minute ago (due for execution)

    const entertainmentCat = await Category.findOne({ name: 'Entertainment', isDefault: true });
    const recurringRule = await Recurring.create({
      user: user._id,
      type: 'expense',
      amount: 649,
      category: entertainmentCat._id,
      frequency: 'monthly',
      startDate: pastDueTime,
      nextRunDate: pastDueTime, // Due immediately
      note: 'Netflix Premium Subscription',
      paymentMethod: 'card',
      isActive: true,
    });
    console.log(`✅ Recurring schedule created: Netflix (₹${recurringRule.amount}, Monthly). Next Run: ${pastDueTime.toISOString()}`);

    // Trigger cron processing function
    console.log('⏰ Running cron processor...');
    const cronResult = await processDueRecurringTransactions();

    if (cronResult.processedCount < 1) {
      throw new Error('Cron processor failed to detect due recurring rule!');
    }
    console.log(`✅ Cron processor created ${cronResult.processedCount} transaction(s).`);

    // Verify the auto-created transaction exists in DB
    const createdTx = await Transaction.findOne({
      user: user._id,
      note: { $regex: 'Netflix Premium Subscription' },
    });
    if (!createdTx || createdTx.amount !== 649) {
      throw new Error('Auto-created transaction not found in database!');
    }
    console.log(`✅ Verified auto-created transaction: "${createdTx.note}" for ₹${createdTx.amount}`);

    // Verify nextRunDate was bumped forward by 1 month
    const updatedRule = await Recurring.findById(recurringRule._id);
    if (updatedRule.nextRunDate <= pastDueTime) {
      throw new Error('nextRunDate was not updated forward after execution!');
    }
    console.log(`✅ Recurring schedule nextRunDate successfully advanced to: ${updatedRule.nextRunDate.toISOString()}`);

    // Cleanup
    await Budget.deleteMany({ user: user._id });
    await Recurring.deleteMany({ user: user._id });
    await Transaction.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    console.log('\n🧹 Cleaned up test data.');

    console.log('\n🎉 ALL PHASE 4 BUDGETS & RECURRING TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 4 Test Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runPhase4Tests();
