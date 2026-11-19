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

const seedDatabase = async () => {
  console.log('🌱 Starting Orbit Realistic Demo Database Seeder...\n');

  try {
    await connectDB();
    await seedDefaultCategories();

    // 1. Create or reset demo user
    console.log('1️⃣ Setting up Demo User (demo@orbit.app / password123)...');
    const demoEmail = 'demo@orbit.app';
    await User.findOneAndDelete({ email: demoEmail });

    const passwordHash = await User.hashPassword('password123');
    const demoUser = await User.create({
      name: 'Alex Morgan',
      email: demoEmail,
      passwordHash,
      currency: 'INR',
      themePreference: 'system',
    });
    console.log(`✅ Demo user created: ${demoUser.name} (${demoUser.email})`);

    // Fetch seeded default categories
    const categories = await Category.find({ isDefault: true });
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name.toLowerCase()] = c._id;
    });

    // 2. Seed Realistic Transactions across 3 months (September, October, November 2026)
    console.log('\n2️⃣ Seeding realistic multi-month transactions...');
    await Transaction.deleteMany({ user: demoUser._id });

    const sampleTransactions = [
      // September 2026
      { type: 'income', amount: 85000, category: catMap['salary'], date: new Date('2026-09-01'), note: 'September Monthly Tech Salary', paymentMethod: 'bank' },
      { type: 'income', amount: 12000, category: catMap['freelance'], date: new Date('2026-09-14'), note: 'Mobile UI Design Consultation', paymentMethod: 'UPI' },
      { type: 'expense', amount: 22000, category: catMap['rent'], date: new Date('2026-09-02'), note: 'Apartment monthly rent', paymentMethod: 'bank' },
      { type: 'expense', amount: 9400, category: catMap['food'], date: new Date('2026-09-08'), note: 'Weekly supermarket supplies', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3200, category: catMap['bills'], date: new Date('2026-09-12'), note: 'Electricity and water utility bills', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4800, category: catMap['shopping'], date: new Date('2026-09-18'), note: 'Autumn apparel on Myntra', paymentMethod: 'card' },
      { type: 'expense', amount: 2100, category: catMap['entertainment'], date: new Date('2026-09-22'), note: 'Weekend IMAX cinema tickets & snacks', paymentMethod: 'UPI' },

      // October 2026
      { type: 'income', amount: 85000, category: catMap['salary'], date: new Date('2026-10-01'), note: 'October Monthly Tech Salary', paymentMethod: 'bank' },
      { type: 'income', amount: 18000, category: catMap['investment'], date: new Date('2026-10-20'), note: 'Quarterly mutual fund dividend yield', paymentMethod: 'bank' },
      { type: 'expense', amount: 22000, category: catMap['rent'], date: new Date('2026-10-02'), note: 'Apartment monthly rent', paymentMethod: 'bank' },
      { type: 'expense', amount: 8900, category: catMap['food'], date: new Date('2026-10-07'), note: 'Groceries & Zepto quick deliveries', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4500, category: catMap['travel'], date: new Date('2026-10-15'), note: 'Uber & Metro commute passes', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3600, category: catMap['bills'], date: new Date('2026-10-11'), note: 'Broadband Fiber & Mobile plans', paymentMethod: 'UPI' },
      { type: 'expense', amount: 8200, category: catMap['shopping'], date: new Date('2026-10-24'), note: 'Festival gifting & home decor', paymentMethod: 'card' },
      { type: 'expense', amount: 1500, category: catMap['health'], date: new Date('2026-10-28'), note: 'Dental hygiene & checkup', paymentMethod: 'card' },

      // November 2026 (Active current month)
      { type: 'income', amount: 92000, category: catMap['salary'], date: new Date('2026-11-01'), note: 'November Salary with bonus allowance', paymentMethod: 'bank' },
      { type: 'income', amount: 15000, category: catMap['freelance'], date: new Date('2026-11-12'), note: 'API Architecture Advisory fee', paymentMethod: 'UPI' },
      { type: 'expense', amount: 22000, category: catMap['rent'], date: new Date('2026-11-02'), note: 'Apartment monthly rent', paymentMethod: 'bank' },
      { type: 'expense', amount: 6200, category: catMap['food'], date: new Date('2026-11-04'), note: 'Monthly pantry grocery haul', paymentMethod: 'card' },
      { type: 'expense', amount: 1850, category: catMap['food'], date: new Date('2026-11-08'), note: 'Fine dining with team at Toit', paymentMethod: 'UPI' },
      { type: 'expense', amount: 2750, category: catMap['food'], date: new Date('2026-11-14'), note: 'Weekend barbecue supplies & drinks', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3800, category: catMap['bills'], date: new Date('2026-11-05'), note: 'Electricity bill & piped gas', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3400, category: catMap['travel'], date: new Date('2026-11-09'), note: 'Ola cabs & fuel refill', paymentMethod: 'UPI' },
      { type: 'expense', amount: 5600, category: catMap['shopping'], date: new Date('2026-11-16'), note: 'Wireless noise-cancelling headphones', paymentMethod: 'card' },
      { type: 'expense', amount: 1800, category: catMap['entertainment'], date: new Date('2026-11-17'), note: 'Concert tickets & Spotify annual', paymentMethod: 'card' },
      { type: 'expense', amount: 2400, category: catMap['health'], date: new Date('2026-11-18'), note: 'Vitamins, supplements & pharmacy', paymentMethod: 'UPI' },
    ];

    await Transaction.insertMany(
      sampleTransactions.map((tx) => ({ ...tx, user: demoUser._id }))
    );
    console.log(`✅ Seeded ${sampleTransactions.length} transactions across Sep, Oct, and Nov 2026.`);

    // 3. Seed Monthly Budgets with realistic 80% and 100% states for November 2026
    console.log('\n3️⃣ Seeding Monthly Budgets (testing 80% & 100% states)...');
    await Budget.deleteMany({ user: demoUser._id });

    const sampleBudgets = [
      // Food: Spent 10,800 / Limit 12,000 = 90% (triggers 80% Warning state)
      { user: demoUser._id, category: catMap['food'], monthlyLimit: 12000, month: 11, year: 2026 },
      // Rent: Spent 22,000 / Limit 22,000 = 100% (triggers Exceeded state)
      { user: demoUser._id, category: catMap['rent'], monthlyLimit: 22000, month: 11, year: 2026 },
      // Bills: Spent 3,800 / Limit 6,000 = 63% (Healthy)
      { user: demoUser._id, category: catMap['bills'], monthlyLimit: 6000, month: 11, year: 2026 },
      // Travel: Spent 3,400 / Limit 5,000 = 68% (Healthy)
      { user: demoUser._id, category: catMap['travel'], monthlyLimit: 5000, month: 11, year: 2026 },
      // Entertainment: Spent 1,800 / Limit 3,000 = 60% (Healthy)
      { user: demoUser._id, category: catMap['entertainment'], monthlyLimit: 3000, month: 11, year: 2026 },
    ];
    await Budget.insertMany(sampleBudgets);
    console.log(`✅ Seeded 5 category budgets for November 2026.`);

    // 4. Seed Recurring Transactions
    console.log('\n4️⃣ Seeding Recurring Schedules...');
    await Recurring.deleteMany({ user: demoUser._id });

    const sampleRecurring = [
      {
        user: demoUser._id,
        type: 'expense',
        amount: 22000,
        category: catMap['rent'],
        frequency: 'monthly',
        startDate: new Date('2026-11-02'),
        nextRunDate: new Date('2026-12-02'),
        note: 'Apartment monthly lease payment',
        paymentMethod: 'bank',
        isActive: true,
      },
      {
        user: demoUser._id,
        type: 'expense',
        amount: 649,
        category: catMap['entertainment'],
        frequency: 'monthly',
        startDate: new Date('2026-11-19'),
        nextRunDate: new Date('2026-12-19'),
        note: 'Netflix 4K Ultra HD Plan',
        paymentMethod: 'card',
        isActive: true,
      },
      {
        user: demoUser._id,
        type: 'expense',
        amount: 999,
        category: catMap['bills'],
        frequency: 'monthly',
        startDate: new Date('2026-11-10'),
        nextRunDate: new Date('2026-12-10'),
        note: 'JioFiber 300Mbps Unlimited Internet',
        paymentMethod: 'UPI',
        isActive: true,
      },
    ];
    await Recurring.insertMany(sampleRecurring);
    console.log(`✅ Seeded 3 recurring schedules.`);

    // 5. Seed Savings Goals
    console.log('\n5️⃣ Seeding Savings Goals...');
    await Goal.deleteMany({ user: demoUser._id });

    const sampleGoals = [
      {
        user: demoUser._id,
        title: 'Emergency Safety Cushion',
        targetAmount: 150000,
        currentAmount: 95000,
        targetDate: new Date('2027-03-31'),
        color: '#10B981',
      },
      {
        user: demoUser._id,
        title: 'MacBook Pro M-Series',
        targetAmount: 120000,
        currentAmount: 48000,
        targetDate: new Date('2027-01-15'),
        color: '#3B82F6',
      },
      {
        user: demoUser._id,
        title: 'Autumn Vacation in Bali',
        targetAmount: 200000,
        currentAmount: 60000,
        targetDate: new Date('2027-09-30'),
        color: '#EC4899',
      },
    ];
    await Goal.insertMany(sampleGoals);
    console.log(`✅ Seeded 3 savings goals with progress tracking.`);

    console.log('\n✨ Orbit Demo Database successfully populated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Login Email:    demo@orbit.app');
    console.log('🔑 Password:       password123');
    console.log('🌐 Frontend:       http://localhost:5173');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDatabase();
