const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllTracking,
    getTrackingByOrder,
    getTrackingByCode,
    createTracking,
    updateTrackingLog,
    updateTracking
} = require('../controllers/vanChuyenController');

router.get('/track/:code', getTrackingByCode);

router.use(protect);

router.get('/', getAllTracking);
router.get('/order/:orderId', getTrackingByOrder);
router.post('/', authorize('Admin', 'Director', 'NhanVien'), createTracking);
router.patch('/:id/log', authorize('Admin', 'Director', 'NhanVien'), updateTrackingLog);
router.patch('/:id', authorize('Admin', 'Director', 'NhanVien'), updateTracking);

module.exports = router;
