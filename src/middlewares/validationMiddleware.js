/**
 * Validation Middleware
 * @module middlewares/validationMiddleware
 */
const { validationResult } = require('express-validator');

/**
 * Handle execution of validation chains
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validate };
