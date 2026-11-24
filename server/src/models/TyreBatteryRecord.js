const mongoose = require('mongoose');

const tyreBatteryRecordSchema = new mongoose.Schema(
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
      index: true,
    },
    itemType: {
      type: String,
      enum: ['tyre', 'battery'],
      required: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required (e.g. MRF, Michelin, Amaron, Exide)'],
      trim: true,
    },
    model: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      default: 'Front',
      trim: true, // e.g. 'Front', 'Rear', 'All 4', 'Main Battery'
    },
    installDate: {
      type: Date,
      default: Date.now,
    },
    installOdometer: {
      type: Number,
      default: 0,
    },
    estimatedLifeKm: {
      type: Number,
      default: 40000,
    },
    estimatedLifeMonths: {
      type: Number,
      default: 36,
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

tyreBatteryRecordSchema.index({ user: 1, vehicle: 1, installDate: -1 });

module.exports = mongoose.model('TyreBatteryRecord', tyreBatteryRecordSchema);
