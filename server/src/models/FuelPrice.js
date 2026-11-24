const mongoose = require('mongoose');

const fuelPriceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'CNG', 'electric'],
      required: [true, 'Fuel type is required'],
    },
    pricePerLitre: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price must be greater than zero'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

fuelPriceSchema.index({ user: 1, fuelType: 1, date: -1 });

module.exports = mongoose.model('FuelPrice', fuelPriceSchema);
