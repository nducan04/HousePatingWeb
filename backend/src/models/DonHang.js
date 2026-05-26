const mongoose = require('mongoose');

/**
 * Collection: DonHang (Đơn hàng khách hàng)
 * Quản lý vòng đời đơn hàng từ lúc đặt đến khi giao/hủy.
 */
const donHangSchema = new mongoose.Schema({
  MaDonHang: {
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
  NhanVienPhuTrach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien'
  },
  Items: [{
    SanPham: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SanPhamSon',
      required: true
    },
    TenSanPham: String,
    MaMau: String,
    SoLuong: {
      type: Number,
      required: true,
      min: 1
    },
    DonGia: {
      type: Number,
      required: true
    },
    ThanhTien: {
      type: Number,
      required: true
    }
  }],
  TienThue: {
    type: Number,
    default: 0
  },
  TongTien: {
    type: Number,
    required: true
  },
  TrangThai: {
    type: String,
    enum: ['CHO_XAC_NHAN', 'DANG_XU_LY', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY'],
    default: 'CHO_XAC_NHAN'
  },
  PhuongThucThanhToan: {
    type: String,
    enum: ['COD', 'BANK_TRANSFER', 'WEB3', 'TIEN_MAT', 'CHUYEN_KHOAN', 'GHI_NO'],
    default: 'TIEN_MAT'
  },
  TrangThaiThanhToan: {
    type: String,
    enum: ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN', 'DA_THANH_TOAN', 'DA_HUY'],
    default: 'CHUA_THANH_TOAN'
  },
  DiaChiGiaoHang: {
    type: String,
    required: true
  },
  TenNguoiNhan: {
    type: String,
  },
  SDTNguoiNhan: {
    type: String,
  },
  HanXacNhan: {
    type: Date,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // 24h từ lúc đặt
  },
  GhiChu: String,
  // New Technical & Financial fields for the enhanced UI
  TongDienTichSon: { type: Number, default: 0 },
  PhuPhi: { type: Number, default: 0 }, // Surcharges (packaging/shipping)
  DaCoc: { type: Number, default: 0 }, // Deposited amount
  GiamGia: { type: Number, default: 0 }, // Discount amount from vouchers
  KhuyenMai: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhuyenMai'
  },
  TechnicalSpecs: {
    LoaiBot: { type: String, default: 'AkzoNobel Interpon' },
    NhietDoSay: { type: String, default: '195°C / 15 phút' },
    DoDayLopPhu: { type: String, default: '75 µm' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DonHang', donHangSchema, 'DonHangs');
