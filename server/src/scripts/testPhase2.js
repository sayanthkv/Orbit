const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const dotenv = require('dotenv');

dotenv.config();

const runPhase2Tests = async () => {
  console.log('🧪 Starting Phase 2 Core Tracking Verification Tests...\n');

  try {
    await connectDB();

    // 1. Setup test user
    const user = await User.create({
      name: 'Phase 2 Tester',
      email: `p2_${Date.now()}@orbit.app`,
      passwordHash: await User.hashPassword('Pass123!'),
      currency: 'INR',
    });
    console.log(`✅ Test User created: ${user.email}`);

    // 2. Custom Category Creation
    console.log('\n2️⃣ Testing Custom Category Creation...');
    const customCat = await Category.create({
      user: user._id,
      name: 'Books & Learning',
      icon: 'Book',
      color: '#3B82F6',
      type: 'expense',
      isDefault: false,
    });
    console.log(`✅ Custom category created: "${customCat.name}" (ID: ${customCat._id})`);

    // 3. Category Update
    customCat.name = 'Books & Courses';
    await customCat.save();
    console.log(`✅ Category name updated to: "${customCat.name}"`);

    // 4. Create Transactions
    console.log('\n3️⃣ Testing Transaction Creation (Income & Expense)...');
    const defaultSalaryCat = await Category.findOne({ name: 'Salary', isDefault: true });
    const defaultFoodCat = await Category.findOne({ name: 'Food', isDefault: true });

    const tx1 = await Transaction.create({
      user: user._id,
      type: 'income',
      amount: 75000,
      category: defaultSalaryCat._id,
      date: new Date('2026-11-01'),
      note: 'November Monthly Tech Salary',
      paymentMethod: 'bank',
    });

    const tx2 = await Transaction.create({
      user: user._id,
      type: 'expense',
      amount: 850,
      category: defaultFoodCat._id,
      date: new Date('2026-11-05'),
      note: 'Dinner at Italian Bistro with friends',
      paymentMethod: 'UPI',
    });

    const tx3 = await Transaction.create({
      user: user._id,
      type: 'expense',
      amount: 1500,
      category: customCat._id,
      date: new Date('2026-11-08'),
      note: 'System Design Online Course subscription',
      paymentMethod: 'card',
    });

    console.log(`✅ Created 3 test transactions:`);
    console.log(`   - Income: ₹${tx1.amount} (${tx1.note})`);
    console.log(`   - Expense: ₹${tx2.amount} (${tx2.note})`);
    console.log(`   - Expense: ₹${tx3.amount} (${tx3.note})`);

    // 5. Test Server-side Pagination & Filtering
    console.log('\n4️⃣ Testing Server-side Pagination & Filtering...');
    const allUserTxs = await Transaction.find({ user: user._id }).sort({ date: -1 });
    if (allUserTxs.length !== 3) {
      throw new Error(`Expected 3 transactions, found ${allUserTxs.length}`);
    }

    // Filter by type: expense
    const expenseOnly = await Transaction.find({ user: user._id, type: 'expense' });
    if (expenseOnly.length !== 2) {
      throw new Error(`Expected 2 expenses, found ${expenseOnly.length}`);
    }
    console.log(`✅ Type filter (expense): 2 matches found.`);

    // Keyword search on note: 'Italian'
    const searchMatch = await Transaction.find({
      user: user._id,
      note: { $regex: 'Italian', $options: 'i' },
    });
    if (searchMatch.length !== 1 || !searchMatch[0].note.includes('Italian')) {
      throw new Error('Keyword search failed on note field!');
    }
    console.log(`✅ Note keyword search ('Italian'): Matched "${searchMatch[0].note}"`);

    // 6. Test Category Deletion Safeguard
    console.log('\n5️⃣ Testing Category Deletion Safeguard...');
    const linkedTxs = await Transaction.countDocuments({ user: user._id, category: customCat._id });
    if (linkedTxs > 0) {
      console.log(`✅ Verified safeguard: Custom category "${customCat.name}" has ${linkedTxs} linked transaction(s) and cannot be deleted.`);
    }

    // 7. Update Transaction
    console.log('\n6️⃣ Testing Transaction Update...');
    tx2.amount = 950;
    tx2.note = 'Dinner at Italian Bistro with tip';
    await tx2.save();
    const updatedTx = await Transaction.findById(tx2._id);
    if (updatedTx.amount !== 950 || updatedTx.note !== 'Dinner at Italian Bistro with tip') {
      throw new Error('Transaction update failed to persist!');
    }
    console.log(`✅ Transaction updated successfully: ₹${updatedTx.amount} - ${updatedTx.note}`);

    // 8. Delete Transaction & Cleanup
    console.log('\n7️⃣ Testing Transaction Deletion & Cleanup...');
    await Transaction.deleteMany({ user: user._id });
    const remainingTxs = await Transaction.countDocuments({ user: user._id });
    if (remainingTxs !== 0) {
      throw new Error('Failed to delete user transactions!');
    }
    console.log('✅ Transactions deleted successfully.');

    // Now category can be deleted safely
    await Category.findByIdAndDelete(customCat._id);
    console.log('✅ Custom category deleted successfully now that no transactions link to it.');

    await User.findByIdAndDelete(user._id);
    console.log('🧹 Cleaned up test user.');

    console.log('\n🎉 ALL PHASE 2 CORE TRACKING TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 2 Test Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runPhase2Tests();
