const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../data/safe_stops_cache.json');

// In-memory LRU-like cache for ultra-fast repeated queries
const memoryCache = new Map();
const MAX_MEM_CACHE = 100;

// Ensure cache file exists
if (!fs.existsSync(CACHE_FILE)) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf8');
  } catch (err) {
    console.error('Failed to initialize safe_stops_cache.json:', err.message);
  }
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const HEADERS = { 'User-Agent': 'SafeRoute-SafeStops/1.0 (Hackathon Navigation Intelligence)' };

/**
 * Calculates haversine distance between two points in meters
 */
function haversineDistanceMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates minimum distance from a POI to the route polyline (in meters),
 * and the approximate cumulative distance along the route.
 * @param {Array<number>} poiCoord [lon, lat]
 * @param {Array<Array<number>>} routeCoords Array of [lon, lat]
 * @param {Array<number>} cumDists Precomputed cumulative distances for route segments
 * @returns {{ minDistance: number, distanceAlongRoute: number }}
 */
function calculateDistanceFromRoute(poiCoord, routeCoords, cumDists = null) {
  if (!routeCoords || routeCoords.length === 0) {
    return { minDistance: Infinity, distanceAlongRoute: 0 };
  }

  const [pLon, pLat] = poiCoord;

  if (routeCoords.length === 1) {
    const d = haversineDistanceMeters(pLon, pLat, routeCoords[0][0], routeCoords[0][1]);
    return { minDistance: Math.round(d), distanceAlongRoute: 0 };
  }

  // Precompute cumulative distances along polyline if not provided
  if (!cumDists) {
    cumDists = [0];
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segDist = haversineDistanceMeters(
        routeCoords[i][0],
        routeCoords[i][1],
        routeCoords[i + 1][0],
        routeCoords[i + 1][1]
      );
      cumDists.push(cumDists[i] + segDist);
    }
  }

  let minDistance = Infinity;
  let bestDistanceAlongRoute = 0;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [aLon, aLat] = routeCoords[i];
    const [bLon, bLat] = routeCoords[i + 1];

    const midLat = ((aLat + bLat) / 2) * (Math.PI / 180);
    const cosMidLat = Math.cos(midLat);

    // Flat earth projection in meters relative to point A
    const dx = (bLon - aLon) * cosMidLat * 111320;
    const dy = (bLat - aLat) * 110540;
    const px = (pLon - aLon) * cosMidLat * 111320;
    const py = (pLat - aLat) * 110540;

    const segLenSq = dx * dx + dy * dy;
    let t = 0;

    if (segLenSq > 0.0001) {
      t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
    }

    const closestLon = aLon + t * (bLon - aLon);
    const closestLat = aLat + t * (bLat - aLat);

    const dist = haversineDistanceMeters(pLon, pLat, closestLon, closestLat);

    if (dist < minDistance) {
      minDistance = dist;
      const segLength = cumDists[i + 1] - cumDists[i];
      bestDistanceAlongRoute = cumDists[i] + t * segLength;
    }
  }

  return {
    minDistance: Math.round(minDistance),
    distanceAlongRoute: Math.round(bestDistanceAlongRoute)
  };
}

/**
 * Normalizes OSM elements into application-friendly categories
 * Categories: cafe | restaurant | hotel | hospital | police | pharmacy | fuel | atm | shop
 */
