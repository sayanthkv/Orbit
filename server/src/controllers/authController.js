const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Recurring = require('../models/Recurring');
const Goal = require('../models/Goal');
const AuditLog = require('../models/AuditLog');
const { processDueRecurringTransactions } = require('../services/cronService');
const {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUrl,
  generateBackupCodes,
  verifyBackupCode,
} = require('../utils/totp');

const getCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction ? true : process.env.COOKIE_SECURE === 'true',
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
};

const signToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_orbit_jwt_key_development_change_in_production',
    { expiresIn }
  );
};

const signTempToken = (userId) => {
  return jwt.sign(
    { id: userId, is2FA: true },
    process.env.JWT_SECRET || 'super_secret_orbit_jwt_key_development_change_in_production',
    { expiresIn: '5m' }
  );
};

/**
 * Creates and persists a new refresh token family or rotates within an existing family
 */
const issueTokens = async (user, existingFamily = null) => {
  const family = existingFamily || crypto.randomUUID();
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const accessToken = signToken(user._id, '1h');

  // Push new token to user refreshTokens array and clean up expired tokens
  user.refreshTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash,
    family,
    expiresAt,
    createdAt: new Date(),
  });

  if (user.refreshTokens.length > 20) {
    user.refreshTokens = user.refreshTokens.slice(-20);
  }

  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    family,
  };
};

/**
 * Issue or rotate a trusted device token for one-click passwordless return
 */
const issueDeviceToken = async (user) => {
  const rawDeviceToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawDeviceToken).digest('hex');
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  user.deviceTokens = (user.deviceTokens || []).filter((d) => d.expiresAt > new Date());
  user.deviceTokens.push({
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  if (user.deviceTokens.length > 10) {
    user.deviceTokens = user.deviceTokens.slice(-10);
  }

  await user.save({ validateBeforeSave: false });
  return rawDeviceToken;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      currency: currency || 'INR',
    });

    const { accessToken, refreshToken } = await issueTokens(user);
    const deviceToken = await issueDeviceToken(user);
    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(90 * 24 * 60 * 60 * 1000));

    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      req,
      details: { method: 'register' },
    });

    // Trigger catch-up on due recurring transactions in background
    processDueRecurringTransactions(user._id).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to Orbit!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          themePreference: user.themePreference,
          twoFactorEnabled: user.twoFactorEnabled,
          initialBalance: user.initialBalance || 0,
          hasSetInitialBalance: !!user.hasSetInitialBalance,
          createdAt: user.createdAt,
        },
        token: accessToken,
        refreshToken,
        deviceToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.log({
        user: user._id,
        action: 'LOGIN_FAILED',
        req,
        status: 'FAILED',
        details: { reason: 'bad_password' },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      const tempToken = signTempToken(user._id);
      return res.status(200).json({
        success: true,
        requires2FA: true,
        message: '2FA authentication required.',
        data: {
          tempToken,
          email: user.email,
        },
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    const deviceToken = await issueDeviceToken(user);
    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(90 * 24 * 60 * 60 * 1000));

    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      req,
      details: { method: 'password' },
    });

    processDueRecurringTransactions(user._id).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Welcome back!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          themePreference: user.themePreference,
          twoFactorEnabled: user.twoFactorEnabled,
          initialBalance: user.initialBalance || 0,
          hasSetInitialBalance: !!user.hasSetInitialBalance,
          createdAt: user.createdAt,
        },
        token: accessToken,
        refreshToken,
        deviceToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete 2FA Login
