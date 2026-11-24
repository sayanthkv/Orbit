const mongoose = require('mongoose');

const vehicleDocumentSchema = new mongoose.Schema(
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
      default: null, // null for user-level documents such as Driving License
      index: true,
    },
    docType: {
      type: String,
      enum: {
        values: [
          'insurance',
          'puc',
          'registration_rc',
          'road_tax',
          'fitness',
          'driving_license',
          'custom',
        ],
        message: 'Invalid document type',
      },
      required: [true, 'Document type is required'],
    },
    customName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Custom name cannot exceed 100 characters'],
    },
    provider: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Provider name cannot exceed 100 characters'],
    },
    policyOrDocNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Document number cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    premiumAmount: {
      type: Number,
      default: 0,
      min: [0, 'Premium cannot be negative'],
    },
    attachment: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      fileType: { type: String, default: null },
    },
    isUserLevel: {
      type: Boolean,
      default: false,
    },
    renewalHistory: [
      {
        renewedAt: { type: Date, default: Date.now },
        previousExpiryDate: Date,
        policyOrDocNumber: String,
        provider: String,
        premiumAmount: Number,
        attachment: Object,
      },
    ],
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

vehicleDocumentSchema.index({ user: 1, vehicle: 1, expiryDate: 1 });
vehicleDocumentSchema.index({ user: 1, isUserLevel: 1, expiryDate: 1 });

module.exports = mongoose.model('VehicleDocument', vehicleDocumentSchema);
