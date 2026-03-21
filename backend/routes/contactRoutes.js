const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { contactUser } = require('../controllers/contactController');

// POST /api/contact - Contact user and auto-create chat
router.post('/', protect, contactUser);

module.exports = router;