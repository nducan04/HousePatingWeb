const express = require('express');
const router = express.Router();
const { 
  getProductionOrders, 
  getPreCreateData, 
  createProductionOrder, 
  getProductionOrderById 
} = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin', 'NhanVien'));

router.get('/', getProductionOrders);
router.get('/pre-create', getPreCreateData);
router.get('/:id', getProductionOrderById);
router.post('/', createProductionOrder);

module.exports = router;
