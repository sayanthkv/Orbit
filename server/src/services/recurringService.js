const RecurringRule = require('../models/RecurringRule');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');

const getNextDate = (date, frequency) => {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Process due recurring rules for a user or for all users
 * Idempotent: generates transactions up to today without duplicates
 */
const processRecurringRules = async (userId = null) => {
  const now = new Date();
  const query = {
    active: true,
    nextRunDate: { $lte: now },
  };

  if (userId) {
    query.user = userId;
  }

  const rules = await RecurringRule.find(query);
  let createdCount = 0;

  for (const rule of rules) {
    let currentRunDate = new Date(rule.nextRunDate);

    // Guard against runaway loops (max 50 iterations catch-up)
    let iterations = 0;
    while (currentRunDate <= now && iterations < 50) {
      iterations++;

      // Check if end date reached
      if (rule.endDate && currentRunDate > new Date(rule.endDate)) {
        rule.active = false;
        break;
      }

      // Check if transaction already exists for this rule and run date
      const dateStart = new Date(currentRunDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(currentRunDate);
      dateEnd.setHours(23, 59, 59, 999);

      if (rule.target === 'account' && rule.targetAccountId) {
        const existing = await Transaction.findOne({
          recurringRuleId: rule._id,
          date: { $gte: dateStart, $lte: dateEnd },
        });

        if (!existing) {
          await Transaction.create({
            user: rule.user,
            account: rule.targetAccountId,
            type: rule.type,
            amount: rule.amount,
            category: rule.category,
            date: new Date(currentRunDate),
            note: rule.note ? `${rule.note} (Auto-recurring)` : 'Auto-recurring transaction',
            recurringRuleId: rule._id,
          });
          createdCount++;
        }
      } else if (rule.target === 'cash') {
        const existing = await CashTransaction.findOne({
          recurringRuleId: rule._id,
          date: { $gte: dateStart, $lte: dateEnd },
        });

        if (!existing) {
          await CashTransaction.create({
            user: rule.user,
            type: rule.type,
            amount: rule.amount,
            category: rule.category,
            date: new Date(currentRunDate),
            note: rule.note ? `${rule.note} (Auto-recurring)` : 'Auto-recurring transaction',
            recurringRuleId: rule._id,
          });
          createdCount++;
        }
      }

      rule.lastRunDate = new Date(currentRunDate);
      currentRunDate = getNextDate(currentRunDate, rule.frequency);
    }

    rule.nextRunDate = currentRunDate;
    await rule.save();
  }

  return createdCount;
};

module.exports = {
  getNextDate,
  processRecurringRules,
};
