const {
  calculateDistanceFromRoute,
  normalizeCategory,
  normalizePOI,
  deduplicatePOIs,
  groupPOIsByCategory,
  haversineDistanceMeters
} = require('../src/services/safeStopsService');

describe('Safe Stops Service Unit Tests', () => {
  const routeCoords = [
    [77.2090, 28.6139], // Point A (Connaught Place area)
    [77.2150, 28.6200], // Point B
    [77.2200, 28.6300]  // Point C
  ];

  describe('Haversine & Distance Calculations', () => {
    it('should calculate distance between two identical points as 0', () => {
      const dist = haversineDistanceMeters(77.2090, 28.6139, 77.2090, 28.6139);
      expect(dist).toBe(0);
    });

    it('should calculate distance between Delhi points reasonably', () => {
      const dist = haversineDistanceMeters(77.2090, 28.6139, 77.2150, 28.6200);
      expect(dist).toBeGreaterThan(800);
      expect(dist).toBeLessThan(1200);
    });

    it('should accurately calculate perpendicular distance from route polyline', () => {
      // POI directly on the first segment
      const midLon = (77.2090 + 77.2150) / 2;
      const midLat = (28.6139 + 28.6200) / 2;
      const { minDistance } = calculateDistanceFromRoute([midLon, midLat], routeCoords);
      expect(minDistance).toBeLessThan(5); // Within 5 meters
    });

    it('should calculate distance for a POI offset from the route', () => {
      // Offset by ~0.001 deg (~100m)
      const poiLon = 77.2090 + 0.001;
      const poiLat = 28.6139;
      const { minDistance, distanceAlongRoute } = calculateDistanceFromRoute([poiLon, poiLat], routeCoords);
      expect(minDistance).toBeGreaterThan(50);
      expect(minDistance).toBeLessThan(150);
      expect(distanceAlongRoute).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Category Normalization', () => {
    it('should correctly normalize various OSM amenity and tourism tags', () => {
      expect(normalizeCategory({ amenity: 'cafe' })).toBe('cafe');
      expect(normalizeCategory({ amenity: 'restaurant' })).toBe('restaurant');
      expect(normalizeCategory({ amenity: 'fast_food' })).toBe('restaurant');
      expect(normalizeCategory({ tourism: 'hotel' })).toBe('hotel');
      expect(normalizeCategory({ tourism: 'hostel' })).toBe('hotel');
      expect(normalizeCategory({ amenity: 'hospital' })).toBe('hospital');
      expect(normalizeCategory({ amenity: 'clinic' })).toBe('hospital');
      expect(normalizeCategory({ amenity: 'police' })).toBe('police');
      expect(normalizeCategory({ amenity: 'pharmacy' })).toBe('pharmacy');
      expect(normalizeCategory({ amenity: 'fuel' })).toBe('fuel');
      expect(normalizeCategory({ amenity: 'atm' })).toBe('atm');
      expect(normalizeCategory({ amenity: 'bank' })).toBe('atm');
      expect(normalizeCategory({ shop: 'supermarket' })).toBe('shop');
      expect(normalizeCategory({ shop: 'convenience' })).toBe('shop');
      expect(normalizeCategory({ amenity: 'bench' })).toBeNull();
    });
  });

  describe('POI Normalization and Deduplication', () => {
    it('should normalize an OSM node element properly', () => {
      const element = {
        type: 'node',
        id: 101,
        lat: 28.6140,
        lon: 77.2091,
        tags: {
          name: 'Blue Tokai Coffee',
          amenity: 'cafe',
          'addr:street': 'Connaught Circus',
          opening_hours: '08:00-22:00'
        }
      };

      const poi = normalizePOI(element, routeCoords);
      expect(poi).not.toBeNull();
      expect(poi.id).toBe('node-101');
      expect(poi.name).toBe('Blue Tokai Coffee');
      expect(poi.category).toBe('cafe');
      expect(poi.tags.openingHours).toBe('08:00-22:00');
      expect(poi.distanceFromRoute).toBeLessThan(50);
    });

    it('should deduplicate POIs with same ID or identical location/name', () => {
      const pois = [
        { id: 'node-1', category: 'cafe', name: 'Cafe A', latitude: 28.6140, longitude: 77.2090 },
        { id: 'node-1', category: 'cafe', name: 'Cafe A', latitude: 28.6140, longitude: 77.2090 },
        { id: 'way-2', category: 'cafe', name: 'Cafe A', latitude: 28.61401, longitude: 77.20901 },
        { id: 'node-3', category: 'hospital', name: 'City Hospital', latitude: 28.6150, longitude: 77.2100 }
      ];

      const deduped = deduplicatePOIs(pois);
      expect(deduped.length).toBe(2);
      expect(deduped.map(p => p.id)).toEqual(['node-1', 'node-3']);
    });

    it('should group POIs by category correctly', () => {
      const pois = [
        { category: 'cafe' },
        { category: 'cafe' },
        { category: 'restaurant' },
        { category: 'hospital' },
        { category: 'police' }
      ];

      const summary = groupPOIsByCategory(pois);
      expect(summary.total).toBe(5);
      expect(summary.cafe).toBe(2);
      expect(summary.restaurant).toBe(1);
      expect(summary.hospital).toBe(1);
      expect(summary.police).toBe(1);
      expect(summary.pharmacy).toBe(0);
    });
  });
});
