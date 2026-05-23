const express = require('express');
const router = express.Router();
const congThucController = require('../controllers/congThucController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin', 'NhanVien'), congThucController.getFormulas);
router.post('/', protect, authorize('Admin', 'NhanVien'), congThucController.createFormula);
router.post('/:id/calculate', protect, authorize('Admin', 'NhanVien'), congThucController.calculateRequirement);

module.exports = router;
