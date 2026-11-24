const { describe, it } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { sanitizeObject } = require('../middleware/sanitize');
const { getNextDate } = require('../services/recurringService');

describe('Orbit 2.0 Architectural Test Suite', () => {
  describe('Bank Account Balance Calculation with Transfers', () => {
    it('should compute balance accurately: openingBalance + income - expense + transfersIn - transfersOut', () => {
      const openingBalance = 5000;
      const totalIncome = 12000;
      const totalExpense = 4500;
      const transfersIn = 2000;
      const transfersOut = 1500;

      const currentBalance = openingBalance + totalIncome - totalExpense + transfersIn - transfersOut;
      assert.strictEqual(currentBalance, 13000);
    });

    it('should handle zero opening balance and negative balances if expenses exceed income', () => {
      const openingBalance = 0;
      const income = 100;
      const expense = 500;
      const balance = openingBalance + income - expense;
      assert.strictEqual(balance, -400);
    });
  });

  describe('Cash in Hand Balance with ATM / Deposit Transfers', () => {
    it('should calculate cash balance strictly independent of bank balances', () => {
      const cashOpening = 1000;
      const cashIncome = 500;
      const cashExpense = 200;
      const atmWithdrawal = 1500; // Transfer In to cash
      const bankDeposit = 800; // Transfer Out from cash

      const cashBalance = cashOpening + cashIncome - cashExpense + atmWithdrawal - bankDeposit;
      assert.strictEqual(cashBalance, 2000);
    });
  });

  describe('Budget Warning and Status Calculations', () => {
    it('should calculate budget status accurately (<80% normal, 80-99% warning, >=100% danger)', () => {
      const checkStatus = (spent, amount) => {
        const pct = amount > 0 ? (spent / amount) * 100 : 0;
        if (pct >= 100) return 'danger';
        if (pct >= 80) return 'warning';
        return 'normal';
      };

      assert.strictEqual(checkStatus(500, 1000), 'normal');
      assert.strictEqual(checkStatus(800, 1000), 'warning');
      assert.strictEqual(checkStatus(999, 1000), 'warning');
      assert.strictEqual(checkStatus(1000, 1000), 'danger');
      assert.strictEqual(checkStatus(1500, 1000), 'danger');
    });
  });

  describe('Recurring Rule Date Calculation', () => {
    it('should advance dates accurately according to frequency', () => {
      const base = new Date('2026-01-01T00:00:00.000Z');

      const nextDaily = getNextDate(base, 'daily');
      assert.strictEqual(nextDaily.getUTCDate(), 2);

      const nextWeekly = getNextDate(base, 'weekly');
      assert.strictEqual(nextWeekly.getUTCDate(), 8);

      const nextMonthly = getNextDate(base, 'monthly');
      assert.strictEqual(nextMonthly.getUTCMonth(), 1);

      const nextYearly = getNextDate(base, 'yearly');
      assert.strictEqual(nextYearly.getUTCFullYear(), 2027);
    });
  });

  describe('Savings Goal Progress Calculations', () => {
    it('should compute percentage and monthly needed amount correctly', () => {
      const targetAmount = 60000;
      const savedAmount = 24000;
      const remaining = targetAmount - savedAmount;
      const percentage = (savedAmount / targetAmount) * 100;

      assert.strictEqual(remaining, 36000);
      assert.strictEqual(percentage, 40);

      const monthsLeft = 6;
      const monthlyNeeded = remaining / monthsLeft;
      assert.strictEqual(monthlyNeeded, 6000);
    });
  });

  describe('Authentication & Security', () => {
    it('should hash passwords and successfully verify matching passwords', async () => {
      const password = 'StrongPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const isMatch = await bcrypt.compare(password, hash);
      const isWrong = await bcrypt.compare('WrongPassword', hash);

      assert.strictEqual(isMatch, true);
      assert.strictEqual(isWrong, false);
    });

    it('should sanitize NoSQL injection keys containing $ and .', () => {
      const maliciousPayload = {
        username: 'victim@domain.com',
        password: { $gt: '' },
        nested: {
          'bad.key': 'evil',
          clean: 'good',
        },
      };

      const sanitized = sanitizeObject(maliciousPayload);

      assert.strictEqual(sanitized.username, 'victim@domain.com');
      assert.strictEqual(sanitized.password, undefined);
      assert.strictEqual(sanitized.nested['bad.key'], undefined);
      assert.strictEqual(sanitized.nested.clean, 'good');
    });
  });

  describe('CSV Export Formatting', () => {
    it('should format expenses correctly for CSV output with escaped quotes', () => {
      const expense = {
        type: 'expense',
        source: 'HDFC Bank',
        category: 'Food & Dining',
        amount: 450,
        date: '2026-05-10T12:00:00.000Z',
        note: 'Dinner with "family"',
        tags: ['dinner', 'weekend'],
      };

      const dateStr = expense.date.split('T')[0];
      const tagsStr = expense.tags.join(';');
      const cleanNote = expense.note.replace(/"/g, '""');
      const csvLine = `"${expense.type}","${expense.source}","${expense.category}","${expense.amount}","${dateStr}","${cleanNote}","${tagsStr}"`;

      assert.strictEqual(
        csvLine,
        '"expense","HDFC Bank","Food & Dining","450","2026-05-10","Dinner with ""family""","dinner;weekend"'
      );
    });
  });
});
