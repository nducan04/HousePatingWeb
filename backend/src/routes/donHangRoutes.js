const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getOrders,
    getOrderById,
    createOrder,
    checkoutFromCart,
    updateStatus,
    updatePaymentStatus,
    updateDeposit,
    deleteOrder,
    updateOrderInfo,
    cancelOrder,
    rateOrder
} = require('../controllers/donHangController');

router.use(protect);

// 1. Routes for everyone (including Customers)
router.post('/checkout', checkoutFromCart);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/info', updateOrderInfo); // Allow customers to update their order info
router.patch('/:id/cancel', cancelOrder); // Allow customers to cancel their own order
router.patch('/:id/rate', rateOrder); // Allow customers to rate their order

// 2. Administrative routes (Admin & NhanVien only)
router.use(authorize('Admin', 'Director', 'NhanVien'));
router.post('/', createOrder);
router.patch('/:id/status', updateStatus);
router.patch('/:id/payment', updatePaymentStatus);
router.patch('/:id/deposit', updateDeposit);
router.delete('/:id', deleteOrder);

module.exports = router;
