const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
    createLostItem,
    getLostItems,
    getLostItemById,
    updateLostItem,
    updateLostItemStatus,
    deleteLostItem,
    getSuggestions,
} = require('../controllers/lostItemController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/lost');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for lost item images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `lost-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.get('/suggestions', getSuggestions);
router.route('/')
    .get(getLostItems)               // GET /api/lost  (public)
    .post(protect, upload.array('images', 5), createLostItem); // POST /api/lost

router.route('/:id')
    .get(getLostItemById)            // GET /api/lost/:id
    .put(protect, upload.array('images', 5), updateLostItem)  // PUT /api/lost/:id
    .delete(protect, deleteLostItem); // DELETE /api/lost/:id

router.patch('/:id/status', protect, updateLostItemStatus); // PATCH /api/lost/:id/status

module.exports = router;
