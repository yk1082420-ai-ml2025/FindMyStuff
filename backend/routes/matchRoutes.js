const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const {
    runMatching,
    getMatches,
    getMatchStats,
    confirmMatch,
    dismissMatch,
} = require('../controllers/matchController');

// All routes: authenticated admins only
router.use(protect, adminOnly);

router.post('/run', runMatching);
router.get('/stats', getMatchStats);
router.get('/', getMatches);
router.post('/:id/confirm', confirmMatch);
router.post('/:id/dismiss', dismissMatch);

module.exports = router;
