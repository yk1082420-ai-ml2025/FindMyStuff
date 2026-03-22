const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
} = require('../controllers/noticeController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for notice attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `notice-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Allow images and common document types for notices
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    
    if (ext) return cb(null, true);
    cb(new Error('Only image and document files are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Routes
router.route('/')
    .get(getNotices)               // GET /api/notices (Public/student view)
    .post(protect, upload.array('attachments', 5), createNotice); // POST /api/notices (Admin only)

router.route('/:id')
    .get(getNoticeById)            // GET /api/notices/:id
    .put(protect, upload.array('attachments', 5), updateNotice)   // PUT /api/notices/:id (Admin only)
    .delete(protect, deleteNotice);               // DELETE /api/notices/:id (Admin only)

module.exports = router;
