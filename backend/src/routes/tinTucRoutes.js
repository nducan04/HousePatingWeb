const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAll, create, update, remove
} = require('../controllers/tinTucController');

const router = express.Router();

router.get('/', getAll);
// Tạm thời mở Route nếu chưa setup full Auth ở client, có thể dùng protect sau
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
