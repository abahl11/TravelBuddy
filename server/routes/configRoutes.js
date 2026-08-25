// server/routes/configRoutes.js
const express = require('express');

const { isGeocodingEnabled } = require('../utils/geocodingUtils');

const router = express.Router();

/**
 * Runtime configuration for the client.
 *
 * Delivering these at runtime rather than baking REACT_APP_* values into the
 * bundle means a key can be changed with a restart instead of a rebuild.
 *
 * The MapTiler key is safe to expose: tile URLs are fetched by the browser, so
 * it is public by design. Restrict it by allowed origin in the MapTiler
 * dashboard. The Geoapify key is deliberately NOT sent — it stays server-side
 * behind /api/geocode.
 */
router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');

  res.json({
    maps: {
      tilesEnabled: Boolean(process.env.MAPTILER_API_KEY),
      maptilerKey: process.env.MAPTILER_API_KEY || null,
      mapStyle: process.env.MAPTILER_STYLE || 'streets-v2',
      geocodingEnabled: isGeocodingEnabled(),
    },
  });
});

module.exports = router;
