/**
 * Mock Venue Data & Network Graph
 * Used for simulated crowd tracking and navigation logic.
 */

const zones = [
  { id: 'gate_a', name: 'Main Gate A', density: 85, location: { lat: -37.8206, lng: 144.9834 }, baseWait: 10, type: 'entry' },
  { id: 'gate_b', name: 'North Gate B', density: 20, location: { lat: -37.8190, lng: 144.9845 }, baseWait: 5, type: 'entry' },
  { id: 'concourse_east', name: 'East Concourse', density: 60, location: { lat: -37.8198, lng: 144.9850 }, baseWait: 0, type: 'transit' },
  { id: 'concourse_west', name: 'West Concourse', density: 30, location: { lat: -37.8198, lng: 144.9820 }, baseWait: 0, type: 'transit' },
  { id: 'food_court', name: 'Central Food Court', density: 95, location: { lat: -37.8195, lng: 144.9835 }, baseWait: 15, type: 'lifestyle' },
  { id: 'seating_zone_1', name: 'Lower Tier Seating', density: 40, location: { lat: -37.8200, lng: 144.9835 }, baseWait: 0, type: 'destination' }
];

// Graph represented as adjacency list with weighted edges
// Weight = Distance + (Density Factor * Traffic)
const networkGraph = {
  'gate_a': ['concourse_east', 'concourse_west'],
  'gate_b': ['concourse_east'],
  'concourse_east': ['gate_a', 'gate_b', 'food_court', 'seating_zone_1'],
  'concourse_west': ['gate_a', 'seating_zone_1'],
  'food_court': ['concourse_east'],
  'seating_zone_1': ['concourse_east', 'concourse_west']
};

module.exports = { zones, networkGraph };
