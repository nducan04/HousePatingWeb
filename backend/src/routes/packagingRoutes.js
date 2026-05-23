const express = require('express');
const router = express.Router();
const { 
  getPackagingSlips, 
  getPendingRDLogs, 
  createPackagingSlip, 
  getPackagingSlipById 
} = require('../controllers/packagingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin', 'NhanVien'));

router.get('/', getPackagingSlips);
router.get('/pending-rd', getPendingRDLogs);
router.get('/:id', getPackagingSlipById);
router.post('/', createPackagingSlip);

module.exports = router;
