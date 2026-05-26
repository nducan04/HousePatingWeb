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
    enum: {
      values: ['B2C', 'B2B', 'Đại lý'],
      message: 'Phân loại khách hàng không hợp lệ'
    },
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
  },
  NgaySinh: {
    type: Date,
  },
  SDT: {
    type: String,
    trim: true,
  },
  DiaChi: {
    type: String,
    trim: true,
  },

  // Mã số thuế cá nhân — Chỉ dùng cho Đại lý
  MaSoThueCaNhan: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});


khachHangSchema.index({ Email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('KhachHang', khachHangSchema, 'KhachHangs');
