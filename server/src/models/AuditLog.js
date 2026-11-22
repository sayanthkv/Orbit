const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGE',
        'PREFERENCES_UPDATE',
        '2FA_SETUP',
        '2FA_ENABLE',
        '2FA_DISABLE',
        'TOKEN_REFRESH',
        'ACCOUNT_DELETE',
        'TRANSACTION_DELETE',
        'CSV_IMPORT',
        'TRANSFER_CREATED',
      ],
      index: true,
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for fast user audit log retrieval sorted by time
auditLogSchema.index({ user: 1, createdAt: -1 });

auditLogSchema.statics.log = async function ({
  user,
  action,
  req = null,
  ip = 'unknown',
  userAgent = 'unknown',
  details = {},
  status = 'SUCCESS',
}) {
  try {
    const clientIp = req ? (req.ip || req.headers['x-forwarded-for'] || 'unknown') : ip;
    const clientAgent = req ? (req.headers['user-agent'] || 'unknown') : userAgent;

    return await this.create({
      user,
      action,
      ip: clientIp,
      userAgent: clientAgent,
      details,
      status,
    });
  } catch (err) {
    // Audit logging should never crash the main request flow
    console.error('AuditLog error:', err.message);
    return null;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
