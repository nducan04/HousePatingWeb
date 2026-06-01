const express = require('express');
const router = express.Router();
const rdController = require('../controllers/rdController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/track/:id', rdController.getRDLogById);

router.use(protect);

// @route   GET /api/rd-tracking
router.get('/', rdController.getRDLogs);

// @route   GET /api/rd-tracking/:id
router.get('/:id', rdController.getRDLogById);

// @route   POST /api/rd-tracking
router.post('/', rdController.createRDLog);

// @route   POST /api/rd-tracking/:id/versions
router.post('/:id/versions', authorize('Admin', 'NhanVien'), rdController.addVersion);

// @route   PATCH /api/rd-tracking/:id/sign-kcs
router.patch('/:id/sign-kcs', authorize('Admin', 'NhanVien'), rdController.signKCS);

module.exports = router;