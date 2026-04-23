const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove } = require('../controllers/nhaCungCapController');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'NhanVien'));

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

module.exports = router;
