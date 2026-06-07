const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getPerformanceStats } = require('../controllers/hieuSuatController');

const router = express.Router();

// Chỉ Admin và Giám đốc (Director) mới được xem các chỉ số hiệu suất hệ thống
router.get('/stats', protect, authorize('Admin', 'Director', 'NhanVien'), getPerformanceStats);

module.exports = router;
