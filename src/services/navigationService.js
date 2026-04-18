const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const NodeCache = require('node-cache');
const routeCache = new NodeCache({ stdTTL: 120 }); // Reduced TTL for real-time responsiveness

/**
 * Navigation Service
 * Enhanced with Directions Polyline and AI routing insights.
 * @module services/navigationService
 */
class NavigationService {

  /**
   * Calculate traversal cost for a zone
   * Weight = 1 (base distance/hop) + linear density factor if needed
   * @param {string} zoneId - Zone ID
   * @returns {number} The calculated cost to traverse the zone
   */
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 1000; // Impassable fallback
    
    // Restored purely modular logic per problem constraint vs. math.pow penalty
    return 1 + (zone.density / 100) * 10;
  }

  /**
   * Implements Dijkstra's Algorithm for weighted crowd-aware routing.
   * Ensures the suggested route is truly optimized for low-density paths.
   * @param {string} startId - Starting zone ID
   * @param {string} endId - Destination zone ID
   * @returns {Object|null} Optimized path payload or null
   */
  findSmartPath(startId, endId) {
    // Validate inputs
    if (!zones.some(z => z.id === startId) || !zones.some(z => z.id === endId)) {
        return null;
    }

    const cacheKey = `${startId}_to_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, status: 'cached' };

    // Initialize Dijkstra maps
    const distances = {};
    const previous = {};
    const nodes = new Set();

    for (const zoneId in networkGraph) {
      distances[zoneId] = Infinity;
      previous[zoneId] = null;
      nodes.add(zoneId);
    }
    
    if (!distances.hasOwnProperty(startId)) return null;

    distances[startId] = 0;

    // Dijkstra execution
    while (nodes.size > 0) {
      let closestNode = null;
      for (const node of nodes) {
        if (closestNode === null || distances[node] < distances[closestNode]) {
          closestNode = node;
        }
      }

      if (distances[closestNode] === Infinity || closestNode === endId) {
        break;
      }

      nodes.delete(closestNode);

      const neighbors = networkGraph[closestNode] || [];
      for (const neighbor of neighbors) {
        const cost = this.getZoneCost(neighbor);
        const alt = distances[closestNode] + cost;

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = closestNode;
        }
      }
    }

    // Path reconstruction
    const path = [];
    let current = endId;
    while (current) {
      path.unshift(current);
      current = previous[current];
    }

    if (path[0] !== startId) {
      // Fallback: If no path found (disconnected graph scenario)
      googleService.logEvent('WARNING', 'Pathfinding failed due to disconnected zones', { startId, endId });
      return null;
    }

    // Cost evaluation
    let maxDensityEncountered = 0;
    const pathZones = path.map(id => {
      const z = zones.find(zn => zn.id === id);
      if (z && z.density > maxDensityEncountered) maxDensityEncountered = z.density;
      return z;
    });
    
    const totalCost = path.reduce((acc, zid) => acc + this.getZoneCost(zid), 0);
    const mapEnrichment = googleService.generatePathPolyline(path);

    let benefitMessage = "Optimal direct path found.";
    if (maxDensityEncountered > 75) {
      benefitMessage = "Heavy traffic unavoidable. Proceed with caution.";
    } else if (totalCost > path.length * 2.5) {
      benefitMessage = "Re-routed to avoid severe congestion.";
    }

    const result = {
      pathIds: path,
      zones: pathZones,
      cost: parseFloat(totalCost.toFixed(2)),
      maps_data: mapEnrichment,
      benefit: benefitMessage,
      type: 'Weighted Optimality'
    };

    googleService.logEvent('INFO', 'Smart Dijkstra Path Generated', { from: startId, to: endId, cost: totalCost });
    routeCache.set(cacheKey, result);
    return result;
  }
}

module.exports = new NavigationService();
