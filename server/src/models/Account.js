const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [50, 'Account name cannot exceed 50 characters'],
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [50, 'Bank name cannot exceed 50 characters'],
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Account number cannot exceed 20 characters'],
    },
    type: {
      type: String,
      enum: ['bank', 'cash', 'card', 'savings', 'wallet', 'other'],
      default: 'bank',
    },
    initialBalance: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: '#10B981',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    },
    icon: {
      type: String,
      default: 'Building',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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

// Indexes
accountSchema.index({ user: 1, name: 1 });
accountSchema.index({ user: 1, isDefault: 1 });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
