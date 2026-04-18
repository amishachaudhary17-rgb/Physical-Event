/**
 * Centralized Rate Limiter Setup
 * @module middlewares/rateLimiter
 */
const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter to prevent DDoS and abuse.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

/**
 * Stricter API specific rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests, please try again later.' }
});

module.exports = { globalLimiter, apiLimiter };
