const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getCurrentLeaderboard,
    getAllTimeLeaderboard,
    getMyRank
} = require('../controllers/leaderboardController');

router.get('/current', protect, getCurrentLeaderboard);
router.get('/alltime', protect, getAllTimeLeaderboard);
router.get('/me', protect, getMyRank);

module.exports = router;