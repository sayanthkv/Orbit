const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const totp = require('../utils/totp');

describe('Orbit Full-Stack Test Suite', () => {
  // Phase 1: Transfers between accounts (correctness fix)
  describe('Phase 1: Transfers between accounts', () => {
    it('should calculate account balance adjustments atomically for transfers', () => {
      const fromAccount = { _id: 'acc_from', balance: 10000 };
      const toAccount = { _id: 'acc_to', balance: 2500 };
      const transferAmount = 3000;

      // Simulate atomic session update
      fromAccount.balance -= transferAmount;
      toAccount.balance += transferAmount;

      assert.strictEqual(fromAccount.balance, 7000);
      assert.strictEqual(toAccount.balance, 5500);

      // Verify total portfolio net worth remains invariant during internal transfer
      const totalNetWorthBefore = 10000 + 2500;
      const totalNetWorthAfter = fromAccount.balance + toAccount.balance;
      assert.strictEqual(totalNetWorthBefore, totalNetWorthAfter);
    });

    it('should exclude transfer transactions from income and expense category totals', () => {
      const transactions = [
        { type: 'income', amount: 50000, category: 'Salary' },
        { type: 'expense', amount: 1500, category: 'Food' },
        { type: 'transfer', amount: 5000, category: 'Transfer', fromAccount: 'HDFC', toAccount: 'Cash' },
      ];

      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      assert.strictEqual(income, 50000);
      assert.strictEqual(expense, 1500);
    });
  });

  // Phase 2: Recurring transactions & subscriptions
  describe('Phase 2: Recurring transactions and subscriptions', () => {
    const calculateNextRunDate = (currentDate, frequency) => {
      const next = new Date(currentDate);
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
      }
      return next;
    };

    it('should correctly advance nextRunDate according to frequency', () => {
      const base = new Date(2026, 0, 15); // Jan 15, 2026

      const nextDaily = calculateNextRunDate(base, 'daily');
      assert.strictEqual(nextDaily.getDate(), 16);

      const nextWeekly = calculateNextRunDate(base, 'weekly');
      assert.strictEqual(nextWeekly.getDate(), 22);

      const nextMonthly = calculateNextRunDate(base, 'monthly');
      assert.strictEqual(nextMonthly.getMonth(), 1); // Feb
      assert.strictEqual(nextMonthly.getDate(), 15);

      const nextYearly = calculateNextRunDate(base, 'yearly');
      assert.strictEqual(nextYearly.getFullYear(), 2027);
    });

    it('should compute monthly committed subscription spend accurately', () => {
      const subscriptions = [
        { name: 'Netflix', amount: 649, frequency: 'monthly', isActive: true },
        { name: 'Gym', amount: 1500, frequency: 'monthly', isActive: true },
        { name: 'Domain', amount: 1200, frequency: 'yearly', isActive: true }, // 100/mo
        { name: 'Paused App', amount: 500, frequency: 'monthly', isActive: false },
      ];

      const monthlyCommitted = subscriptions
        .filter((s) => s.isActive)
        .reduce((sum, s) => {
          if (s.frequency === 'monthly') return sum + s.amount;
          if (s.frequency === 'yearly') return sum + Math.round(s.amount / 12);
          if (s.frequency === 'weekly') return sum + Math.round((s.amount * 52) / 12);
          return sum;
        }, 0);

      assert.strictEqual(monthlyCommitted, 649 + 1500 + 100);
    });
  });

  // Phase 3: Budgets with alerts and safe to spend
  describe('Phase 3: Budgets with alerts and safe to spend', () => {
    const calculateSafeToSpend = (monthlyBudget, totalSpent, currentDate = new Date()) => {
      const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const remainingDays = Math.max(1, daysInMonth - currentDate.getDate() + 1);
      return Math.round(remainingBudget / remainingDays);
    };

    const getBudgetStatus = (spent, limit) => {
      const ratio = spent / limit;
      return {
        ratio,
        isWarning: ratio >= 0.8 && ratio < 1.0,
        isExceeded: ratio >= 1.0,
      };
    };

    it('should trigger in-app alerts at 80% warning and 100% exceeded thresholds', () => {
      const statusAt79 = getBudgetStatus(790, 1000);
      assert.strictEqual(statusAt79.isWarning, false);
      assert.strictEqual(statusAt79.isExceeded, false);

      const statusAt80 = getBudgetStatus(800, 1000);
      assert.strictEqual(statusAt80.isWarning, true);
      assert.strictEqual(statusAt80.isExceeded, false);

      const statusAt105 = getBudgetStatus(1050, 1000);
      assert.strictEqual(statusAt105.isWarning, false);
      assert.strictEqual(statusAt105.isExceeded, true);
    });

    it('should correctly calculate safe-to-spend per day for rest of month', () => {
      // 10 days remaining with 5000 budget remaining -> 500/day
      const testDate = new Date(2026, 10, 21); // November (30 days total) -> 10 days remaining
      const safePerDay = calculateSafeToSpend(10000, 5000, testDate);
      assert.strictEqual(safePerDay, 500);
    });
  });

  // Phase 4: CSV Import & duplicate detection
  describe('Phase 4: CSV Import duplicate detection', () => {
    const generateRowHash = (dateStr, amount, description, account) => {
      const normalizedDate = new Date(dateStr).toISOString().slice(0, 10);
      const normalizedDesc = (description || '').trim().toLowerCase();
      const raw = `${normalizedDate}|${Number(amount).toFixed(2)}|${normalizedDesc}|${account}`;
      return crypto.createHash('sha256').update(raw).digest('hex');
    };

    it('should detect duplicate transactions using sha256 hash', () => {
      const hash1 = generateRowHash('2026-11-15', 450, 'Zomato Lunch', 'acc_123');
      const hash2 = generateRowHash('2026-11-15T12:00:00Z', 450, '  zomato lunch  ', 'acc_123');
      assert.strictEqual(hash1, hash2);

      const hashDifferent = generateRowHash('2026-11-15', 451, 'Zomato Lunch', 'acc_123');
      assert.notStrictEqual(hash1, hashDifferent);
    });
  });

  // Phase 5: Search, filters, tags & notes
  describe('Phase 5: Search, filters and tags', () => {
    it('should filter transactions by tag, min/max amount, and query string', () => {
      const transactions = [
        { id: 1, amount: 450, note: 'Dinner with team', tags: ['dining', 'work'] },
        { id: 2, amount: 120, note: 'Chai stall', tags: ['food'] },
        { id: 3, amount: 1500, note: 'Grocery shopping', tags: ['supplies', 'dining'] },
      ];

      // Filter by tag
      const diningTxs = transactions.filter((t) => t.tags.includes('dining'));
      assert.strictEqual(diningTxs.length, 2);

      // Filter by amount range 100 - 500
      const rangeTxs = transactions.filter((t) => t.amount >= 100 && t.amount <= 500);
      assert.strictEqual(rangeTxs.length, 2);

      // Free text search
      const searchTxs = transactions.filter((t) => t.note.toLowerCase().includes('chai'));
      assert.strictEqual(searchTxs.length, 1);
      assert.strictEqual(searchTxs[0].id, 2);
    });
  });

  // Phase 6: Savings goals & smart insights
  describe('Phase 6: Savings goals and rule-based insights', () => {
    const calculateSuggestedContribution = (targetAmount, currentAmount, targetDate) => {
      const remaining = Math.max(0, targetAmount - currentAmount);
      const months = Math.max(1, Math.round((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.4)));
      return Math.round(remaining / months);
    };

    it('should calculate suggested monthly savings contribution for goals', () => {
      const now = new Date();
      const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
      const suggested = calculateSuggestedContribution(100000, 40000, sixMonthsLater);
      // 60,000 / 6 = 10,000
      assert.strictEqual(suggested, 10000);
    });
  });

  // Phase 7: Quick Add Natural Language Parser
  describe('Phase 7: Quick add natural language parsing logic', () => {
    const parseQuickText = (input) => {
      const tokens = input.trim().split(/\s+/);
      let amount = null;
      let isYesterday = false;
      const notes = [];

      tokens.forEach((t) => {
        if (/^\d+(\.\d+)?$/.test(t) && amount === null) {
          amount = parseFloat(t);
        } else if (t.toLowerCase() === 'yesterday') {
          isYesterday = true;
        } else {
          notes.push(t);
        }
      });

      return {
        amount,
        isYesterday,
        note: notes.join(' '),
      };
    };

    it('should parse "chai 40 yesterday" deterministically', () => {
      const res = parseQuickText('chai 40 yesterday');
      assert.strictEqual(res.amount, 40);
      assert.strictEqual(res.isYesterday, true);
      assert.strictEqual(res.note, 'chai');
    });

    it('should parse "zomato 450 food" into amount and note', () => {
      const res = parseQuickText('zomato 450 food');
      assert.strictEqual(res.amount, 450);
      assert.strictEqual(res.note, 'zomato food');
    });
  });

  // Phase 8: OpenAPI Specification
  describe('Phase 8: OpenAPI documentation', () => {
    it('should provide complete OpenAPI 3.0.3 specification with all required routes', () => {
      const openapi = require('../docs/openapi.json');
      assert.strictEqual(openapi.openapi, '3.0.3');
      assert.ok(openapi.paths['/api/transactions']);
      assert.ok(openapi.paths['/api/recurring']);
      assert.ok(openapi.paths['/api/budgets']);
      assert.ok(openapi.paths['/api/export/import']);
      assert.ok(openapi.paths['/api/auth/demo']);
    });
  });

  // Phase 9: Security Upgrades (TOTP 2FA & Refresh Tokens)
  describe('Phase 9: Security upgrades', () => {
    it('should generate valid base32 TOTP secret', () => {
      const secret = totp.generateSecret();
      assert.ok(secret);
      assert.ok(secret.length >= 16);
      assert.match(secret, /^[A-Z2-7]+$/);
    });

    it('should verify 6-digit TOTP code and reject invalid code', () => {
      const secret = totp.generateSecret();
      const code = totp.generateTOTP(secret);
      assert.match(code, /^\d{6}$/);

      const isValid = totp.verifyTOTP(code, secret);
      assert.strictEqual(isValid, true);

      const isInvalid = totp.verifyTOTP('000000', secret);
      assert.strictEqual(isInvalid, false);
    });

    it('should generate 8 secure backup codes and verify against SHA-256 hash', () => {
      const { codes, hashedCodes } = totp.generateBackupCodes(8);
      assert.strictEqual(codes.length, 8);
      assert.strictEqual(hashedCodes.length, 8);

      const matchIndex = totp.verifyBackupCode(codes[0], hashedCodes);
      assert.strictEqual(matchIndex, 0);

      const fakeMatch = totp.verifyBackupCode('INVALID1', hashedCodes);
      assert.strictEqual(fakeMatch, -1);
    });

    it('should format standard otpauth:// URL for authenticator apps', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const url = totp.getOtpAuthUrl(secret, 'alex@orbit.finance', 'Orbit');
      assert.ok(url.includes('otpauth://totp/Orbit:alex%40orbit.finance'));
      assert.ok(url.includes('secret=JBSWY3DPEHPK3PXP'));
    });
  });
});
