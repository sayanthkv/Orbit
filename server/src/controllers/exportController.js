const Transaction = require('../models/Transaction');

// @desc    Export transactions to CSV
// @route   GET /api/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, type, categoryId } = req.query;

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (categoryId) query.category = categoryId;
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
      .sort({ date: -1 });

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Note'];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split('T')[0],
      t.type,
      `"${(t.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
      t.amount,
      req.user.currency || 'INR',
      t.paymentMethod,
      `"${(t.note || '').replace(/"/g, '""')}"`,
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

module.exports = {
  exportCSV,
};
