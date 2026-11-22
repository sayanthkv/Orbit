const cron = require('node-cron');
const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');

/**
 * Calculates the next run date based on frequency
 */
const calculateNextRunDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
};

/**
 * Processes all active recurring transactions that are currently due.
 * Supports optional userId parameter to run catch-up on login or page load.
 */
const processDueRecurringTransactions = async (userId = null) => {
  const now = new Date();
  const query = {
    isActive: true,
    nextRunDate: { $lte: now },
  };

  if (userId) {
    query.user = userId;
  }

  try {
    const dueRules = await Recurring.find(query);

    if (dueRules.length === 0) {
      return { processedCount: 0, createdTransactions: [] };
    }

    const createdTransactions = [];

    for (const rule of dueRules) {
      // Catch up on any runs that were scheduled in the past while server was down
      // Limit catch-up loop to prevent runaway cycles (max 365 iterations per rule)
      let iterations = 0;
      const maxIterations = 365;

      while (rule.nextRunDate <= now && iterations < maxIterations) {
        iterations++;

        // If an endDate is specified and we have passed it, deactivate rule and break
        if (rule.endDate && rule.nextRunDate > rule.endDate) {
          rule.isActive = false;
          break;
        }

        const scheduledDate = new Date(rule.nextRunDate);
        const dayStart = new Date(scheduledDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(scheduledDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Idempotency: verify this recurring transaction wasn't already generated for this date
        const existingTx = await Transaction.findOne({
          user: rule.user,
          recurringRule: rule._id,
          date: { $gte: dayStart, $lte: dayEnd },
        });

        if (!existingTx) {
          const newTx = await Transaction.create({
            user: rule.user,
            type: rule.type,
            amount: rule.amount,
            category: rule.category || undefined,
            account: rule.account || undefined,
            toAccount: rule.toAccount || undefined,
            date: scheduledDate,
            note: rule.note ? `[Auto-Recurring] ${rule.note}` : `[Auto-Recurring] ${rule.frequency}`,
            paymentMethod: rule.paymentMethod || 'bank',
            recurringRule: rule._id,
          });
          createdTransactions.push(newTx);
        }

        // Advance to next run date
        const nextDate = calculateNextRunDate(rule.nextRunDate, rule.frequency);
        rule.nextRunDate = nextDate;
        rule.lastProcessed = now;

        // If the new nextDate exceeds endDate, deactivate rule
        if (rule.endDate && nextDate > rule.endDate) {
          rule.isActive = false;
          break;
        }
      }

      await rule.save();
    }

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
  // Run hourly check
  const scheduleExpr = '0 * * * *';

  cron.schedule(scheduleExpr, async () => {
    try {
      await processDueRecurringTransactions();
    } catch (err) {
      console.warn('Cron execution warning:', err.message);
    }
  });

  // Run once on server startup after a small delay to allow DB connection to settle
  setTimeout(() => {
    processDueRecurringTransactions().catch((e) =>
      console.warn('Startup recurring catch-up check warning:', e.message)
    );
  }, 4000);
};

module.exports = {
  calculateNextRunDate,
  processDueRecurringTransactions,
  initCron,
};
