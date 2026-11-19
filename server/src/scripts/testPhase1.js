const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const { seedDefaultCategories } = require('../services/seedService');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const runPhase1Tests = async () => {
  console.log('🧪 Starting Phase 1 Foundation Verification Tests...\n');

  try {
    // 1. Database Connection
    console.log('1️⃣ Testing Database Connection...');
    await connectDB();
    console.log('✅ Connected to MongoDB successfully.\n');

    // 2. Default Categories Seeding
    console.log('2️⃣ Testing Default Category Seeding...');
    await seedDefaultCategories();
    const categories = await Category.find({ isDefault: true });
    console.log(`✅ Found ${categories.length} seeded default categories:`);
    categories.forEach((c) => {
      console.log(`   - [${c.type.toUpperCase()}] ${c.name} (${c.icon}, color: ${c.color})`);
    });

    const expectedNames = [
      'Food', 'Travel', 'Rent', 'Bills', 'Shopping',
      'Health', 'Entertainment', 'Salary', 'Other Expense'
    ];
    for (const name of expectedNames) {
      const match = categories.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
      if (!match) {
        throw new Error(`Expected default category '${name}' not found!`);
      }
    }
    console.log('✅ All required default categories are present.\n');

    // 3. User Registration & Password Hashing
    console.log('3️⃣ Testing User Registration & Password Hashing...');
    const testEmail = `test_${Date.now()}@orbit.app`;
    const plainPassword = 'SecretPassword123!';

    const passwordHash = await User.hashPassword(plainPassword);
    const user = await User.create({
      name: 'Orbit Test User',
      email: testEmail,
      passwordHash,
      currency: 'INR',
    });

    console.log(`✅ User created: ${user.name} (${user.email}), ID: ${user._id}`);
    console.log(`✅ Password properly hashed: ${passwordHash.substring(0, 20)}...`);

    // Verify password verification method
    const isMatch = await user.comparePassword(plainPassword);
    const isWrongMatch = await user.comparePassword('WrongPassword');
    if (!isMatch || isWrongMatch) {
      throw new Error('Password verification comparison failed!');
    }
    console.log('✅ Password hash comparison verified successfully.\n');

    // 4. JWT Generation & Verification
    console.log('4️⃣ Testing JWT Generation & Authentication...');
    const secret = process.env.JWT_SECRET || 'super_secret_orbit_jwt_key_development_change_in_production';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    console.log(`✅ JWT token signed: ${token.substring(0, 25)}...`);

    const decoded = jwt.verify(token, secret);
    if (decoded.id !== user._id.toString()) {
      throw new Error('JWT payload ID does not match user ID!');
    }
    console.log('✅ JWT verification decoded matching user ID.\n');

    // 5. Update user preference
    console.log('5️⃣ Testing User Preferences Update...');
    user.currency = 'USD';
    user.themePreference = 'dark';
    await user.save();
    const updated = await User.findById(user._id);
    if (updated.currency !== 'USD' || updated.themePreference !== 'dark') {
      throw new Error('Failed to persist user preference updates!');
    }
    console.log(`✅ User preferences updated: Currency=${updated.currency}, Theme=${updated.themePreference}\n`);

    // Cleanup test user
    await User.findByIdAndDelete(user._id);
    console.log('🧹 Cleaned up test user.\n');

    console.log('🎉 ALL PHASE 1 FOUNDATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 1 Test Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runPhase1Tests();
