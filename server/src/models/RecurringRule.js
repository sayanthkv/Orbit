const mongoose = require('mongoose');

const recurringRuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
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
    target: {
      type: String,
      enum: ['account', 'cash'],
      required: [true, 'Target is required (account or cash)'],
    },
    targetAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.target === 'account';
      },
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Frequency is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastRunDate: {
      type: Date,
    },
    nextRunDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

recurringRuleSchema.index({ user: 1, active: 1, nextRunDate: 1 });

module.exports = mongoose.model('RecurringRule', recurringRuleSchema);
