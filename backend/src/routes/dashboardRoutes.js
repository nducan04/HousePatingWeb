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

module.exports = router;
