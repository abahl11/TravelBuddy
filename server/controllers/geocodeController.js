// server/controllers/geocodeController.js
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');
const { autocomplete, isGeocodingEnabled } = require('../utils/geocodingUtils');

// @desc    City autocomplete suggestions
// @route   GET /api/geocode/autocomplete?q=...
// @access  Public
//
// Proxied through this server on purpose: the Geoapify key stays in the
// server environment instead of being compiled into the browser bundle.
const getAutocomplete = asyncHandler(async (req, res) => {
  const { q, limit, country } = req.query;

  if (!q || typeof q !== 'string') {
    throw ApiError.badRequest('A search query is required');
  }

  if (q.length > 120) {
    throw ApiError.badRequest('Search query is too long');
  }

  // Not configured is a normal state, not an error: the client falls back to
  // plain text entry when it sees an empty, unconfigured response.
  if (!isGeocodingEnabled()) {
    return res.json({ configured: false, results: [] });
  }

  const parsedLimit = Number(limit);
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 10) : 5;

  try {
    const results = await autocomplete(q, {
      limit: safeLimit,
      countryCode: country || process.env.GEOCODE_COUNTRY || undefined,
    });

    // Suggestions are cheap to recompute but repeat constantly across users.
    res.set('Cache-Control', 'public, max-age=600');
    res.json({ configured: true, results });
  } catch (error) {
    // An upstream outage or an exhausted quota must not break the form — the
    // field stays usable as free text.
    console.error('Geocode autocomplete failed:', error.response?.status || '', error.message);
    res.json({ configured: true, results: [], degraded: true });
  }
});

module.exports = { getAutocomplete };
