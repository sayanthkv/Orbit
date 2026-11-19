const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
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
      default: 'UPI',
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      required: [true, 'Frequency is required'],
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    nextRunDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastProcessed: {
      type: Date,
      default: null,
    },
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

recurringTransactionSchema.index({ isActive: 1, nextRunDate: 1 });

const Recurring = mongoose.model('Recurring', recurringTransactionSchema);

module.exports = Recurring;