function normalizeCategory(tags = {}) {
  const amenity = (tags.amenity || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();
  const healthcare = (tags.healthcare || '').toLowerCase();
  const emergency = (tags.emergency || '').toLowerCase();

  // 1. Police & Law Enforcement
  if (amenity === 'police' || emergency === 'police') {
    return 'police';
  }

  // 2. Hospital & Medical Emergency
  if (
    amenity === 'hospital' ||
    amenity === 'clinic' ||
    amenity === 'doctors' ||
    healthcare === 'hospital' ||
    healthcare === 'clinic'
  ) {
    return 'hospital';
  }

  // 3. Pharmacy & Medicine
  if (amenity === 'pharmacy' || healthcare === 'pharmacy') {
    return 'pharmacy';
  }

  // 4. Fuel & Gas Stations
  if (amenity === 'fuel') {
    return 'fuel';
  }

  // 5. ATMs & Banking
  if (amenity === 'atm' || amenity === 'bank') {
    return 'atm';
  }

  // 6. Cafes & Coffee
  if (amenity === 'cafe') {
    return 'cafe';
  }

  // 7. Restaurants & Eateries
  if (
    amenity === 'restaurant' ||
    amenity === 'fast_food' ||
    amenity === 'food_court'
  ) {
    return 'restaurant';
  }

  // 8. Hotels & Accommodation
  if (
    tourism === 'hotel' ||
    tourism === 'guest_house' ||
    tourism === 'motel' ||
    tourism === 'hostel' ||
    tourism === 'apartment' ||
    amenity === 'hotel'
  ) {
    return 'hotel';
  }

  // 9. Shops & Convenience
  if (tags.shop || amenity === 'marketplace') {
    return 'shop';
  }

  return null;
}

/**
 * Normalizes an OSM element to a clean POI object
 */
function normalizePOI(element, routeCoords, cumDists) {
  const tags = element.tags || {};
  const category = normalizeCategory(tags);
  if (!category) return null;

  const lat = element.lat !== undefined ? element.lat : element.center?.lat;
  const lon = element.lon !== undefined ? element.lon : element.center?.lon;

  if (lat === undefined || lon === undefined) return null;

  const { minDistance, distanceAlongRoute } = calculateDistanceFromRoute(
    [lon, lat],
    routeCoords,
    cumDists
  );

  // Generate fallback name based on category if name tag is empty
  const defaultNames = {
    cafe: 'Local Cafe',
    restaurant: 'Restaurant / Eatery',
    hotel: 'Hotel / Lodging',
    hospital: 'Hospital / Medical Center',
    police: 'Police Station',
    pharmacy: 'Pharmacy / Chemist',
    fuel: 'Fuel Station',
    atm: 'ATM / Cash Point',
    shop: tags.shop ? `${tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1)} Store` : 'Convenience Store'
  };

  const name =
    tags.name ||
    tags['name:en'] ||
    tags.brand ||
    tags.operator ||
    defaultNames[category];

  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:district'],
    tags['addr:city']
  ]
    .filter(Boolean)
    .join(', ') || null;

  return {
    id: `${element.type || 'node'}-${element.id}`,
    name,
    category,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    distanceFromRoute: minDistance, // in meters
    distanceAlongRoute: distanceAlongRoute, // in meters from route origin
    tags: {
      brand: tags.brand || null,
      openingHours: tags.opening_hours || null,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      address,
      cuisine: tags.cuisine || null,
      wheelchair: tags.wheelchair || null
    }
  };
}

/**
 * Deduplicates POIs based on ID and spatial proximity + name
 */
function deduplicatePOIs(pois) {
  const seenIds = new Set();
  const seenSpatial = new Set();
  const unique = [];

  for (const poi of pois) {
    if (!poi) continue;

    // Check unique OSM id
    if (seenIds.has(poi.id)) continue;
    seenIds.add(poi.id);

    // Check spatial proximity (~20m) with identical name and category
    const spatialKey = `${poi.category}-${poi.latitude.toFixed(4)},${poi.longitude.toFixed(4)}-${(poi.name || '').toLowerCase()}`;
    if (seenSpatial.has(spatialKey)) continue;
    seenSpatial.add(spatialKey);

    unique.push(poi);
  }

  return unique;
}

/**
 * Groups and counts POIs by category
 */
function groupPOIsByCategory(pois) {
  const summary = {
    total: pois.length,
    cafe: 0,
    restaurant: 0,
    hotel: 0,
    hospital: 0,
    police: 0,
    pharmacy: 0,
    fuel: 0,
    atm: 0,
    shop: 0
  };

  for (const poi of pois) {
    if (summary[poi.category] !== undefined) {
      summary[poi.category]++;
    }
  }

  return summary;
}

/**
 * Finds the nearest emergency and essential POIs from the list
 */
function extractHighlights(pois) {
  const highlights = {
    nearestEmergency: null,
    nearestHospital: null,
    nearestPolice: null,
    nearestPharmacy: null,
    nearestBreak: null,
    nearestFuel: null
  };

  const sortedByDist = [...pois].sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

  for (const poi of sortedByDist) {
    if (poi.category === 'police' && !highlights.nearestPolice) {
      highlights.nearestPolice = poi;
    }
    if (poi.category === 'hospital' && !highlights.nearestHospital) {
      highlights.nearestHospital = poi;
    }
    if (poi.category === 'pharmacy' && !highlights.nearestPharmacy) {
      highlights.nearestPharmacy = poi;
    }
    if ((poi.category === 'cafe' || poi.category === 'restaurant') && !highlights.nearestBreak) {
      highlights.nearestBreak = poi;
    }
    if (poi.category === 'fuel' && !highlights.nearestFuel) {
      highlights.nearestFuel = poi;
    }
  }

  if (highlights.nearestPolice && highlights.nearestHospital) {
    highlights.nearestEmergency =
      highlights.nearestPolice.distanceFromRoute < highlights.nearestHospital.distanceFromRoute
        ? highlights.nearestPolice
        : highlights.nearestHospital;
  } else {
    highlights.nearestEmergency = highlights.nearestPolice || highlights.nearestHospital;
  }

  return highlights;
}

/**
 * Main Service Method: Fetches and analyzes Safe Stops along a route geometry
 * @param {Array<Array<number>>|Object} routeGeometry GeoJSON geometry or coordinates array
 * @param {number} radius Corridor buffer distance in meters (default: 500)
 * @returns {Promise<Object>} Categorized Safe Stops and summary
 */
