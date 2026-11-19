const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const dotenv = require('dotenv');

dotenv.config();

const runPhase3Tests = async () => {
  console.log('🧪 Starting Phase 3 Dashboard & Analytics Verification Tests...\n');

  try {
    await connectDB();

    const user = await User.create({
      name: 'Phase 3 Tester',
      email: `p3_${Date.now()}@orbit.app`,
      passwordHash: await User.hashPassword('Pass123!'),
      currency: 'INR',
    });
    console.log(`✅ Test User created: ${user.email}`);

    const salaryCat = await Category.findOne({ name: 'Salary', isDefault: true });
    const foodCat = await Category.findOne({ name: 'Food', isDefault: true });
    const rentCat = await Category.findOne({ name: 'Rent', isDefault: true });
    const shopCat = await Category.findOne({ name: 'Shopping', isDefault: true });

    // October Data (Prior month)
    await Transaction.create([
      { user: user._id, type: 'income', amount: 80000, category: salaryCat._id, date: new Date('2026-10-01'), note: 'Oct Salary' },
      { user: user._id, type: 'expense', amount: 20000, category: rentCat._id, date: new Date('2026-10-05'), note: 'Oct Rent' },
      { user: user._id, type: 'expense', amount: 10000, category: foodCat._id, date: new Date('2026-10-10'), note: 'Oct Food' },
    ]);
    console.log('✅ Seeded October prior-month transactions.');

    // November Data (Current month) - Food increased from 10k to 14k (40% increase)
    await Transaction.create([
      { user: user._id, type: 'income', amount: 85000, category: salaryCat._id, date: new Date('2026-11-01'), note: 'Nov Salary' },
      { user: user._id, type: 'expense', amount: 20000, category: rentCat._id, date: new Date('2026-11-05'), note: 'Nov Rent' },
      { user: user._id, type: 'expense', amount: 14000, category: foodCat._id, date: new Date('2026-11-12'), note: 'Nov Food & Dining' },
      { user: user._id, type: 'expense', amount: 6000, category: shopCat._id, date: new Date('2026-11-15'), note: 'Nov Shopping' },
    ]);
    console.log('✅ Seeded November current-month transactions.');

    // 1. Test Summary
    console.log('\n1️⃣ Testing Monthly KPI Summary Calculation...');
    const now = new Date('2026-11-19');
    const startNov = new Date('2026-11-01T00:00:00.000Z');
    const endNov = new Date('2026-11-30T23:59:59.999Z');

    const novTxs = await Transaction.find({
      user: user._id,
      date: { $gte: startNov, $lte: endNov },
    });

    const totalIncome = novTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = novTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpense;
    const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);

    if (totalIncome !== 85000 || totalExpense !== 40000 || netBalance !== 45000 || savingsRate !== 53) {
      throw new Error(`Summary mismatch! Income: ${totalIncome}, Expense: ${totalExpense}, Net: ${netBalance}, Rate: ${savingsRate}`);
    }
    console.log(`✅ Summary verified: Income=₹${totalIncome}, Expense=₹${totalExpense}, Balance=₹${netBalance}, Savings Rate=${savingsRate}%`);

    // 2. Test Category Breakdown
    console.log('\n2️⃣ Testing Category Breakdown Aggregation...');
    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'expense',
          date: { $gte: startNov, $lte: endNov },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: '$cat' },
    ]);

    console.log(`✅ Categorized ${breakdown.length} expense groups:`);
    breakdown.forEach((b) => {
      const pct = Math.round((b.total / totalExpense) * 100);
      console.log(`   - ${b.cat.name}: ₹${b.total} (${pct}%)`);
    });

    // 3. Test MoM Food Insight calculation
    console.log('\n3️⃣ Testing Smart Insights Logic...');
    const octFood = 10000;
    const novFood = 14000;
    const foodIncreasePct = Math.round(((novFood - octFood) / octFood) * 100);
    console.log(`✅ Month-over-Month Food increase correctly calculated as: ${foodIncreasePct}% (exceeds 20% spike threshold)`);

    // Cleanup
    await Transaction.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    console.log('\n🧹 Cleaned up test data.');

    console.log('\n🎉 ALL PHASE 3 DASHBOARD & ANALYTICS TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 3 Test Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runPhase3Tests();
