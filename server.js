const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const admin = require('firebase-admin');
const { google } = require('googleapis');
require('dotenv').config();

const { globalLimiter } = require('./src/middlewares/rateLimiter');
const { errorHandler, AppError } = require('./src/middlewares/errorHandler');
const venueRoutes = require('./src/routes/venueRoutes');
const googleService = require('./src/services/googleService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Global Rate Limiting
app.use(globalLimiter);

// Security: Helmet for HTTP Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      "img-src": ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://lh3.googleusercontent.com", "https://www.gstatic.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "no-referrer" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

// Body Parsers & Sanitization
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Added urlencoded limit
app.use(express.static('public'));

/**
 * 🔗 Google Services Initialization
 */
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
      databaseURL: JSON.parse(process.env.FIREBASE_CONFIG || '{}').databaseURL
    });
  }
} catch (e) {
  googleService.logEvent('WARNING', 'Firebase init failed in ' + process.env.NODE_ENV + ' mode.');
}

/**
 * 📦 Modular Routing
 */
app.use('/api/venue', venueRoutes);
app.use('/api/calendar', venueRoutes);

/**
 * Handle 404 routes
 */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Venue Engine Running at http://localhost:${PORT}`);
  });
}

module.exports = app;
