const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');
const Budget = require('../models/Budget');
const CashProfile = require('../models/CashProfile');
const { computeAllAccountsWithBalances, computeCashBalance } = require('../utils/balanceHelper');

// Fetch aggregated report data for a month
const getReportData = async (userId, month, year) => {
  const now = new Date();
  const selMonth = month ? Number(month) : now.getUTCMonth() + 1;
  const selYear = year ? Number(year) : now.getUTCFullYear();

  const start = new Date(Date.UTC(selYear, selMonth - 1, 1));
  const end = new Date(Date.UTC(selYear, selMonth, 0, 23, 59, 59, 999));
  const uId = new mongoose.Types.ObjectId(userId);

  // Accounts with live balances
  const accounts = await computeAllAccountsWithBalances(userId, { isArchived: false });
  const totalBankBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  // Cash profile with live balance
  const cashProfile = await CashProfile.findOne({ user: uId });
  const cashBalanceData = await computeCashBalance(userId, cashProfile?.openingBalance || 0);

  // Monthly bank transactions
  const bankTx = await Transaction.find({
    user: uId,
    date: { $gte: start, $lte: end },
  })
    .populate('account', 'name')
    .sort({ date: -1 })
    .lean();

  // Monthly cash transactions
  const cashTx = await CashTransaction.find({
    user: uId,
    date: { $gte: start, $lte: end },
  })
    .sort({ date: -1 })
    .lean();

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  const categoryMap = {};

  const allTx = [
    ...bankTx.map((t) => ({ ...t, source: t.account?.name || 'Bank' })),
    ...cashTx.map((t) => ({ ...t, source: 'Cash' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const t of allTx) {
    if (t.type === 'income') monthlyIncome += t.amount;
    if (t.type === 'expense') {
      monthlyExpense += t.amount;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  }

  // Budgets vs Actual
  const budgets = await Budget.find({ user: uId }).lean();
  const budgetComparison = budgets.map((b) => {
    const spent = categoryMap[b.category] || 0;
    return {
      category: b.category,
      budget: b.amount,
      spent,
      difference: b.amount - spent,
    };
  });

  return {
    month: selMonth,
    year: selYear,
    summary: {
      income: monthlyIncome,
      expense: monthlyExpense,
      net: monthlyIncome - monthlyExpense,
      bankTotal: totalBankBalance,
      cashTotal: cashBalanceData.currentBalance,
      netWorth: totalBankBalance + cashBalanceData.currentBalance,
    },
    accounts,
    categories: Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: monthlyExpense > 0 ? Number(((amount / monthlyExpense) * 100).toFixed(1)) : 0,
    })),
    budgets: budgetComparison,
    transactions: allTx,
  };
};

// GET /api/reports/csv
const exportCSV = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await getReportData(req.user._id, month, year);

    let csv = 'Type,Source,Category,Amount,Date,Note,Tags\n';
    for (const t of data.transactions) {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const tagsStr = (t.tags || []).join(';');
      const cleanNote = (t.note || '').replace(/"/g, '""');
      csv += `"${t.type}","${t.source}","${t.category}","${t.amount}","${dateStr}","${cleanNote}","${tagsStr}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Orbit_Report_${data.year}_${data.month}.csv"`
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/pdf
const exportPDF = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await getReportData(req.user._id, month, year);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Orbit_Statement_${data.year}_${data.month}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .fillColor('#0f172a')
      .text('ORBIT PERSONAL FINANCIAL STATEMENT', { align: 'left' });
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Statement Period: ${data.month}/${data.year} | Generated for: ${req.user.name} (${req.user.email})`)
      .moveDown(1.5);

    // Summary Box
    doc.rect(40, doc.y, 515, 60).fillAndStroke('#f8fafc', '#e2e8f0');
    const boxY = doc.y + 12;

    doc.fillColor('#0f172a').fontSize(9).text('TOTAL INCOME', 55, boxY);
    doc.fillColor('#10b981').fontSize(14).text(`INR ${data.summary.income.toFixed(2)}`, 55, boxY + 14);

    doc.fillColor('#0f172a').fontSize(9).text('TOTAL EXPENSE', 185, boxY);
    doc.fillColor('#ef4444').fontSize(14).text(`INR ${data.summary.expense.toFixed(2)}`, 185, boxY + 14);

    doc.fillColor('#0f172a').fontSize(9).text('NET SAVINGS', 315, boxY);
    doc.fillColor('#3b82f6').fontSize(14).text(`INR ${data.summary.net.toFixed(2)}`, 315, boxY + 14);

    doc.fillColor('#0f172a').fontSize(9).text('TOTAL LIQUIDITY', 430, boxY);
    doc.fillColor('#0f172a').fontSize(14).text(`INR ${data.summary.netWorth.toFixed(2)}`, 430, boxY + 14);

    doc.y = boxY + 55;
    doc.moveDown(1);

    // Bank Accounts & Cash Summary
    doc.fontSize(12).fillColor('#0f172a').text('Accounts & Liquidity Breakdown').moveDown(0.5);
    data.accounts.forEach((acc) => {
      doc
        .fontSize(9)
        .fillColor('#334155')
        .text(`${acc.name} (${acc.type}): INR ${acc.currentBalance.toFixed(2)}`);
    });
    doc
      .fontSize(9)
      .fillColor('#334155')
      .text(`Cash in Hand: INR ${data.summary.cashTotal.toFixed(2)}`)
      .moveDown(1);

    // Category Breakdown
    if (data.categories.length > 0) {
      doc.fontSize(12).fillColor('#0f172a').text('Top Expense Categories').moveDown(0.5);
      data.categories.slice(0, 8).forEach((cat) => {
        doc
          .fontSize(9)
          .fillColor('#475569')
          .text(`${cat.category}: INR ${cat.amount.toFixed(2)} (${cat.percentage}%)`);
      });
      doc.moveDown(1);
    }

    // Budgets vs Actual
    if (data.budgets.length > 0) {
      doc.fontSize(12).fillColor('#0f172a').text('Budget Performance').moveDown(0.5);
      data.budgets.forEach((b) => {
        const status = b.spent > b.budget ? 'OVER BUDGET' : 'ON TRACK';
        doc
          .fontSize(9)
          .fillColor('#475569')
          .text(`${b.category}: Spent INR ${b.spent.toFixed(2)} / Limit INR ${b.budget} [${status}]`);
      });
      doc.moveDown(1);
    }

    // Transactions Table
    doc.fontSize(12).fillColor('#0f172a').text('Recent Transactions').moveDown(0.5);
    const recent = data.transactions.slice(0, 25);
    recent.forEach((t) => {
      const d = new Date(t.date).toISOString().split('T')[0];
      const sign = t.type === 'income' ? '+' : '-';
      doc
        .fontSize(8)
        .fillColor(t.type === 'income' ? '#10b981' : '#ef4444')
        .text(`${d} | ${t.source} | ${t.category} | ${sign}INR ${t.amount.toFixed(2)} | ${t.note || 'None'}`);
    });

    // Footer
    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(
        'Generated securely by Orbit Personal Tools Suite. All records encrypted and verified.',
        40,
        780,
        { align: 'center', width: 515 }
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportCSV,
  exportPDF,
};
