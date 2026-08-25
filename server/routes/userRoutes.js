// server/routes/userRoutes.js
const express = require('express');

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

router.get('/:id', validateObjectId('id'), getUserById);

module.exports = router;
