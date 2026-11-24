const mongoose = require('mongoose');

const cashProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    openingBalance: {
      type: Number,
      required: [true, 'Opening cash balance is required'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CashProfile', cashProfileSchema);
