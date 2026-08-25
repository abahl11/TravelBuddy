// server/utils/geocodingUtils.js
const axios = require('axios');

const GEOAPIFY_BASE = 'https://api.geoapify.com/v1/geocode';
const EARTH_RADIUS_KM = 6371;

const apiKey = () => process.env.GEOAPIFY_API_KEY || '';

/** Whether server-side geocoding is available at all. */
const isGeocodingEnabled = () => Boolean(apiKey());

/**
 * Small in-memory cache.
 *
 * Autocomplete fires on nearly every keystroke and the same prefixes repeat
 * constantly ("del", "delh", "delhi"), so caching is what keeps a 3,000/day
 * free tier comfortable. Bounded so it cannot grow without limit.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map();

const cacheGet = (key) => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  // Refresh insertion order so the most recently used entries survive eviction.
  cache.delete(key);
  cache.set(key, entry);

  return entry.value;
};

const cacheSet = (key, value) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the least recent.
    cache.delete(cache.keys().next().value);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** Trims Geoapify's response down to what the client actually renders. */
const normalise = (result, index) => {
  const lat = Number(result.lat);
  const lng = Number(result.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: result.place_id || `${lat},${lng},${index}`,
    name: result.city || result.name || result.address_line1 || result.formatted,
    label: result.formatted || [result.city, result.state, result.country].filter(Boolean).join(', '),
    context: [result.state, result.country].filter(Boolean).join(', '),
    lat,
    lng,
  };
};

/**
 * City-level autocomplete.
 *
 * @param {string} text - Partial place name.
 * @param {{ limit?: number, countryCode?: string }} [options]
 * @returns {Promise<Array<{id,name,label,context,lat,lng}>>} Empty when
 *   geocoding is not configured, so callers degrade instead of failing.
 */
const autocomplete = async (text, { limit = 5, countryCode } = {}) => {
  if (!isGeocodingEnabled()) return [];

  const query = text.trim();

  if (query.length < 2) return [];

  const cacheKey = `${query.toLowerCase()}|${limit}|${countryCode || ''}`;
  const cached = cacheGet(cacheKey);

  if (cached) return cached;

  const params = {
    text: query,
    apiKey: apiKey(),
    limit,
    // City-level only: this app matches people on routes between towns, and
    // narrowing the type keeps the suggestions clean.
    type: 'city',
    format: 'json',
    lang: 'en',
  };

  if (countryCode) {
    params.filter = `countrycode:${countryCode.toLowerCase()}`;
  }

  const { data } = await axios.get(`${GEOAPIFY_BASE}/autocomplete`, {
    params,
    timeout: 6000,
  });

  const results = (data?.results || []).map(normalise).filter(Boolean);

  cacheSet(cacheKey, results);

  return results;
};

/**
 * Resolves a full place name to a single set of coordinates.
 *
 * @param {string} location
 * @returns {Promise<{ latitude, longitude, placeName } | null>}
 */
const getCoordinates = async (location) => {
  if (!isGeocodingEnabled()) {
    console.warn('Geocoding skipped: GEOAPIFY_API_KEY is not set.');
    return null;
  }

  try {
    const { data } = await axios.get(`${GEOAPIFY_BASE}/search`, {
      params: { text: location, apiKey: apiKey(), limit: 1, format: 'json' },
      timeout: 6000,
    });

    const [first] = data?.results || [];

    if (!first) return null;

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      placeName: first.formatted,
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

const deg2rad = (deg) => deg * (Math.PI / 180);

/**
 * Great-circle distance between two points.
 *
 * @returns {number} Distance in kilometres.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = {
  autocomplete,
  getCoordinates,
  calculateDistance,
  isGeocodingEnabled,
  // Exported for tests.
  _cache: cache,
};
