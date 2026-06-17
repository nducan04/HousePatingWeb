const express = require('express');
const { login, register, refresh, logout, getMe, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes — yêu cầu Bearer Token
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
