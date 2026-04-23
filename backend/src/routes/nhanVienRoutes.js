const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove, getByAccountId } = require('../controllers/nhanVienController');

const router = express.Router();

// Chỉ Admin toàn quyền quản lý nhân viên
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

router.route('/account/:accountId')
  .get(getByAccountId);

module.exports = router;
