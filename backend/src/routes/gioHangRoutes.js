const express = require('express');
const { getCart, updateCart, clearCart, mergeCart } = require('../controllers/gioHangController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/merge', protect, mergeCart);
router.get('/:sessionId', getCart);
router.post('/:sessionId', updateCart);
router.delete('/:sessionId', clearCart);

module.exports = router;
