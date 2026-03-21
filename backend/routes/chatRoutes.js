const express = require('express');
const router = express.Router();
const {
    createChat,
    getChats,
    getChatById,
    lockChat,
    getLockedChats,
    getChatStatus
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(protect);

// Routes
router.route('/')
    .get(getChats)
    .post(createChat);

router.get('/locked', getLockedChats);

router.route('/:id')
    .get(getChatById);

router.put('/:id/lock', lockChat);

router.get('/:id/status', getChatStatus);

module.exports = router;