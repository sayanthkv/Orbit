const mongoose = require('mongoose');

const serviceIntervalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true,
      index: true,
    },
    intervalKm: {
      type: Number,
      default: 3000,
      min: [100, 'Interval must be at least 100 km'],
    },
    intervalMonths: {
      type: Number,
      default: 6,
      min: [1, 'Interval must be at least 1 month'],
    },
    lastServicedKm: {
      type: Number,
      default: 0,
    },
    lastServicedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ServiceInterval', serviceIntervalSchema);
