const mongoose = require('mongoose');

/**
 * Collection: KPIHieuSuat
 * Bảng quản lý hiệu suất KPI riêng biệt của nhân viên theo từng kỳ.
 */
const kpiHieuSuatSchema = new mongoose.Schema({
  MaKPI: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  NhanVien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true
  },
  KyDanhGia: {
    type: String, // Ví dụ: "Tháng 10/2026", "Quý 3/2026"
    required: true,
    trim: true
  },
  SoDonHoanThanh: {
    type: Number,
    default: 0,
    min: 0
  },
  TyLeLoi: {
    type: Number, // Phần trăm (%)
    default: 0,
    min: 0,
    max: 100
  },
  DiemDanhGia: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KPIHieuSuat', kpiHieuSuatSchema, 'KPIHieuSuats');
