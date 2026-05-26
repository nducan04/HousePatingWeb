const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAll, create, update, remove
} = require('../controllers/tinTucController');

const router = express.Router();

// Public route to view news articles
router.get('/', getAll);

// Protected routes to write news articles
router.post('/', protect, authorize('Admin', 'NhanVien'), create);
router.put('/:id', protect, authorize('Admin', 'NhanVien'), update);
router.delete('/:id', protect, authorize('Admin', 'NhanVien'), remove);

module.exports = router;
