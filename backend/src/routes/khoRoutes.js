const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    nhapKho,
    luuPhieuKiemKho,
    hoanThanhKiemKho,
    getTonKho,
    getDanhSachPhieu,
    // Nguyen Vat Lieu
    getNguyenVatLieu,
    createNguyenVatLieu,
    updateNguyenVatLieu,
    deleteNguyenVatLieu,
    // Phieu Nhap Xuat — Approval Workflow v2.0
    getPhieuNhapXuat,
    createPhieuNhapXuat,
    duyetPhieuNhapXuat,
    tuChoiPhieu,
    updatePhieuNhapXuat,
    deletePhieuNhapXuat
} = require('../controllers/khoController');

const router = express.Router();

// API Lấy danh sách tồn kho
router.get('/', protect, authorize('Admin', 'NhanVien'), getTonKho);

// API Danh sách Phiếu kiểm
router.get('/kiem-kho', protect, authorize('Admin', 'NhanVien'), getDanhSachPhieu);

// API Nhập kho (Tạo biến động số lượng dương)
router.post('/nhap', protect, authorize('Admin', 'NhanVien'), nhapKho);

// API Lưu nháp phiếu kiểm kho
router.post('/kiem-kho', protect, authorize('Admin', 'NhanVien'), luuPhieuKiemKho);

// API Chốt phiếu kiểm kho (Thực hiện cân bằng tồn thực tế)
router.post('/kiem-kho/:MaPhieu/hoan-thanh', protect, authorize('Admin', 'NhanVien'), hoanThanhKiemKho);

// --- QUẢN LÝ NGUYÊN VẬT LIÊU ---
router.get('/nguyen-vat-lieu', protect, authorize('Admin', 'NhanVien'), getNguyenVatLieu);
router.post('/nguyen-vat-lieu', protect, authorize('Admin', 'NhanVien'), createNguyenVatLieu);
router.put('/nguyen-vat-lieu/:id', protect, authorize('Admin', 'NhanVien'), updateNguyenVatLieu);
router.delete('/nguyen-vat-lieu/:id', protect, authorize('Admin', 'NhanVien'), deleteNguyenVatLieu);

// ═══ QUẢN LÝ PHIẾU NHẬP / XUẤT KHO — APPROVAL WORKFLOW ═══
router.get('/nhap-xuat', protect, authorize('Admin', 'NhanVien'), getPhieuNhapXuat);
router.post('/nhap-xuat', protect, authorize('Admin', 'NhanVien'), createPhieuNhapXuat);
router.put('/nhap-xuat/:id', protect, authorize('Admin', 'NhanVien'), updatePhieuNhapXuat);
router.delete('/nhap-xuat/:id', protect, authorize('Admin'), deletePhieuNhapXuat);

// ★ DUYỆT / TỪ CHỐI PHIẾU (Chỉ Admin mới có quyền duyệt)
router.post('/nhap-xuat/:id/duyet', protect, authorize('Admin'), duyetPhieuNhapXuat);
router.post('/nhap-xuat/:id/tu-choi', protect, authorize('Admin'), tuChoiPhieu);

module.exports = router;

