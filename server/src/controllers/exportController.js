const crypto = require('crypto');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Account = require('../models/Account');

// Prevent CSV / Excel formula injection attacks
const sanitizeCSVCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // If field starts with formula trigger characters, prepend single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

// Compute deterministic hash for duplicate detection
const computeTransactionHash = (date, amount, note, accountId) => {
  const dStr = date ? new Date(date).toISOString().split('T')[0] : '';
  const amtStr = Number(amount || 0).toFixed(2);
  const noteStr = (note || '').trim().toLowerCase();
  const accStr = (accountId || '').toString();
  return crypto.createHash('sha256').update(`${dStr}|${amtStr}|${noteStr}|${accStr}`).digest('hex');
};

// @desc    Export transactions to sanitized CSV
// @route   GET /api/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, type, categoryId, accountId } = req.query;

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.category = new mongoose.Types.ObjectId(categoryId);
    }

    if (accountId && accountId !== 'all' && mongoose.Types.ObjectId.isValid(accountId)) {
      const accId = new mongoose.Types.ObjectId(accountId);
      query.$or = [{ account: accId }, { toAccount: accId }];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length === 10) end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query)
      .populate('category', 'name')
      .populate('account', 'name bankName')
      .populate('toAccount', 'name bankName')
      .sort({ date: -1 });

    const headers = [
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Account',
      'To Account',
      'Category',
      'Payment Method',
      'Note / Description',
    ];

    const rows = transactions.map((t) => [
      sanitizeCSVCell(new Date(t.date).toISOString().split('T')[0]),
      sanitizeCSVCell(t.type),
      t.amount,
      sanitizeCSVCell(req.user.currency || 'INR'),
      sanitizeCSVCell(t.account?.bankName || t.account?.name || ''),
      sanitizeCSVCell(t.toAccount?.bankName || t.toAccount?.name || ''),
      sanitizeCSVCell(t.category?.name || (t.type === 'transfer' ? 'Transfer' : 'Uncategorized')),
      sanitizeCSVCell(t.paymentMethod || 'bank'),
      sanitizeCSVCell(t.note || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const fileName = `orbit-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Preview CSV Import with duplicate detection and row validation
// @route   POST /api/export/import/preview
// @access  Private
const previewCSVImport = async (req, res, next) => {
  try {
    const { rows = [], defaultAccountId } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No CSV row data provided for preview.',
      });
    }

    if (rows.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'CSV file exceeds maximum limit of 1000 rows at once.',
      });
    }

    // Load user's categories & accounts for matching
    const [userCategories, userAccounts] = await Promise.all([
      Category.find({ $or: [{ isDefault: true }, { user: req.user._id }] }),
      Account.find({ user: req.user._id }),
    ]);

    const defaultAccount =
      userAccounts.find((a) => a._id.toString() === defaultAccountId) ||
      userAccounts.find((a) => a.isDefault) ||
      userAccounts[0];

    // Load recent transactions for duplicate detection
    const existingTransactions = await Transaction.find({
      user: req.user._id,
    }).select('date amount note account');

    const existingHashSet = new Set(
      existingTransactions.map((tx) =>
        computeTransactionHash(tx.date, tx.amount, tx.note, tx.account)
      )
    );

    const evaluatedRows = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const errors = [];

      // 1. Validate Date
      let parsedDate = null;
      if (!raw.date) {
        errors.push('Date is missing');
      } else {
        const d = new Date(raw.date);
        if (isNaN(d.getTime())) {
          errors.push(`Invalid date format "${raw.date}"`);
        } else {
          parsedDate = d;
        }
      }

      // 2. Validate Amount
      let parsedAmount = null;
      const cleanAmt = String(raw.amount || '')
        .replace(/[^0-9.-]/g, '')
        .trim();
      const numAmt = parseFloat(cleanAmt);
      if (isNaN(numAmt) || numAmt <= 0) {
        errors.push(`Invalid amount "${raw.amount}"`);
      } else {
        parsedAmount = Math.round(numAmt * 100) / 100;
      }

      // 3. Validate Type
      let parsedType = (raw.type || '').toLowerCase().trim();
      if (!['expense', 'income', 'transfer'].includes(parsedType)) {
        parsedType = 'expense'; // default fallback
      }

      // 4. Match Category
      let matchedCategory = null;
      if (raw.category && typeof raw.category === 'string') {
        const catStr = raw.category.trim().toLowerCase();
        matchedCategory = userCategories.find(
          (c) => c.name.toLowerCase() === catStr
        );
      }
      if (!matchedCategory) {
        matchedCategory = userCategories.find((c) => c.type === parsedType) || userCategories[0];
      }

      // 5. Match Account
      let matchedAccount = null;
      if (raw.account && typeof raw.account === 'string') {
        const accStr = raw.account.trim().toLowerCase();
        matchedAccount = userAccounts.find(
          (a) =>
            a.name.toLowerCase().includes(accStr) ||
            (a.bankName && a.bankName.toLowerCase().includes(accStr))
        );
      }
      if (!matchedAccount) {
        matchedAccount = defaultAccount;
      }

      const note = String(raw.note || raw.description || '').slice(0, 250).trim();
      const accountId = matchedAccount?._id?.toString() || '';

      // Duplicate Check
      let isDuplicate = false;
      if (parsedDate && parsedAmount) {
        const rowHash = computeTransactionHash(parsedDate, parsedAmount, note, accountId);
        if (existingHashSet.has(rowHash)) {
          isDuplicate = true;
          duplicateCount++;
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        errorCount++;
      }

      evaluatedRows.push({
        rowNumber: i + 1,
        raw,
        parsed: {
          date: parsedDate,
          amount: parsedAmount,
          type: parsedType,
          categoryId: matchedCategory?._id,
          categoryName: matchedCategory?.name || 'General',
          accountId: matchedAccount?._id,
          accountName: matchedAccount?.bankName || matchedAccount?.name || 'Default Account',
          note,
          paymentMethod: raw.paymentMethod || 'bank',
        },
        isValid,
        errors,
        isDuplicate,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        rows: evaluatedRows,
        totalRows: rows.length,
        validCount,
        duplicateCount,
        errorCount,
        defaultAccountId: defaultAccount?._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Commit batch of validated CSV transactions
// @route   POST /api/export/import/commit
// @access  Private
const commitCSVImport = async (req, res, next) => {
  try {
    const { transactions = [], skipDuplicates = true } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions provided to import.',
      });
    }

    if (transactions.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot import more than 1000 transactions at once.',
      });
    }

    const defaultAccount =
      (await Account.findOne({ user: req.user._id, isDefault: true })) ||
      (await Account.findOne({ user: req.user._id }));

    // Prepare records
    const recordsToInsert = [];
    for (const item of transactions) {
      if (!item.amount || !item.date) continue;

      recordsToInsert.push({
        user: req.user._id,
        type: ['expense', 'income', 'transfer'].includes(item.type) ? item.type : 'expense',
        amount: Number(item.amount),
        category: item.categoryId || undefined,
        account: item.accountId || defaultAccount?._id || undefined,
        toAccount: item.toAccountId || undefined,
        date: new Date(item.date),
        note: (item.note || '').slice(0, 250).trim(),
        paymentMethod: item.paymentMethod || 'bank',
      });
    }

    if (recordsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records ready for insertion.',
      });
    }

    const inserted = await Transaction.insertMany(recordsToInsert);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} transaction(s)!`,
      data: {
        importedCount: inserted.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportCSV,
  previewCSVImport,
  commitCSVImport,
};
