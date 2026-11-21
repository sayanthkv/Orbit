const mongoose = require('mongoose');

/**
 * Recursively sanitize objects to prevent MongoDB NoSQL query injection
 * Strips any object key starting with '$' or containing '.'
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    // Strip keys starting with $ (MongoDB query operators like $gt, $where, $ne) or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = typeof val === 'object' && val !== null ? sanitize(val) : val;
  }
  return clean;
};

/**
 * Middleware: Sanitize req.body, req.query, and req.params
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  next();
};

/**
 * Middleware: Prevent HTTP Parameter Pollution (HPP)
 * Ensures single values for query parameters unless explicitly whitelisted
 */
const preventHPP = (whitelist = []) => {
  return (req, res, next) => {
    if (req.query) {
      for (const [key, val] of Object.entries(req.query)) {
        if (Array.isArray(val) && !whitelist.includes(key)) {
          // Keep only the last parameter value
          req.query[key] = val[val.length - 1];
        }
      }
    }
    next();
  };
};

/**
 * Middleware: Validate Mongoose ObjectId in URL parameters
 * Prevents Unhandled Mongoose CastError 500s when malicious/garbage IDs are provided
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format for parameter '${paramName}'. Must be a 24-character hexadecimal ObjectId.`,
      });
    }
    next();
  };
};

module.exports = {
  sanitizeInputs,
  preventHPP,
  validateObjectId,
};
