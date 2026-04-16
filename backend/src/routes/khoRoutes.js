const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    nhapKho,
    luuPhieuKiemKho,
    hoanThanhKiemKho,
    getTonKho
} = require('../controllers/khoController');

const router = express.Router();

// API Lấy danh sách tồn kho
router.get('/', protect, getTonKho);

// API Nhập kho (Tạo biến động số lượng dương)
router.post('/nhap', protect, authorize('Admin', 'NhanVien'), nhapKho);

// API Lưu nháp phiếu kiểm kho
router.post('/kiem-kho', protect, authorize('Admin', 'NhanVien'), luuPhieuKiemKho);

// API Chốt phiếu kiểm kho (Thực hiện cân bằng tồn thực tế)
router.post('/kiem-kho/:MaPhieu/hoan-thanh', protect, authorize('Admin', 'NhanVien'), hoanThanhKiemKho);

module.exports = router;
