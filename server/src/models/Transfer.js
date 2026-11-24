const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    fromType: {
      type: String,
      enum: ['account', 'cash'],
      required: [true, 'Source type is required (account or cash)'],
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.fromType === 'account';
      },
    },
    toType: {
      type: String,
      enum: ['account', 'cash'],
      required: [true, 'Destination type is required (account or cash)'],
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.toType === 'account';
      },
    },
    amount: {
      type: Number,
      required: [true, 'Transfer amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    date: {
      type: Date,
      required: [true, 'Transfer date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

transferSchema.index({ user: 1, date: -1 });
transferSchema.index({ user: 1, fromAccount: 1 });
transferSchema.index({ user: 1, toAccount: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
