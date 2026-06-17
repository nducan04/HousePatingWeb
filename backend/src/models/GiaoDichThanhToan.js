const mongoose = require('mongoose');

/**
 * Collection: GiaoDichThanhToan
 * Bảng lưu trữ chi tiết các giao dịch thanh toán độc lập cho Đơn hàng và Hợp đồng.
 */
const giaoDichThanhToanSchema = new mongoose.Schema({
  MaGiaoDich: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  DonHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonHang'
  },
  HopDong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HopDong'
  },
  SoTien: {
    type: Number,
    required: true,
    min: 0
  },
  NgayThanhToan: {
    type: Date,
    default: Date.now
  },
  PhuongThucThanhToan: {
    type: String,
    enum: ['COD', 'MOMO', 'GHINO', 'Chuyển khoản', 'Tiền mặt', 'Crypto Token', 'CARD'],
    required: true
  },
  TrangThai: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'SUCCESS'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GiaoDichThanhToan', giaoDichThanhToanSchema, 'GiaoDichThanhToans');
