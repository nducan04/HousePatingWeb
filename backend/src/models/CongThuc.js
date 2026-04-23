const mongoose = require('mongoose');

/**
 * Collection: CongThuc (Công thức pha chế sơn)
 * Theo đặc tả: Quản lý tỷ lệ nguyên vật liệu cho từng mã màu/loại sơn.
 */
const thanhPhanSchema = new mongoose.Schema({
  NguyenVatLieu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NguyenVatLieu',
    required: true
  },
  TiLe: {
    type: Number, // Phần trăm (%)
    required: true,
    min: 0,
    max: 100
  },
  KhoiLuongDinhMuc: {
    type: Number, // Tính toán mặc định cho 1 đơn vị cơ sở (kg)
    default: 0
  }
}, { _id: false });

const congThucSchema = new mongoose.Schema({
  MaCongThuc: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  TenCongThuc: {
    type: String,
    required: true
  },
  SanPham: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SanPhamSon',
    required: true
  },
  MaMau: {
    type: String, // Liên kết với MaMau trong SanPhamSon
    required: true
  },
  Version: {
    type: String,
    default: '1.0'
  },
  ThanhPhan: [thanhPhanSchema],
  GhiChu: String,
  TrangThai: {
    type: String,
    enum: ['Active', 'Draft', 'Deprecated'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CongThuc', congThucSchema, 'CongThucs');
