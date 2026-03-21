const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendVerificationCode,
    verifyPhone,
    getVerificationStatus
} = require('../controllers/phoneVerificationController');

router.use(protect); // All routes require authentication

router.post('/send-verification', sendVerificationCode);
router.post('/verify', verifyPhone);
router.get('/status', getVerificationStatus);

module.exports = router;