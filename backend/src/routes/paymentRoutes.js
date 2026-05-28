const express = require('express');
const router = express.Router();
const { getAllFinancialRecords, updateContractPayment, createMomoPayment, momoIPN, momoConfirm } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/all', protect, authorize('Admin', 'NhanVien'), getAllFinancialRecords);
router.patch('/contract/:id', protect, authorize('Admin', 'NhanVien'), updateContractPayment);

// MoMo Integration routes
router.post('/momo/create', protect, createMomoPayment);
router.post('/momo/ipn', momoIPN); // Public callback endpoint for MoMo server
router.post('/momo/confirm', protect, momoConfirm); // Client-side fallback confirmation

module.exports = router;

