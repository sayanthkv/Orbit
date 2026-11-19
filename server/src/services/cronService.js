const cron = require('node-cron');
const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');

/**
 * Calculates the next run date based on frequency
 */
const calculateNextRunDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
};

/**
 * Processes all active recurring transactions that are currently due
 */
const processDueRecurringTransactions = async () => {
  const now = new Date();
  console.log(`⏰ [cronService] Checking for due recurring transactions at ${now.toISOString()}...`);

  try {
    const dueRules = await Recurring.find({
      isActive: true,
      nextRunDate: { $lte: now },
    });

    if (dueRules.length === 0) {
      console.log('⏰ [cronService] No recurring transactions due at this time.');
      return { processedCount: 0, createdTransactions: [] };
    }

    console.log(`⏰ [cronService] Found ${dueRules.length} due recurring transaction(s). Processing...`);

    const createdTransactions = [];

    for (const rule of dueRules) {
      // 1. Create the new transaction
      const newTx = await Transaction.create({
        user: rule.user,
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        date: now,
        note: rule.note ? `[Auto-Recurring] ${rule.note}` : `[Auto-Recurring] ${rule.frequency}`,
        paymentMethod: rule.paymentMethod,
      });

      createdTransactions.push(newTx);

      // 2. Advance the next run date
      const nextDate = calculateNextRunDate(rule.nextRunDate, rule.frequency);
      rule.nextRunDate = nextDate;
      rule.lastProcessed = now;
      await rule.save();

      console.log(`   ✅ Created transaction ${newTx._id} (₹${newTx.amount}) for user ${rule.user}. Next run: ${nextDate.toISOString()}`);
    }

    console.log(`🎉 [cronService] Successfully processed ${createdTransactions.length} recurring transaction(s).`);
    return { processedCount: createdTransactions.length, createdTransactions };
  } catch (error) {
    console.error('❌ [cronService] Error processing recurring transactions:', error.message);
    throw error;
  }
};

/**
 * Initializes the node-cron scheduler
 */
const initCron = () => {
  // Run every hour at minute 0: '0 * * * *'
  // In development, also schedule every 30 minutes
  const scheduleExpr = '0 * * * *';

  cron.schedule(scheduleExpr, async () => {
    await processDueRecurringTransactions();
  });

  console.log(`🚀 [cronService] node-cron scheduler initialized with expression: "${scheduleExpr}"`);

  // Run once shortly after server startup to catch up on any missed transactions
  setTimeout(() => {
    processDueRecurringTransactions().catch((e) =>
      console.warn('Startup recurring check warning:', e.message)
    );
  }, 3000);
};

module.exports = {
  calculateNextRunDate,
  processDueRecurringTransactions,
  initCron,
};
