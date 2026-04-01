const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Student routes
router.post('/', protect, reportController.createReport);
router.get('/my-reports', protect, reportController.getMyReports);
router.get('/:id', protect, reportController.getReportById);

// Admin routes
router.get('/admin/all', protect, adminOnly, reportController.getAllReports);
router.get('/admin/stats', protect, adminOnly, reportController.getReportStats);
router.put('/admin/:id', protect, adminOnly, reportController.updateReportStatus);
router.delete('/admin/:id', protect, adminOnly, reportController.deleteReport);

module.exports = router;
