const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1'],
    },
    targetDate: {
      type: Date,
    },
    linkedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative'],
    },
    icon: {
      type: String,
      default: 'Target',
    },
    color: {
      type: String,
      default: '#10b981',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
