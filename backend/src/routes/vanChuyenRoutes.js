const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllTracking,
    getTrackingByOrder,
    createTracking,
    updateTrackingLog,
    updateTracking
} = require('../controllers/vanChuyenController');

router.use(protect);

router.get('/', getAllTracking);
router.get('/order/:orderId', getTrackingByOrder);
router.post('/', authorize('Admin', 'NhanVien'), createTracking);
router.patch('/:id/log', authorize('Admin', 'NhanVien'), updateTrackingLog);
router.patch('/:id', authorize('Admin', 'NhanVien'), updateTracking);

module.exports = router;
