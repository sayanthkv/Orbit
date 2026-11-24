const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    nickname: {
      type: String,
      required: [true, 'Vehicle nickname or name is required'],
      trim: true,
      maxlength: [100, 'Nickname cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['bike', 'scooter', 'car', 'other'],
        message: 'Type must be bike, scooter, car, or other',
      },
      default: 'car',
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required (e.g. Honda, Hyundai, Tata)'],
      trim: true,
      maxlength: [80, 'Make cannot exceed 80 characters'],
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required (e.g. City, Creta, Activa)'],
      trim: true,
      maxlength: [80, 'Model cannot exceed 80 characters'],
    },
    year: {
      type: Number,
      min: [1970, 'Year must be 1970 or later'],
      max: [new Date().getFullYear() + 2, 'Year cannot be in the distant future'],
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration / plate number is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Registration number cannot exceed 30 characters'],
    },
    fuelType: {
      type: String,
      enum: {
        values: ['petrol', 'diesel', 'CNG', 'electric'],
        message: 'Fuel type must be petrol, diesel, CNG, or electric',
      },
      default: 'petrol',
    },
    tankCapacity: {
      type: Number,
      required: [true, 'Tank capacity is required (litres, or kWh for electric)'],
      min: [0.1, 'Tank capacity must be greater than zero'],
    },
    currentOdometer: {
      type: Number,
      required: [true, 'Current odometer reading is required'],
      min: [0, 'Odometer cannot be negative'],
      default: 0,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ user: 1, isArchived: 1, registrationNumber: 1 });
vehicleSchema.index({ user: 1, nickname: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
