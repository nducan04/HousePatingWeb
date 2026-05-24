const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin', 'Director'));

// @route   GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);
router.get('/detailed-stats', dashboardController.getDetailedStats);
router.get('/inventory-stats', dashboardController.getInventoryStats);
router.get('/production-stats', dashboardController.getProductionStats);
router.get('/customer-service-stats', dashboardController.getCustomerServiceStats);
router.get('/hr-legal-stats', dashboardController.getHrLegalStats);
router.get('/business-report', dashboardController.getBusinessReportData);
router.get('/inventory-report', dashboardController.getInventoryReportData);
router.get('/production-report', dashboardController.getProductionReportData);
router.get('/customer-service-report', dashboardController.getCustomerServiceReportData);
router.get('/hr-legal-report', dashboardController.getHrLegalReportData);

module.exports = router;
