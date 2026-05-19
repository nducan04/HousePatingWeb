const mongoose = require('mongoose');

/**
 * Collection: NhaCungCap (Nhà cung cấp)
 * Theo BRD: Lưu trữ hồ sơ đối tác cung ứng vật tư đầu vào.
 */
const nhaCungCapSchema = new mongoose.Schema({
  MaNCC: {
    type: String,
    required: [true, 'Vui lòng nhập mã nhà cung cấp'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  TenNCC: {
    type: String,
    required: [true, 'Vui lòng nhập tên nhà cung cấp'],
    trim: true,
  },
  NguoiLienHe: {
    type: String,
    trim: true,
  },
  DiaChi: {
    type: String,
    trim: true,
  },
  SDT: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true,
  },
  Email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  MaSoThue: {
    type: String,
    trim: true,
  },
  PhanLoai: {
    type: String,
    enum: ['Đối Tác Chính', 'Đối Tác Phụ'],
    default: 'Đối Tác Chính',
  },
  CongNo: {
    type: Number,
    default: 0,
  },
  AccountID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaiKhoan',
  },
}, {
  timestamps: true,
});

nhaCungCapSchema.index({ TenNCC: 'text', MaNCC: 'text' });

module.exports = mongoose.model('NhaCungCap', nhaCungCapSchema, 'NhaCungCaps');
