// server/routes/universityRoutes.js
const express = require('express');

const { getUniversities, addUniversity } = require('../controllers/universityController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/').get(getUniversities).post(protect, admin, addUniversity);

module.exports = router;
