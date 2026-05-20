const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// API Cài đặt mục tiêu doanh thu
router.post('/targets', reportController.setRevenueTarget);

// API Lấy dữ liệu biểu đồ doanh thu thực tế vs kế hoạch
router.get('/revenue', reportController.getRevenueChartData);

// API Cài đặt mục tiêu sản lượng
router.post('/targets/production', reportController.setProductionTarget);

// API Lấy dữ liệu biểu đồ sản lượng thực tế vs kế hoạch
router.get('/production', reportController.getProductionChartData);

module.exports = router;
