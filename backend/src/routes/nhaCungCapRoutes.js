const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAll, getById, create, update, remove } = require('../controllers/nhaCungCapController');
const { getBySupplier: getPOBySupplier, create: createPO } = require('../controllers/phieuDatHangController');
const { getReceiptsBySupplier } = require('../controllers/khoController');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'NhanVien'));

router.route('/')
  .get(getAll)
  .post(create);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

// Lịch sử chứng từ của NCC
router.get('/:supplierId/vouchers/po', getPOBySupplier);
router.get('/:supplierId/vouchers/receipts', getReceiptsBySupplier);
router.post('/:supplierId/vouchers/po', createPO);

module.exports = router;
