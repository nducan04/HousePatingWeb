const mongoose = require('mongoose');

/**
 * Collection: VanChuyen (Theo dõi vận chuyển)
 * Lưu trữ chi tiết lộ trình và thông tin lô hàng đang giao.
 */
const vanChuyenSchema = new mongoose.Schema({
  MaVanChuyen: {
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
  LoHang: {
    SoKien: { type: Number, default: 0 },
    KhoiLuong: { type: Number, default: 0 }, // kg
    MauSon: String,
    BienBanFile: String // URL hoặc tên file
  },
  VanChuyenInfo: {
    DonVi: { type: String, default: 'Đội xe nội bộ (Xe 2.5T)' },
    NhanVien: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NhanVien',
      required: true 
    },
    SDT: String,
    PhiVC: { type: Number, default: 0 }
  },
  LoTrinh: [{
    ThoiGian: { type: Date, default: Date.now },
    NoiDung: String,
    Status: {
      type: String,
      enum: ['COMPLETE', 'PROCESSING', 'PENDING'],
      default: 'PROCESSING'
    },
    Icon: String // lucide icon name
  }],
  TrangThaiTongQuat: {
    type: String,
    default: 'Đang giao hàng'
  },
  DuKienBanGiao: Date,
  HinhAnhGiaoHang: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('VanChuyen', vanChuyenSchema, 'VanChuyens');
