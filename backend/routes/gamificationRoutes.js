const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getLeaderboard,
    getLeaderboardHistory,
    getFacultyLeaderboard,
    getUserStats,
    resetMonthlyPoints  // admin only
} = require('../controllers/gamificationController');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/leaderboard/current', getLeaderboard);
router.get('/leaderboard/history', getLeaderboardHistory);
router.get('/leaderboard/faculty/:faculty', getFacultyLeaderboard);

// Protected routes (requires login)
router.get('/leaderboard/me', protect, getUserStats);
router.get('/leaderboard/user/:userId', getUserStats); // optionally protect if needed

// Admin only route
router.post('/admin/reset-monthly', protect, resetMonthlyPoints);

module.exports = router;