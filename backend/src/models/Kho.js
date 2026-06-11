const mongoose = require('mongoose');

/**
 * Collection: Kho (Thông tin kho lưu trữ)
 * Lưu trữ thông tin địa lý và người phụ trách của kho.
 * Lưu ý: Vì hệ thống áp dụng mô hình 1 kho tập trung, số lượng tồn kho vật lý 
 * được thiết kế nhúng trực tiếp vào thuộc tính của SanPhamSon và NguyenVatLieu 
 * để tối ưu tốc độ truy vấn NoSQL. Bảng này dùng để quản lý cấu hình thông tin kho.
 */
const khoSchema = new mongoose.Schema({
  MaKho: {
    type: String,
    required: [true, 'Vui lòng nhập mã kho'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  TenKho: {
    type: String,
    required: [true, 'Vui lòng nhập tên kho'],
    trim: true,
  },
  MoTa: {
    type: String,
    trim: true,
  },
  DiaChi: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ kho'],
    trim: true,
  },
  NguoiQuanLy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
  },
  TrangThai: {
    type: Boolean,
    default: true, // true: Đang hoạt động, false: Đã đóng cửa
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Kho', khoSchema, 'Khos');
