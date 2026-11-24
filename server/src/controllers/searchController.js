const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');

// GET /api/search - Search across notes, tags, categories, amounts
const searchTransactions = async (req, res, next) => {
  try {
    const { q = '', tag, limit = 20 } = req.query;
    const trimmed = q.trim();

    const bankQuery = { user: req.user._id };
    const cashQuery = { user: req.user._id };

    if (tag) {
      bankQuery.tags = tag;
      cashQuery.tags = tag;
    }

    if (trimmed) {
      const isNum = !isNaN(Number(trimmed));
      const textConditions = [
        { note: { $regex: trimmed, $options: 'i' } },
        { category: { $regex: trimmed, $options: 'i' } },
        { tags: { $in: [new RegExp(trimmed, 'i')] } },
      ];
      if (isNum) {
        textConditions.push({ amount: Number(trimmed) });
      }

      bankQuery.$or = textConditions;
      cashQuery.$or = textConditions;
    }

    const [bankTx, cashTx] = await Promise.all([
      Transaction.find(bankQuery)
        .populate('account', 'name type')
        .sort({ date: -1 })
        .limit(Number(limit))
        .lean(),
      CashTransaction.find(cashQuery)
        .sort({ date: -1 })
        .limit(Number(limit))
        .lean(),
    ]);

    const formattedBank = bankTx.map((tx) => ({
      _id: tx._id,
      source: 'bank',
      accountName: tx.account?.name || 'Bank Account',
      accountType: tx.account?.type || 'Savings',
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      note: tx.note,
      tags: tx.tags || [],
      attachment: tx.attachment,
      recurringRuleId: tx.recurringRuleId,
    }));

    const formattedCash = cashTx.map((tx) => ({
      _id: tx._id,
      source: 'cash',
      accountName: 'Cash in Hand',
      accountType: 'Cash',
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      note: tx.note,
      tags: tx.tags || [],
      attachment: tx.attachment,
      recurringRuleId: tx.recurringRuleId,
    }));

    // Merge and sort by date descending
    const merged = [...formattedBank, ...formattedCash]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        results: merged,
        count: merged.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/search/tags - Get unique tags used by current user
const getTags = async (req, res, next) => {
  try {
    const uId = new mongoose.Types.ObjectId(req.user._id);

    const [bankTags, cashTags] = await Promise.all([
      Transaction.distinct('tags', { user: uId }),
      CashTransaction.distinct('tags', { user: uId }),
    ]);

    const allTags = Array.from(new Set([...bankTags, ...cashTags])).filter(Boolean).sort();

    res.status(200).json({
      success: true,
      data: { tags: allTags },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTransactions,
  getTags,
};
