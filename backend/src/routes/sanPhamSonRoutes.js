const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAll, getById, create, update, remove,
  addColor, updateColor, removeColor,
} = require('../controllers/sanPhamSonController');

const router = express.Router();

// Public: tra cứu sản phẩm (cho B2C/B2B portal)
router.get('/', getAll);
router.get('/:id', getById);

// Protected: chỉ Admin/NhanVien quản lý CRUD
router.post('/', protect, authorize('Admin', 'NhanVien'), create);
router.put('/:id', protect, authorize('Admin', 'NhanVien'), update);
router.delete('/:id', protect, authorize('Admin', 'NhanVien'), remove);

// Sub-document: quản lý mã màu trong sản phẩm
router.post('/:id/ma-mau', protect, authorize('Admin', 'NhanVien'), addColor);
router.put('/:id/ma-mau/:colorId', protect, authorize('Admin', 'NhanVien'), updateColor);
router.delete('/:id/ma-mau/:colorId', protect, authorize('Admin', 'NhanVien'), removeColor);

module.exports = router;
