/**
 * Authentication Middleware
 * @module middlewares/authMiddleware
 */
const admin = require('firebase-admin');
const { AppError } = require('./errorHandler');

/**
 * Middleware to verify Firebase Auth Tokens
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const verifyToken = async (req, res, next) => {
  // Try to get token from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return unauthorized
    // If not strict mode, allow for local demo
    if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
       return next();
    }
    return next(new AppError('No token provided, authorization denied.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
    } else {
      // Dummy check for testing purposes
      req.user = { uid: 'mock-user-id', email: 'test@example.com' };
    }
    next();
  } catch (err) {
    return next(new AppError('Invalid token.', 403));
  }
};

module.exports = { verifyToken };
