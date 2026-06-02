const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher,
    getVoucherStats
} = require('../controllers/khuyenMaiController');

// Validate is accessible to all logged in users (for cart)
router.post('/validate', protect, validateVoucher);
router.get('/', getAllVouchers); // Allow anyone to get vouchers (or protect it if needed, but not authorize)

// Management routes restricted to Admin/NhanVien
router.use(protect);
router.use(authorize('Admin', 'NhanVien'));
router.post('/', createVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);
router.get('/:id/stats', getVoucherStats);

module.exports = router;
