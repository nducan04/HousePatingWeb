const mongoose = require('mongoose');

/**
 * Collection: KhachHang (Khách hàng B2C & B2B)
 * Theo đặc tả: Lưu trữ hồ sơ đối tác, tích hợp định danh ví Web3 cho khách B2B.
 * Cơ chế Tham chiếu (Reference) 1-1 đến TaiKhoan qua AccountID.
 */
const khachHangSchema = new mongoose.Schema({
  AccountID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaiKhoan',
  },
  MaKH: {
    type: String,
    required: [true, 'Vui lòng nhập mã khách hàng'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  PhanLoai: {
    type: String,
    enum: ['B2C', 'B2B'],
    required: [true, 'Vui lòng chọn phân loại khách hàng'],
  },
  TenKhachHang: {
    type: String,
    required: [true, 'Vui lòng nhập tên khách hàng'],
    trim: true,
  },
  Email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
  },
  SDT: {
    type: String,
    trim: true,
  },
  DiaChi: {
    type: String,
    trim: true,
  },
  // Định danh Web3 — Chỉ dùng cho B2B
  WalletAddress: {
    type: String,
    trim: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

// Index sparse cho WalletAddress (chỉ unique nếu có giá trị)
khachHangSchema.index({ WalletAddress: 1 }, { unique: true, sparse: true });
khachHangSchema.index({ Email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('KhachHang', khachHangSchema, 'KhachHangs');
