// server/routes/messageRoutes.js
const express = require('express');

const {
  sendMessage,
  getConversations,
  getUnreadCount,
  getMessagesByUser,
  markMessageAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.use(protect);

router.route('/').get(getConversations).post(sendMessage);

// Declared before '/:userId' so it is not read as a user id.
router.get('/unread-count', getUnreadCount);

router.put('/:id/read', validateObjectId('id'), markMessageAsRead);
router.get('/:userId', validateObjectId('userId'), getMessagesByUser);

module.exports = router;
