const { zones } = require('../data/venueData');

/**
 * Queue Service
 * Improved weight logic for wait-time predictions in venue zones.
 * @module services/queueService
 */
class QueueService {

  /**
   * Calculate prediction (baseWait minutes + exponential density factor)
   * Models realistic crowd buildup where >80% density causes disproportionate delays.
   * @param {string} zoneId - The ID of the zone
   * @returns {Object|null} Wait prediction object
   */
  calculateWait(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return { id: zoneId, estimatedWait: 0, status: 'Unknown', unit: 'min' };

    // Realistic density scaling: Exponential traffic growth when heavily congested
    const densityFactor = zone.density / 100; // 0.0 to 1.0
    // Example formula: baseWait + (density^2 * 40)
    const congestionDelay = Math.pow(densityFactor, 2) * 40; 
    
    // Add real-world variance (bottlenecks)
    const bottleneckFactor = zone.type === 'entry' ? 1.2 : 1.0;
    
    const finalWait = Math.round((zone.baseWait + congestionDelay) * bottleneckFactor);

    return {
      id: zone.id,
      name: zone.name,
      estimatedWait: finalWait,
      unit: 'min',
      status: this.getStatus(finalWait)
    };
  }

  /**
   * Classify wait time severity
   * @param {number} totalWait - Wait time in minutes
   * @returns {string} Severity status
   */
  getStatus(totalWait) {
    if (totalWait >= 30) return 'Heavy';
    if (totalWait >= 15) return 'Moderate';
    return 'Low';
  }

  /**
   * Generate queue prediction report for all zones
   * @returns {Array<Object>} List of zone wait predictions
   */
  getPredictionReport() {
    return zones.map(z => this.calculateWait(z.id));
  }
}

module.exports = new QueueService();
