// server/routes/geocodeRoutes.js
const express = require('express');

const { getAutocomplete } = require('../controllers/geocodeController');
const { geocodeLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Autocomplete fires per keystroke, so it gets its own budget rather than
// eating the shared API allowance.
router.get('/autocomplete', geocodeLimiter, getAutocomplete);

module.exports = router;