// @route   POST /api/auth/login/2fa
// @access  Public (Requires tempToken)
const login2FA = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'tempToken and 6-digit TOTP code or backup code are required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'super_secret_orbit_jwt_key_development_change_in_production'
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: '2FA session expired. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or 2FA not enabled.',
      });
    }

    const cleanCode = String(code).trim().toUpperCase();
    let isCodeValid = false;
    let usedBackup = false;

    // Check TOTP code
    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
      isCodeValid = verifyTOTP(cleanCode, user.twoFactorSecret);
    }

    // If not valid TOTP, check backup code
    if (!isCodeValid && user.twoFactorBackupCodes) {
      const backupIndex = verifyBackupCode(cleanCode, user.twoFactorBackupCodes);
      if (backupIndex !== -1) {
        isCodeValid = true;
        usedBackup = true;
        user.twoFactorBackupCodes[backupIndex].used = true;
      }
    }

    if (!isCodeValid) {
      await AuditLog.log({
        user: user._id,
        action: 'LOGIN_FAILED',
        req,
        status: 'FAILED',
        details: { reason: 'invalid_2fa_code' },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code or backup code.',
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    const deviceToken = await issueDeviceToken(user);
    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(90 * 24 * 60 * 60 * 1000));

    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      req,
      details: { method: usedBackup ? '2fa_backup_code' : '2fa_totp' },
    });

    processDueRecurringTransactions(user._id).catch(() => {});

    res.status(200).json({
      success: true,
      message: '2FA authentication successful. Welcome back!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          themePreference: user.themePreference,
          twoFactorEnabled: user.twoFactorEnabled,
          initialBalance: user.initialBalance || 0,
          hasSetInitialBalance: !!user.hasSetInitialBalance,
          createdAt: user.createdAt,
        },
        token: accessToken,
        refreshToken,
        deviceToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rotate Refresh Token
// @route   POST /api/auth/refresh
// @access  Public (Cookie or Body)
const refreshTokenHandler = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is missing.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Find user with this token
    const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please sign in again.',
      });
    }

    const matchingToken = user.refreshTokens.find((t) => t.tokenHash === tokenHash);

    if (matchingToken.expiresAt < new Date()) {
      user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please sign in again.',
      });
    }

    // Remove old token and issue new pair in same family
    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
    const { accessToken, refreshToken } = await issueTokens(user, matchingToken.family);

    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    await AuditLog.log({
      user: user._id,
      action: 'TOKEN_REFRESH',
      req,
      details: { family: matchingToken.family },
    });

    res.status(200).json({
      success: true,
      message: 'Tokens rotated successfully.',
      data: {
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Setup 2FA - Generate Secret and QR Code URI
// @route   POST /api/auth/2fa/setup
// @access  Private
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const secret = generateSecret();
    const otpAuthUrl = getOtpAuthUrl(secret, user.email, 'Orbit');
    const { codes, hashedCodes } = generateBackupCodes(8);

    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = hashedCodes;
    await user.save({ validateBeforeSave: false });

    await AuditLog.log({
      user: user._id,
      action: '2FA_SETUP',
      req,
    });

    res.status(200).json({
      success: true,
      message: '2FA secret generated. Scan QR code and verify to activate.',
      data: {
        secret,
        otpAuthUrl,
        backupCodes: codes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and activate 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: '6-digit verification code is required.',
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please initiate 2FA setup first.',
      });
    }

    const isValid = verifyTOTP(token, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code. Please check your authenticator app and try again.',
      });
    }

    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    await AuditLog.log({
      user: user._id,
      action: '2FA_ENABLE',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication successfully enabled!',
      data: {
        twoFactorEnabled: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res, next) => {
  try {
    const { password, token } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash +twoFactorSecret');

    let authorized = false;
    if (password) {
      authorized = await user.comparePassword(password);
    } else if (token && user.twoFactorSecret) {
      authorized = verifyTOTP(token, user.twoFactorSecret);
    }

    if (!authorized) {
      return res.status(400).json({
        success: false,
        message: 'Password or valid 2FA code required to disable 2FA.',
      });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save({ validateBeforeSave: false });

    await AuditLog.log({
      user: user._id,
      action: '2FA_DISABLE',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication has been disabled.',
      data: {
        twoFactorEnabled: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user audit logs
// @route   GET /api/auth/audit-logs
// @access  Private
const getAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const logs = await AuditLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clearOptions = {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction ? true : process.env.COOKIE_SECURE === 'true',
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('token', '', clearOptions);
  res.cookie('refreshToken', '', clearOptions);

  if (req.user?._id) {
    await AuditLog.log({
      user: req.user._id,
      action: 'LOGOUT',
      req,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    data: null,
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved.',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        currency: req.user.currency,
        themePreference: req.user.themePreference,
        twoFactorEnabled: req.user.twoFactorEnabled,
        initialBalance: req.user.initialBalance || 0,
        hasSetInitialBalance: !!req.user.hasSetInitialBalance,
        createdAt: req.user.createdAt,
      },
    },
  });
};

// @desc    Update preferences
// @route   PATCH /api/auth/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
  try {
    const { currency, themePreference, name, initialBalance, hasSetInitialBalance } = req.body;
    const updates = {};
    if (currency) updates.currency = currency;
    if (themePreference) updates.themePreference = themePreference;
    if (name) updates.name = name;
    if (initialBalance !== undefined) {
      updates.initialBalance = Number(initialBalance);
      updates.hasSetInitialBalance = true;
    }
    if (hasSetInitialBalance !== undefined) {
      updates.hasSetInitialBalance = hasSetInitialBalance;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    await AuditLog.log({
      user: req.user._id,
      action: 'PREFERENCES_UPDATE',
      req,
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          currency: updatedUser.currency,
          themePreference: updatedUser.themePreference,
          twoFactorEnabled: updatedUser.twoFactorEnabled,
          initialBalance: updatedUser.initialBalance || 0,
          hasSetInitialBalance: !!updatedUser.hasSetInitialBalance,
          createdAt: updatedUser.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demo Mode Login - Instant seeded access without signup
// @route   POST /api/auth/demo
// @access  Public
const demoLogin = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: 'demo@orbit.finance' });

    if (!user) {
      const passwordHash = await User.hashPassword('DemoPassword123!');
      user = await User.create({
        name: 'Demo Explorer',
        email: 'demo@orbit.finance',
        passwordHash,
        currency: 'INR',
        initialBalance: 95000,
        hasSetInitialBalance: true,
      });

      const hdfc = await Account.create({
        user: user._id,
        name: 'HDFC Salary Account',
        bankName: 'HDFC Bank',
        accountNumber: '4821',
        type: 'bank',
        initialBalance: 85000,
        color: '#004C8F',
        isDefault: true,
      });

      const cash = await Account.create({
        user: user._id,
        name: 'Personal Cash Wallet',
        bankName: 'Cash',
        type: 'cash',
        initialBalance: 10000,
        color: '#10B981',
      });

      const card = await Account.create({
        user: user._id,
        name: 'ICICI Coral Card',
        bankName: 'ICICI Bank',
        accountNumber: '9211',
        type: 'card',
        initialBalance: 0,
        color: '#F37021',
      });

      const foodCat = await Category.create({ user: user._id, name: 'Food & Dining', type: 'expense', color: '#F59E0B', icon: 'Utensils' });
      const travelCat = await Category.create({ user: user._id, name: 'Transport & Fuel', type: 'expense', color: '#3B82F6', icon: 'Car' });
      const entCat = await Category.create({ user: user._id, name: 'Entertainment', type: 'expense', color: '#EC4899', icon: 'Film' });
      const salaryCat = await Category.create({ user: user._id, name: 'Salary & Inflow', type: 'income', color: '#10B981', icon: 'Wallet' });
      const transferCat = await Category.create({ user: user._id, name: 'Transfer', type: 'expense', color: '#8B5CF6', icon: 'ArrowRightLeft' });

      const now = new Date();
      const txs = [
        { user: user._id, type: 'income', amount: 95000, category: salaryCat._id, account: hdfc._id, date: new Date(now.getFullYear(), now.getMonth(), 1), note: 'Monthly Salary Credit', paymentMethod: 'bank' },
        { user: user._id, type: 'transfer', amount: 5000, category: transferCat._id, account: hdfc._id, toAccount: cash._id, date: new Date(now.getFullYear(), now.getMonth(), 3), note: 'ATM Cash Withdrawal', paymentMethod: 'bank' },
        { user: user._id, type: 'expense', amount: 1450, category: foodCat._id, account: hdfc._id, date: new Date(now.getFullYear(), now.getMonth(), 5), note: 'Team Lunch at Barbeque Nation', paymentMethod: 'card' },
        { user: user._id, type: 'expense', amount: 320, category: travelCat._id, account: hdfc._id, date: new Date(now.getFullYear(), now.getMonth(), 8), note: 'Uber to Airport', paymentMethod: 'UPI' },
        { user: user._id, type: 'expense', amount: 649, category: entCat._id, account: card._id, date: new Date(now.getFullYear(), now.getMonth(), 10), note: 'Netflix Premium 4K', paymentMethod: 'card' },
        { user: user._id, type: 'expense', amount: 119, category: entCat._id, account: hdfc._id, date: new Date(now.getFullYear(), now.getMonth(), 12), note: 'Spotify Family Subscription', paymentMethod: 'UPI' },
        { user: user._id, type: 'expense', amount: 180, category: foodCat._id, account: cash._id, date: new Date(now.getFullYear(), now.getMonth(), 14), note: 'Chai & Snacks', paymentMethod: 'cash' },
      ];
      await Transaction.insertMany(txs);

      await Recurring.create({
        user: user._id,
        type: 'expense',
        note: 'Netflix 4K Subscription',
        amount: 649,
        frequency: 'monthly',
        category: entCat._id,
        account: card._id,
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        isActive: true,
      });

      await Budget.create({
        user: user._id,
        category: foodCat._id,
        monthlyLimit: 8000,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      await Goal.create({
        user: user._id,
        title: 'Emergency Rainy Day Fund',
        targetAmount: 150000,
        currentAmount: 65000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 1),
        color: '#10B981',
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Welcome to Orbit Demo Mode!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          themePreference: user.themePreference,
          twoFactorEnabled: user.twoFactorEnabled,
          initialBalance: user.initialBalance || 0,
          hasSetInitialBalance: !!user.hasSetInitialBalance,
          createdAt: user.createdAt,
          isDemo: true,
        },
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    One-click Quick Login with trusted device token (Passwordless)
// @route   POST /api/auth/quick-login
// @access  Public
const quickLogin = async (req, res, next) => {
  try {
    const { email, deviceToken } = req.body;
    if (!email || !deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Email and deviceToken are required for quick login.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      'deviceTokens.tokenHash': tokenHash,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired device session. Please sign in with your password.',
      });
    }

    const deviceRecord = user.deviceTokens.find((d) => d.tokenHash === tokenHash);
    if (!deviceRecord || deviceRecord.expiresAt < new Date()) {
      user.deviceTokens = user.deviceTokens.filter((d) => d.tokenHash !== tokenHash);
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: 'Device session has expired. Please sign in with your password.',
      });
    }

    // Rotate device token and issue fresh access and refresh tokens
    user.deviceTokens = user.deviceTokens.filter((d) => d.tokenHash !== tokenHash);
    const newDeviceToken = crypto.randomBytes(32).toString('hex');
    const newDeviceHash = crypto.createHash('sha256').update(newDeviceToken).digest('hex');
    user.deviceTokens.push({
      tokenHash: newDeviceHash,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      createdAt: new Date(),
    });

    const { accessToken, refreshToken } = await issueTokens(user);
    res.cookie('token', accessToken, getCookieOptions(60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(90 * 24 * 60 * 60 * 1000));

    await user.save({ validateBeforeSave: false });

    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      req,
      details: { method: 'one_click_device_token' },
    });

    processDueRecurringTransactions(user._id).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          themePreference: user.themePreference,
          twoFactorEnabled: user.twoFactorEnabled,
          initialBalance: user.initialBalance || 0,
          hasSetInitialBalance: !!user.hasSetInitialBalance,
          createdAt: user.createdAt,
        },
        token: accessToken,
        refreshToken,
        deviceToken: newDeviceToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  login2FA,
  quickLogin,
  refreshTokenHandler,
  setup2FA,
  verify2FA,
  disable2FA,
  getAuditLogs,
  demoLogin,
  logout,
  getMe,
  updatePreferences,
};
