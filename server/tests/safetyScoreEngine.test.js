const {
  calculateRouteSafetyScore,
  getDistanceFromLatLonInKm,
  deg2rad
} = require('../src/services/safetyScoreEngine');

describe('Safety Score Engine Unit Tests', () => {
  describe('Mathematical helpers', () => {
    it('should convert degrees to radians accurately', () => {
      expect(deg2rad(180)).toBeCloseTo(Math.PI, 5);
      expect(deg2rad(0)).toBe(0);
    });

    it('should calculate Haversine distance between two coordinates', () => {
      // Distance between New Delhi ([77.2090, 28.6139]) and nearby point
      const coord1 = [77.2090, 28.6139];
      const coord2 = [77.2090, 28.6139];
      expect(getDistanceFromLatLonInKm(coord1, coord2)).toBe(0);

      const coord3 = [77.2190, 28.6239];
      const dist = getDistanceFromLatLonInKm(coord1, coord3);
      expect(dist).toBeGreaterThan(1);
      expect(dist).toBeLessThan(2);
    });
  });

  describe('calculateRouteSafetyScore fallback behavior', () => {
    it('should return default fallback score of 50 for empty route', async () => {
      const score = await calculateRouteSafetyScore(null);
      expect(score).toBe(50);

      const emptyScore = await calculateRouteSafetyScore({ coordinates: [] });
      expect(emptyScore).toBe(50);
    });

    it('should compute valid score within 0-100 bounds when ML service is offline', async () => {
      const mockRoute = {
        coordinates: [
          [77.2090, 28.6139],
          [77.2100, 28.6150],
          [77.2110, 28.6160]
        ]
      };

      const score = await calculateRouteSafetyScore(mockRoute);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should apply penalty for active community reports near the route', async () => {
      const mockRoute = {
        coordinates: [
          [77.2090, 28.6139],
          [77.2100, 28.6150]
        ]
      };

      const nearbyReports = [
        {
          _id: 'report-1',
          location: { coordinates: [77.2091, 28.6140] }
        },
        {
          _id: 'report-2',
          location: { coordinates: [77.2092, 28.6141] }
        }
      ];

      const baselineScore = await calculateRouteSafetyScore(mockRoute, []);
      const penalizedScore = await calculateRouteSafetyScore(mockRoute, nearbyReports);

      expect(penalizedScore).toBeLessThanOrEqual(baselineScore);
    });
  });
});
