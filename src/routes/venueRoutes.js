const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');

// Middlewares
const { apiLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validationMiddleware');
const { verifyToken } = require('../middlewares/authMiddleware');

// Controllers
const venueController = require('../controllers/venueController');

/**
 * 1. Crowd Status API
 */
router.get('/crowd', apiLimiter, venueController.getCrowdStatus);

/**
 * 2. Queue Prediction API
 */
router.get('/queue', apiLimiter, venueController.getQueuePredictions);

/**
 * 3. Smart Route Suggestion API
 * Validated inputs to prevent XSS/Injection
 */
router.get('/route', 
  apiLimiter,
  query('from').isString().trim().notEmpty().escape(),
  query('to').isString().trim().notEmpty().escape(),
  validate,
  venueController.getSmartRoute
);

/**
 * 4. Google Assistant AI: Natural Language Query
 * Uses Gemini API for contextual feedback
 */
router.get('/assistant',
  apiLimiter,
  query('q').isString().trim().notEmpty().escape(),
  validate,
  venueController.askAssistant
);

/**
 * 5. Alert Simulation API (FCM Mock provided for flexibility)
 */
router.get('/alert', apiLimiter, verifyToken, venueController.sendAlert);

/**
 * 6. Admin Functionality: Density Update
 */
router.post('/admin/density',
  verifyToken,
  body('zoneId').isString().trim().notEmpty().escape(),
  body('density').isNumeric().isInt({ min: 0, max: 100 }),
  validate,
  venueController.updateDensity
);

module.exports = router;
