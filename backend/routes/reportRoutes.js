const express = require('express');
const router = express.Router();
const {
    createReport,
    getReports,
    updateReport
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth'); 


// Public/User Routes (Requires Auth)
router.route('/')
    .post(protect, createReport);

// Admin Only Routes
router.route('/')
    .get(protect, adminOnly, getReports);

router.route('/:id')
    .put(protect, adminOnly, updateReport);

module.exports = router;
