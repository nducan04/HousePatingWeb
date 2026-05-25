const mongoose = require('mongoose');

const gioHangItemSchema = new mongoose.Schema({
  SanPham: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SanPhamSon',
    required: true
  },
  MaMau: {
    type: String,
    default: 'N/A'
  },
  SoLuong: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: true });

const gioHangSchema = new mongoose.Schema({
  KhachHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    // Nếu có khách hàng đăng nhập
  },
  SessionId: {
    type: String,
    // Session cho khách vãng lai
  },
  Items: [gioHangItemSchema],
  TongTienTamTinh: {
    type: Number,
    default: 0
  },
  TienThue: {
    type: Number,
    default: 0
  },
  TongThanhToan: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('GioHang', gioHangSchema, 'GioHangs');
