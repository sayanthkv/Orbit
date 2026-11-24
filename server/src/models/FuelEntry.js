const mongoose = require('mongoose');

const fuelEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer cannot be negative'],
    },
    litres: {
      type: Number,
      required: [true, 'Volume filled is required (litres or kWh)'],
      min: [0.01, 'Litres must be greater than zero'],
    },
    pricePerLitre: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price per unit must be greater than zero'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be greater than zero'],
    },
    isFullTank: {
      type: Boolean,
      default: true,
    },
    isPartial: {
      type: Boolean,
      default: false,
    },
    stationName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Station name cannot exceed 100 characters'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    receipt: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      fileType: { type: String, default: null },
    },
    mileage: {
      type: Number,
      default: null, // Computed via full-to-full logic
    },
    costPerKm: {
      type: Number,
      default: null,
    },
    distanceSinceLastFill: {
      type: Number,
      default: 0,
    },
    linkedExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    linkedExpenseType: {
      type: String,
      enum: ['bank', 'cash', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fuelEntrySchema.index({ user: 1, vehicle: 1, date: -1, odometer: -1 });

module.exports = mongoose.model('FuelEntry', fuelEntrySchema);
