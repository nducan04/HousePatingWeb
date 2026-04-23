const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);
router.get('/detailed-stats', dashboardController.getDetailedStats);

module.exports = router;
