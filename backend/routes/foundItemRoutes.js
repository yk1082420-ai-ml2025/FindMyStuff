const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
    createFoundItem,
    getFoundItems,
    getFoundItemById,
    updateFoundItem,
    updateFoundItemStatus,
    deleteFoundItem,
    getSuggestions,
} = require('../controllers/foundItemController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/found');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for found item images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `found-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Get current user's own found posts (including archived)
router.get('/mine', protect, async (req, res) => {
    try {
        const FoundItem = require('../models/FoundItem');
        const items = await FoundItem.find({ postedBy: req.user._id })
            .sort({ createdAt: -1 })
            .select('title images status isArchived createdAt category');
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.route('/')
    .get(getFoundItems)               // GET /api/found  (public)
    .post(protect, upload.array('images', 5), createFoundItem); // POST /api/found

router.route('/:id')
    .get(getFoundItemById)            // GET /api/found/:id
    .put(protect, upload.array('images', 5), updateFoundItem)  // PUT /api/found/:id
    .delete(protect, deleteFoundItem); // DELETE /api/found/:id

router.patch('/:id/status', protect, updateFoundItemStatus); // PATCH /api/found/:id/status

module.exports = router;