// Recursive cleaner for NoSQL injection prevention ($ and . keys)
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    const sanitizedVal = sanitizeObject(value);
    // If the value was an object whose dangerous keys were all stripped leaving it empty, drop it
    if (
      sanitizedVal &&
      typeof sanitizedVal === 'object' &&
      !Array.isArray(sanitizedVal) &&
      Object.keys(sanitizedVal).length === 0 &&
      Object.keys(value || {}).length > 0
    ) {
      continue;
    }
    clean[key] = sanitizedVal;
  }
  return clean;
};

const sanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitize;
module.exports.sanitizeObject = sanitizeObject;
