const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
  createAccount, 
  getMyProfile, 
  getMyMaterials, 
  createMyMaterial, 
  updateMyMaterial 
} = require('../controllers/nhaCungCapController');
const { getBySupplier: getPOBySupplier, create: createPO, getAll: getAllPO } = require('../controllers/phieuDatHangController');
const { getReceiptsBySupplier } = require('../controllers/khoController');

const router = express.Router();

router.use(protect);

// Các API Portal dành cho cả Nhà cung cấp & Admin
router.get('/my-profile', authorize('Admin', 'NhaCungCap'), getMyProfile);
router.get('/my-materials', authorize('Admin', 'NhaCungCap'), getMyMaterials);
router.post('/my-materials', authorize('Admin', 'NhaCungCap'), createMyMaterial);
router.put('/my-materials/:materialId', authorize('Admin', 'NhaCungCap'), updateMyMaterial);

// API cấp tài khoản (Chỉ Admin)
router.post('/:id/create-account', authorize('Admin'), createAccount);

// Các API quản lý chung dành cho Admin & NhanVien
router.use(authorize('Admin', 'Director', 'NhanVien'));

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

// Lấy tất cả PO
router.get('/vouchers/po/all', getAllPO);

module.exports = router;
