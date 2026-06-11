const mongoose = require('mongoose');

/**
 * Collection: HopDong (Hợp đồng nguyên tắc B2B Blockchain)
 * Theo đặc tả: Lưu trữ văn bản pháp lý phân tán và điều khoản dự án lớn.
 *
 * Cơ chế Tham chiếu (Reference):
 *   - CustomerID → KhachHang (Đối tác B2B)
 *   - EmployeeID → NhanVien (Nhân viên quản lý dự án)
 *
 * Cơ chế Nhúng (Embedding):
 *   - ChiTietHopDong: Mảng sản phẩm, khối lượng, đơn giá, yêu cầu KT
 *
 * Liên kết phi tập trung (Decentralized Reference):
 *   - SmartContractAddress → Sepolia Blockchain
 *   - IPFSCID → IPFS/Pinata
 *   - TransactionHash → Sepolia TX
 */

const paymentTermSchema = new mongoose.Schema({
  name: { type: String, required: true }, // VD: Đợt 1, Đợt 2
  percentage: { type: Number, required: true }, // % thanh toán
  amount: { type: Number, required: true }, // Giá trị đợt
  dueDate: { type: Date, required: true }, // Hạn thanh toán
  paidAmount: { type: Number, default: 0 }, // Đã thanh toán của đợt này
  paidDate: { type: Date } // Ngày thanh toán gần nhất cho đợt này
}, { _id: true }); // Keep _id to identify terms when updating

const chiTietHopDongSchema = new mongoose.Schema({
  productName: { type: String, required: true },     // Tên sản phẩm / Dòng sơn
  colorCode: { type: String, default: '' },           // Mã màu sơn
  quantity: { type: Number, required: true },          // Khối lượng (Thùng)
  unitPrice: { type: Number, required: true },         // Đơn giá (VNĐ/Thùng)
  technicalReqs: { type: String, default: '' }         // Yêu cầu kỹ thuật đặc thù
}, { _id: false });

const hopDongSchema = new mongoose.Schema({
  MaHopDong: {
    type: String,
    required: [true, 'Vui lòng nhập mã hợp đồng'],
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề hợp đồng'],
    trim: true,
  },
  // Tham chiếu KhachHang
  CustomerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    required: [true, 'Vui lòng chọn khách hàng'],
  },
  // Nhóm phân loại hợp đồng (B2B, Đại lý, B2C)
  LoaiHopDong: {
    type: String,
    enum: ['B2B', 'Đại lý', 'B2C'],
    default: 'B2B',
  },
  contractType: {
    type: String,
    enum: ['mua-ban', 'pha-che'],
    default: 'mua-ban'
  },
  // Đối với Đại lý
  TaxCode: {
    type: String,
    trim: true,
  },
  // Đối với B2B
  MetamaskAddress: {
    type: String,
    trim: true,
  },
  // === Thông tin chi tiết Bên B ===
  partyBAddress: { type: String, trim: true },
  partyBTaxCode: { type: String, trim: true },
  partyBBankAccount: { type: String, trim: true },
  partyBBankName: { type: String, trim: true },
  partyBRepresentative: { type: String, trim: true },
  partyBPosition: { type: String, trim: true },
  // Tham chiếu NhanVien (Nhân viên phụ trách)
  EmployeeID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
  },
  NgayLap: {
    type: Date,
    default: Date.now,
  },
  TongGiaTri: {
    type: Number,
    required: true,
    min: 0,
  },
  DaThanhToan: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentTerms: [paymentTermSchema],
  // === Điều khoản SLA ===
  TrangThai: {
    type: String,
    enum: ['draft', 'created', 'signed', 'delivering', 'completed', 'disputed', 'cancelled'],
    default: 'draft',
  },
  slaDeadline: { type: Date },
  terms: {
    sla: { type: String, default: '' },
    penalty: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  // === 11 Điều khoản Pháp lý ===
  articles: {
    article1: { type: String, default: '' },
    article2: { type: String, default: '' },
    article3: { type: String, default: '' },
    article4: { type: String, default: '' },
    article5: { type: String, default: '' },
    article6: { type: String, default: '' },
    article7: { type: String, default: '' },
    article8: { type: String, default: '' },
    article9: { type: String, default: '' },
    article10: { type: String, default: '' },
    article11: { type: String, default: '' },
  },
  // === Khóa Web3 — Liên kết phi tập trung ===
  SmartContractAddress: { type: String, default: '' },
  DocumentHash: { type: String, default: '' },       // Mã băm SHA-256 của file PDF gốc
  IPFSCID: { type: String, default: '' },             // Mã CID trên IPFS (Pinata)
  TransactionHash: { type: String, default: '' },     // Mã giao dịch ký số qua MetaMask
  // === Địa chỉ ví ===
  vtscAddress: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  // === Chữ ký ===
  vtscSignature: { type: String, default: '' },
  clientSignature: { type: String, default: '' },
  // === Embedded: Chi tiết sản phẩm ===
  ChiTietHopDong: [chiTietHopDongSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('HopDong', hopDongSchema, 'HopDongs');
