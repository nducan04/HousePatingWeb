const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove, getByAccountId } = require('../controllers/nhanVienController');

const router = express.Router();

// Chỉnh sửa RBAC cho nhân viên
router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Director', 'NhanVien'), getAll)
  .post(authorize('Admin'), create);

router.route('/:id')
  .get(authorize('Admin', 'NhanVien'), getById)
  .put(authorize('Admin', 'NhanVien'), update)
  .delete(authorize('Admin'), remove);

router.route('/account/:accountId')
  .get(getByAccountId);

module.exports = router;
