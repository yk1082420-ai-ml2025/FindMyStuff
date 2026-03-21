const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
    createClaim,
    getClaimsByItem,
    getClaimById,
    approveClaim,
    rejectClaim
} = require('../controllers/claimController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'claim-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png)!'));
        }
    }
});

router.post('/:itemId', protect, upload.single('proofImage'), createClaim);
router.get('/item/:itemId', protect, getClaimsByItem);
router.get('/:id', protect, getClaimById);
router.put('/:id/approve', protect, approveClaim);
router.put('/:id/reject', protect, rejectClaim);

module.exports = router;
