const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// API Cài đặt mục tiêu doanh thu (chỉ Admin, Director)
router.post('/targets', authorize('Admin', 'Director'), reportController.setRevenueTarget);

// API Lấy dữ liệu biểu đồ doanh thu thực tế vs kế hoạch (Admin, Director, NhanVien)
router.get('/revenue', authorize('Admin', 'Director', 'NhanVien'), reportController.getRevenueChartData);

// API Cài đặt mục tiêu sản lượng (chỉ Admin, Director)
router.post('/targets/production', authorize('Admin', 'Director'), reportController.setProductionTarget);

// API Lấy dữ liệu biểu đồ sản lượng thực tế vs kế hoạch (Admin, Director, NhanVien)
router.get('/production', authorize('Admin', 'Director', 'NhanVien'), reportController.getProductionChartData);

module.exports = router;
