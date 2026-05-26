const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove } = require('../controllers/khachHangController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'NhanVien'), getAll)
  .post(authorize('Admin', 'NhanVien'), create);

router.route('/:id')
  .get(authorize('Admin', 'NhanVien', 'KhachHangB2B'), getById)
  .put(authorize('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'), update)
  .delete(authorize('Admin'), remove);

module.exports = router;
