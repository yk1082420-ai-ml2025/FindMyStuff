const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    markItemReturned, 
    checkReturnStatus 
} = require('../controllers/returnController');

// POST /api/return - Mark item as returned (auto-locks chat)
router.post('/', protect, markItemReturned);

// GET /api/return/check/:itemId - Check return status
router.get('/check/:itemId', protect, checkReturnStatus);

module.exports = router;