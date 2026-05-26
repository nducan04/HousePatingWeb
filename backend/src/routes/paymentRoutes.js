const express = require('express');
const router = express.Router();
const { getAllFinancialRecords, updateContractPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/all', protect, authorize('Admin', 'NhanVien'), getAllFinancialRecords);
router.patch('/contract/:id', protect, authorize('Admin', 'NhanVien'), updateContractPayment);

module.exports = router;
