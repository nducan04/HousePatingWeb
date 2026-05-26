const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, create, update, remove } = require('../controllers/taiKhoanController');

const router = express.Router();

// Protect and authorize Admin for all user account endpoints
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .put(update)
  .delete(remove);

module.exports = router;
