const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessages,
    markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// All message routes require authentication
router.use(protect);

router.route('/')
    .post(sendMessage);

router.route('/:chatId')
    .get(getMessages);

router.put('/:id/read', markAsRead);

module.exports = router;