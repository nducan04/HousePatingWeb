const express = require('express');
const { login, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes — yêu cầu Bearer Token
router.get('/me', protect, getMe);

module.exports = router;
