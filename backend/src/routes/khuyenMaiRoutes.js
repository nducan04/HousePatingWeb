const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher
} = require('../controllers/khuyenMaiController');

// Validate is accessible to all logged in users (for cart)
router.post('/validate', protect, validateVoucher);

// Management routes restricted to Admin/NhanVien
router.use(protect);
router.use(authorize('Admin', 'NhanVien'));

router.get('/', getAllVouchers);
router.post('/', createVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);

module.exports = router;
