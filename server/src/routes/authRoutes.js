const express = require('express');
const router = express.Router();
const {
  register,
  login,
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

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/preferences', protect, validate(preferencesSchema), updatePreferences);

module.exports = router;
