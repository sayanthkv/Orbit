const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income', 'transfer'],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return this.type !== 'transfer';
      },
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [250, 'Note cannot exceed 250 characters'],
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'UPI', 'card', 'bank'],
      default: 'bank',
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    recurringRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recurring',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast aggregation and querying
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });
transactionSchema.index({ user: 1, toAccount: 1, date: -1 });
transactionSchema.index({ user: 1, tags: 1 });
transactionSchema.index({ note: 'text' });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
