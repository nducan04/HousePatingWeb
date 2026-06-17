const express = require('express');
const router = express.Router();
const { getAllFinancialRecords, updateContractPayment, createMomoPayment, momoIPN, momoConfirm, getMyFinancialRecords, getContractDebt, createPayment, verifyBlockchain, cardPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/all', protect, authorize('Admin', 'NhanVien'), getAllFinancialRecords);
router.get('/my-payments', protect, getMyFinancialRecords);
router.patch('/contract/:id', protect, authorize('Admin', 'NhanVien'), updateContractPayment);

// Contract Debt APIs
router.get('/contracts/:id/debt', getContractDebt);
router.post('/', createPayment);
router.put('/verify-blockchain', verifyBlockchain);

// Card Payment (Mock)
router.post('/card-payment', protect, cardPayment);

// MoMo Integration routes
router.post('/momo/create', protect, createMomoPayment);
router.post('/momo/ipn', momoIPN); // Public callback endpoint for MoMo server
router.post('/momo/confirm', protect, momoConfirm); // Client-side fallback confirmation

module.exports = router;

