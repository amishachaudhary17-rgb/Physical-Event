/**
 * Venue Controller
 * Handles business logic for venue-related endpoints.
 * @module controllers/venueController
 */
const navService = require('../services/navigationService');
const queueService = require('../services/queueService');
const googleService = require('../services/googleService');
const { zones } = require('../data/venueData');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Get crowd reports
 */
const getCrowdStatus = (req, res, next) => {
  try {
    const report = zones.map(z => ({
      id: z.id,
      name: z.name,
      density: z.density,
      status: z.density > 80 ? 'High' : (z.density > 40 ? 'Medium' : 'Low')
    }));
    res.json(report);
  } catch (err) {
    next(new AppError("Internal server error fetching crowd data", 500));
  }
};

/**
 * Get queue predictions
 */
const getQueuePredictions = (req, res, next) => {
  try {
    const report = queueService.getPredictionReport();
    res.json(report);
  } catch (err) {
    next(new AppError("Internal server error fetching queue prediction", 500));
  }
};

/**
 * Smart Route Suggestion
 */
const getSmartRoute = (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = navService.findSmartPath(from, to);
    
    if (!result) {
       return next(new AppError("Path not found for specified zones.", 404));
    }
    
    res.json(result);
  } catch (err) {
    next(new AppError("Internal server error calculating route", 500));
  }
};

/**
 * General Natural Language AI Assistant
 */
const askAssistant = async (req, res, next) => {
  try {
      const result = await googleService.analyzeVenueNeeds(req.query.q);
      res.json(result);
  } catch (err) {
      next(new AppError("AI Assistant failed", 500));
  }
};

/**
 * Alert Simulation
 */
const sendAlert = (req, res) => {
  const alert = {
      title: "⚠️ Congestion Update",
      message: "Notice: Food Court is currently at max capacity (95%). Use East Concourse for quick transit.",
      affected: "food_court"
  };
  res.json({ status: "Alert Sent", via: "Service Mock", alert });
};

/**
 * Update Density (Admin)
 */
const updateDensity = (req, res, next) => {
  try {
    const { zoneId, density } = req.body;
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return next(new AppError("Zone not found", 404));
    
    // Update live memory
    zone.density = density;
    res.json({ success: true, updatedZone: zone });
  } catch (err) {
    next(new AppError("Failed to update density", 500));
  }
};

module.exports = {
  getCrowdStatus,
  getQueuePredictions,
  getSmartRoute,
  askAssistant,
  sendAlert,
  updateDensity
};
