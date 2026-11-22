const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY'],
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    initialBalance: {
      type: Number,
      default: 0,
    },
    hasSetInitialBalance: {
      type: Boolean,
      default: false,
    },
    // Refresh Token Rotation (Phase 9)
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        family: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Two-Factor Authentication (Phase 9)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorBackupCodes: {
      type: [
        {
          codeHash: String,
          used: { type: Boolean, default: false },
        },
      ],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
