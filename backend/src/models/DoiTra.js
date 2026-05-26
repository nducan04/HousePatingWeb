const mongoose = require('mongoose');

/**
 * Collection: DoiTra (Quản lý khiếu nại & đổi trả)
 * Lưu trữ thông tin về các trường hợp khách hàng yêu cầu đổi trả hàng hóa.
 */
const doiTraSchema = new mongoose.Schema({
  MaDoiTra: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  DonHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonHang',
    required: true
  },
  KhachHang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    required: true
  },
  LyDo: {
    type: String,
    required: [true, 'Vui lòng nhập lý do đổi trả'],
    trim: true
  },
  LoaiYeuCau: {
    type: String,
    enum: ['Bảo hành', 'Khiếu nại', 'Đổi trả'],
    default: 'Đổi trả'
  },
  DuKienDenHang: {
    type: String,
    trim: true
  },
  GiaTriTru: {
    type: Number,
    default: 0
  },
  NhanVienPhuTrach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien'
  },
  TrangThai: {
    type: String,
    enum: ['Yêu cầu mới', 'Đang xử lý', 'Đã hoàn tiền', 'Bị từ chối'],
    default: 'Yêu cầu mới'
  },
  PhuongAnGiaiQuyet: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DoiTra', doiTraSchema, 'DoiTras');
