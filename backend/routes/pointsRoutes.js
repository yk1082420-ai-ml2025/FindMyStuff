// In backend/routes/pointsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserPointsHandler, getUserRankHandler } = require('../controllers/pointsController');

router.get('/points/me', protect, getUserPointsHandler);
router.get('/points/rank/me', protect, getUserRankHandler);
router.get('/points/user/:userId', protect, getUserPointsHandler);
router.get('/points/rank/:userId', protect, getUserRankHandler);

module.exports = router;