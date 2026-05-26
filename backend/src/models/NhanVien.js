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
  GioiTinh: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác'],
  },
  Email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  Avatar: {
    type: String,
    trim: true,
  },
  SDT: {
    type: String,
    trim: true,
  },
  DiaChi: {
    type: String,
    trim: true,
  },
  BoPhan: {
    type: String,
    trim: true,
  },
  ChucVu: {
    type: String,
    required: [true, 'Vui lòng nhập chức vụ'],
    trim: true,
  },
  MoTaCongViec: {
    type: String,
    trim: true,
  },
  TrangThai: {
    type: String,
    enum: ['Đang làm', 'Đang nghỉ phép', 'Đã nghỉ việc'],
    default: 'Đang làm'
  },
  HieuSuatKPI: {
    diemKPI: { type: Number, default: 0 },
    tyLeMotDon: { type: Number, default: 0 },
    tyLeTestMau: { type: Number, default: 0 },
    // Chi tiết KPI theo nghiệp vụ
    soDonDaBan: { type: Number, default: 0 },     // Cho NV Kinh doanh
    soMauDaPha: { type: Number, default: 0 },      // Cho NV Kỹ thuật
    soDonDaGiao: { type: Number, default: 0 },    // Cho NV Giao nhận / Kho
    diemDanhGia: { type: Number, default: 0 },    // Điểm đánh giá trung bình (0-100)
  },
}, {
  timestamps: true,
});

nhanVienSchema.index({ Email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('NhanVien', nhanVienSchema, 'NhanViens');
