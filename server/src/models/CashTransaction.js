const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachment: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      fileType: { type: String, default: null },
    },
    recurringRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

cashTransactionSchema.index({ user: 1, date: -1 });
cashTransactionSchema.index({ user: 1, category: 1 });
cashTransactionSchema.index({ user: 1, tags: 1 });
cashTransactionSchema.index({ note: 'text', tags: 'text' });

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);
