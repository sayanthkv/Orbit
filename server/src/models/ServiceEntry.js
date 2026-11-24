const mongoose = require('mongoose');

const serviceEntrySchema = new mongoose.Schema(
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
    serviceType: {
      type: String,
      enum: {
        values: [
          'general service',
          'oil change',
          'tyre',
          'battery',
          'brake',
          'chain/belt',
          'air filter',
          'repair',
          'wash',
          'other',
        ],
        message: 'Invalid service type',
      },
      default: 'general service',
      required: [true, 'Service type is required'],
    },
    workshop: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Workshop name cannot exceed 100 characters'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    partsOrNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    receipt: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      fileType: { type: String, default: null },
    },
    nextDueKm: {
      type: Number,
      default: null,
    },
    nextDueDate: {
      type: Date,
      default: null,
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

serviceEntrySchema.index({ user: 1, vehicle: 1, date: -1 });

module.exports = mongoose.model('ServiceEntry', serviceEntrySchema);
