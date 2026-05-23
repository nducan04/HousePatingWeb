const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getContracts,
  getContractById,
  createContract,
  generatePreviewPDF,
  deployOnChain,
  signContract,
  updateStatus,
  verifyOnChain
} = require('../controllers/contractController');

const router = express.Router();

// Multer config for PDF upload
const upload = multer({ dest: 'uploads/' });

/**
 * Ma trận phân quyền RBAC cho Contract Routes (theo BRD):
 * ─────────────────────────────────────────────────────────
 * GET    /               Admin, NhanVien, KhachHangB2B
 * POST   /               Admin, NhanVien
 * GET    /:id            Admin, NhanVien, KhachHangB2B
 * POST   /:id/preview    Admin, NhanVien
 * POST   /:id/deploy     Admin
 * PATCH  /:id/sign       Admin, KhachHangB2B
 * PATCH  /:id/status     Admin
 * GET    /:id/onchain    Admin, NhanVien, KhachHangB2B
 */

// Tất cả routes đều yêu cầu xác thực JWT
router.use(protect);

// Danh sách & Tạo mới
router.route('/')
  .get(authorize('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'), getContracts)
  .post(authorize('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'), upload.single('pdfFile'), createContract);

// Chi tiết hợp đồng
router.get('/:id', authorize('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'), getContractById);

// Sinh PDF → Hash → IPFS (chỉ Admin/NhanVien)
router.post('/:id/preview', authorize('Admin', 'NhanVien'), generatePreviewPDF);

// Deploy lên Blockchain Sepolia (chỉ Admin)
router.post('/:id/deploy', authorize('Admin'), deployOnChain);

// Ký số qua MetaMask (Admin phê duyệt hoặc KhachHangB2B ký)
router.patch('/:id/sign', authorize('Admin', 'KhachHangB2B', 'KhachHangB2C'), signContract);

// Cập nhật trạng thái (chỉ Admin)
router.patch('/:id/status', authorize('Admin'), updateStatus);

// Xác minh on-chain
router.get('/:id/onchain', authorize('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'), verifyOnChain);

module.exports = router; // nodemon restart again
