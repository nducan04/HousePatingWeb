const express = require('express');
const { getCart, updateCart, clearCart } = require('../controllers/gioHangController');

const router = express.Router();

router.get('/:sessionId', getCart);
router.post('/:sessionId', updateCart);
router.delete('/:sessionId', clearCart);

module.exports = router;
