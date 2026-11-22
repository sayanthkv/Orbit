const express = require('express');
const router = express.Router();
const {
  register,
  login,
  login2FA,
  refreshTokenHandler,
  setup2FA,
  verify2FA,
  disable2FA,
  getAuditLogs,
  demoLogin,
  logout,
  getMe,
  updatePreferences,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  preferencesSchema,
} = require('../validations/authValidation');

// Public auth endpoints
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/login/2fa', login2FA);
router.post('/refresh', refreshTokenHandler);
router.post('/demo', demoLogin);
router.post('/logout', logout);

// Authenticated user endpoints
router.get('/me', protect, getMe);
router.patch('/preferences', protect, validate(preferencesSchema), updatePreferences);

// Two-Factor Authentication (Phase 9)
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

// Audit Logs (Phase 9)
router.get('/audit-logs', protect, getAuditLogs);

module.exports = router;
