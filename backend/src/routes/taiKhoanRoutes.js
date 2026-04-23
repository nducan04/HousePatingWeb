const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, create, update, remove } = require('../controllers/taiKhoanController');

const router = express.Router();

// Hiện tại cho phép tất cả thao tác của Admin
// Có thể thêm phân quyền .use(authorize('Admin')) nếu cần
// router.use(protect);

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .put(update)
  .delete(remove);

module.exports = router;
