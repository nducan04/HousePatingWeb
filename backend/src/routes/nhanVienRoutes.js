const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove } = require('../controllers/nhanVienController');

const router = express.Router();

// Chỉnh sửa RBAC cho nhân viên
router.use(protect);

router.route('/')
  .get(authorize('Admin'), getAll)
  .post(authorize('Admin'), create);

router.route('/:id')
  .get(authorize('Admin', 'NhanVien'), getById)
  .put(authorize('Admin', 'NhanVien'), update)
  .delete(authorize('Admin'), remove);

module.exports = router;
