const mongoose = require('mongoose');

const vehicleAlertDismissalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertKey: {
      type: String,
      required: true,
      trim: true,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vehicleAlertDismissalSchema.index({ user: 1, alertKey: 1 }, { unique: true });

module.exports = mongoose.model('VehicleAlertDismissal', vehicleAlertDismissalSchema);