async function getRouteSafeStops(routeGeometry, radius = 500) {
  // Extract coordinates array
  let coordinates = [];
  if (Array.isArray(routeGeometry)) {
    coordinates = routeGeometry;
  } else if (routeGeometry && Array.isArray(routeGeometry.coordinates)) {
    coordinates = routeGeometry.coordinates;
  }

  if (!coordinates || coordinates.length === 0) {
    return {
      success: true,
      radius,
      summary: { total: 0, cafe: 0, restaurant: 0, hotel: 0, hospital: 0, police: 0, pharmacy: 0, fuel: 0, atm: 0, shop: 0 },
      stops: [],
      highlights: {}
    };
  }

  // Clamp radius to sensible corridor bounds (50m to 2000m)
  const safeRadius = Math.max(50, Math.min(2000, parseInt(radius, 10) || 500));

  // Compute route bounding box with padding
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const coord of coordinates) {
    const [lon, lat] = coord;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Corridor padding in degrees (~111km per deg lat)
  const padDegrees = (safeRadius / 111000) + 0.005;
  const bboxMinLat = (minLat - padDegrees).toFixed(4);
  const bboxMinLon = (minLon - padDegrees).toFixed(4);
  const bboxMaxLat = (maxLat + padDegrees).toFixed(4);
  const bboxMaxLon = (maxLon + padDegrees).toFixed(4);

  const gridKey = `safestops_${bboxMinLat},${bboxMinLon},${bboxMaxLat},${bboxMaxLon}`;

  // 1. Check in-memory cache
  if (memoryCache.has(gridKey)) {
    console.log(`[SafeStops Memory Cache Hit] ${gridKey}`);
    const cachedElements = memoryCache.get(gridKey);
    return processOsmElements(cachedElements, coordinates, safeRadius);
  }

  // 2. Check file cache
  let fileCache = {};
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fileCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8') || '{}');
    }
  } catch (e) {
    fileCache = {};
  }

  if (fileCache[gridKey] && Array.isArray(fileCache[gridKey])) {
    console.log(`[SafeStops File Cache Hit] ${gridKey}`);
    memoryCache.set(gridKey, fileCache[gridKey]);
    return processOsmElements(fileCache[gridKey], coordinates, safeRadius);
  }

  // 3. Query Overpass API with mirror fallbacks
  const bboxStr = `${bboxMinLat},${bboxMinLon},${bboxMaxLat},${bboxMaxLon}`;
  console.log(`[SafeStops Querying OSM] BBox: ${bboxStr} (Corridor: ${safeRadius}m)`);

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|restaurant|fast_food|food_court|hospital|clinic|doctors|police|pharmacy|fuel|atm|bank"](${bboxStr});
      node["tourism"~"hotel|guest_house|motel|hostel|apartment"](${bboxStr});
      node["shop"](${bboxStr});
      way["amenity"~"hospital|clinic|police|fuel"](${bboxStr});
      way["tourism"~"hotel|guest_house|motel|hostel"](${bboxStr});
    );
    out center 600;
  `;

  const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  let elements = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(
        endpoint,
        `data=${encodeURIComponent(query)}`,
        {
          headers: HEADERS,
          timeout: 6000
        }
      );
      if (response.data && Array.isArray(response.data.elements)) {
        elements = response.data.elements;
        break; // Successfully fetched from mirror
      }
    } catch (error) {
      // Try next mirror
    }
  }

  // Save to cache if found
  if (elements.length > 0) {
    memoryCache.set(gridKey, elements);
    if (memoryCache.size > MAX_MEM_CACHE) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }
    fileCache[gridKey] = elements;
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(fileCache, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write safe_stops_cache.json:', err.message);
    }
  }

  return processOsmElements(elements, coordinates, safeRadius);
}

/**
 * Processes raw OSM elements against route geometry:
 * - Calculates distance from polyline
 * - Filters by corridor radius
 * - Deduplicates
 * - Computes categories and summaries
 */
function processOsmElements(elements, coordinates, radius) {
  // Precompute cumulative distances along route polyline
  const cumDists = [0];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const segDist = haversineDistanceMeters(
      coordinates[i][0],
      coordinates[i][1],
      coordinates[i + 1][0],
      coordinates[i + 1][1]
    );
    cumDists.push(cumDists[i] + segDist);
  }

  const rawPois = [];
  for (const el of elements) {
    const poi = normalizePOI(el, coordinates, cumDists);
    if (poi && poi.distanceFromRoute <= radius) {
      rawPois.push(poi);
    }
  }

  // Deduplicate
  const uniquePois = deduplicatePOIs(rawPois);

  // Sort by journey distance (distance along route from start)
  uniquePois.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

  const summary = groupPOIsByCategory(uniquePois);
  const highlights = extractHighlights(uniquePois);

  return {
    success: true,
    radius,
    summary,
    stops: uniquePois,
    highlights
  };
}

module.exports = {
  getRouteSafeStops,
  calculateDistanceFromRoute,
  normalizeCategory,
  normalizePOI,
  deduplicatePOIs,
  groupPOIsByCategory,
  haversineDistanceMeters
};
