const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
    createClaim,
    getClaimsForItem,
    getMyClaims,
    getReceivedClaims,
    getClaimById,
    approveClaim,
    rejectClaim,
    confirmReturn
} = require('../controllers/claimController');

const router = express.Router();

// Configure multer for proof image uploads (same as before)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `claim-${Date.now()}${path.extname(file.originalname)}`)
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

// ✅ Static routes (specific paths) – MUST come before dynamic routes
router.post('/:id/confirm-return', protect, confirmReturn);
router.post('/:id/approve', protect, approveClaim);      // changed from PUT to POST
router.post('/:id/reject', protect, rejectClaim);        // changed from PUT to POST
router.get('/mine', protect, getMyClaims);
router.get('/received', protect, getReceivedClaims);
router.get('/detail/:id', protect, getClaimById);

// ✅ Dynamic routes (with parameters)
router.post('/:itemType/:itemId', protect, upload.array('proofImages', 3), createClaim);
router.get('/:itemType/:itemId', protect, getClaimsForItem);

module.exports = router;