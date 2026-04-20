const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Multer for screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `report-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
        ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
    }
});

// Student routes
router.post('/', protect, upload.array('screenshots', 5), reportController.createReport);
router.get('/my-reports', protect, reportController.getMyReports);
router.get('/:id', protect, reportController.getReportById);

// Admin routes
router.get('/admin/all', protect, adminOnly, reportController.getAllReports);
router.get('/admin/stats', protect, adminOnly, reportController.getReportStats);
router.put('/admin/:id', protect, adminOnly, reportController.updateReportStatus);
router.delete('/admin/:id', protect, adminOnly, reportController.deleteReport);

module.exports = router;
