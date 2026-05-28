const mongoose = require('mongoose');

/**
 * Collection: BaoHanh (Quản lý bảo hành & hậu mãi)
 * Lưu trữ thông tin về các yêu cầu hỗ trợ kỹ thuật và bảo hành sản phẩm.
 */
const baoHanhSchema = new mongoose.Schema({
  MaBaoHanh: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  KhachHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    required: true
  },
  HopDong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HopDong'
  },
  DonHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonHang'
  },
  SanPham: {
    type: String, // Có thể là text hoặc reference, trong ảnh là text tóm tắt
    required: true,
    trim: true
  },
  NoiDungLoi: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung lỗi'],
    trim: true
  },
  KyThuatKCS: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien' // Kỹ thuật viên chịu trách nhiệm
  },
  HanBaoHanh: {
    type: Date,
    required: true
  },
  NgayMua: {
    type: Date
  },
  TrangThai: {
    type: String,
    enum: ['Mở', 'Đang khảo sát', 'Đã khắc phục', 'Hết hạn BH'],
    default: 'Mở'
  },
  GhiChuKyThuat: {
    type: String,
    trim: true
  },
  PhuongAnGiaiQuyet: {
    type: String,
    trim: true
  },
  KhachHangDanhGia: {
    type: Number,
    min: 1,
    max: 5
  },
  HinhAnh: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('BaoHanh', baoHanhSchema, 'BaoHanhs');
