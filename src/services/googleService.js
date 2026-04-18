const { GoogleGenerativeAI } = require("@google/generative-ai");
const { zones } = require('../data/venueData');

/**
 * Enhanced Google Services Orchestrator
 * Integrates Gemini AI, Structured Logging, and Map Directions Logic.
 * @module services/googleService
 */
class GoogleService {
  constructor() {
    this.genAI = null;
    if (process.env.GEMINI_API_KEY) {
       this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
   * Gemini AI Analysis: Natural Language Routing
   * Provides contextual, actionable routing advice.
   * @param {string} query - The user's natural language question
   * @returns {Promise<Object>} AI response or fallback
   */
  async analyzeVenueNeeds(query) {
    if (!this.genAI) return { 
        suggestion: "I'm hungry, take me to seating.", 
        analysis: "[AI Mode: Simulated] AI services are in draft mode. Try using Gate B for less congestion." 
    };

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const currentStats = zones.map(z => `${z.name}: ${z.density}%`).join(', ');
      
      const prompt = `You are an expert Venue AI Assistant for a large sports stadium. 
      A user asks: "${query}". 
      Current Live Zone Densities: ${currentStats}. 
      Task: Recommend a clear, actionable path using specific zone names.
      Constraint 1: Avoid zones with >70% density if possible. If unavoidable, warn the user.
      Constraint 2: Keep the response under 3 sentences. Be extremely helpful and direct.`;

      const result = await model.generateContent(prompt);
      return { analysis: result.response.text(), type: 'AI_DYNAMIC' };
    } catch (err) {
      this.logEvent('ERROR', 'AI reasoning failed', { error: err.message });
      return { error: "AI reasoning failed", fallback: "Try Gate B for lower congestion right now.", type: 'FALLBACK' };
    }
  }

  /**
   * Structured Cloud Logging
   * @param {string} severity - Log severity (INFO, WARNING, ERROR)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   * @returns {Object} Structured log entry
   */
  logEvent(severity, message, metadata = {}) {
    const entry = {
        severity,
        message,
        timestamp: new Date().toISOString(),
        service: 'venue-optimization-engine',
        ...metadata
    };
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[GoogleCloudLogging] [${severity}] ${message}`, JSON.stringify(metadata));
    }
    return entry;
  }

  /**
   * Polyline Simulation for Map Visualization
   * @param {Array<string>} pathIds - List of zones in path
   * @returns {Object} Mock polyline payload
   */
  generatePathPolyline(pathIds) {
    return {
        path: pathIds,
        encoded: "a~l~Fjk~uOnA@wD?gA@yC?gC@gA@yC?", 
        distance: `${pathIds.length * 200}m`,
        duration: `${Math.round(pathIds.length * 1.5)}min`
    };
  }
}

module.exports = new GoogleService();
