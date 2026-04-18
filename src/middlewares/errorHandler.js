/**
 * Centralized Error Handling Middleware
 * Ensures consistent error response formats.
 * @module middlewares/errorHandler
 */

/**
 * Custom AppError for consistent error throwing
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log the error
  const googleService = require('../services/googleService');
  googleService.logEvent(err.isOperational ? 'WARNING' : 'ERROR', err.message, {
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    path: req.path
  });

  res.status(statusCode).json({
    error: 'Venue Engine Exception',
    message: err.message,
    trackingId: Date.now()
  });
};

module.exports = { errorHandler, AppError };
