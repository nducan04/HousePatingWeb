const mongoose = require('mongoose');

/**
 * Collection: NhanVien (Nhân viên nội bộ VTSC)
 * Theo đặc tả: Lưu trữ hồ sơ nhân sự nội bộ (Phòng kinh doanh, Phòng kỹ thuật).
 * Cơ chế Tham chiếu (Reference) 1-1 đến TaiKhoan qua AccountID.
 */
const nhanVienSchema = new mongoose.Schema({
  AccountID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaiKhoan',
    required: true,
  },
  MaNV: {
    type: String,
    required: [true, 'Vui lòng nhập mã nhân viên'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  HoTen: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
  },
  NgaySinh: {
    type: Date,
  },
  Email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  SDT: {
    type: String,
    trim: true,
  },
  ChucVu: {
    type: String,
    required: [true, 'Vui lòng nhập chức vụ'],
    trim: true,
  },
  HieuSuatKPI: {
    diemKPI: { type: Number, default: 0 },
    tyLeMotDon: { type: Number, default: 0 },
    tyLeTestMau: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

nhanVienSchema.index({ Email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('NhanVien', nhanVienSchema, 'NhanViens');
