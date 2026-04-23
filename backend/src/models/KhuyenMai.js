const mongoose = require('mongoose');

const khuyenMaiSchema = new mongoose.Schema({
  MaVoucher: {
    type: String,
    required: [true, 'Mã Voucher là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true
  },
  LoaiGiamGia: {
    type: String,
    enum: ['PHAN_TRAM', 'GIAM_THANG', 'TANG_KEM'],
    default: 'PHAN_TRAM'
  },
  MucGiam: {
    type: Number, // If percentage, it's 10 for 10%. If fixed, it's 500000.
    required: true,
    min: 0
  },
  GiamToiDa: {
    type: Number,
    default: 0 // 0 means no limit for percentage discounts
  },
  DonHangToiThieu: {
    type: Number,
    default: 0
  },
  NgayBatDau: {
    type: Date,
    default: Date.now
  },
  NgayHetHan: {
    type: Date,
    required: [true, 'Ngày hết hạn là bắt buộc']
  },
  SoLuongToiDa: {
    type: Number,
    required: true,
    min: 1
  },
  SoLuongDaDung: {
    type: Number,
    default: 0
  },
  TrangThai: {
    type: String,
    enum: ['DANG_DIEN_RA', 'LEN_LICH', 'DA_KET_THUC'],
    default: 'DANG_DIEN_RA'
  },
  GhiChu: String,
  NhanVienTao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien'
  }
}, {
  timestamps: true
});

// Middleware to automatically update status based on date
khuyenMaiSchema.pre('save', function(next) {
  const now = new Date();
  if (this.NgayHetHan < now || this.SoLuongDaDung >= this.SoLuongToiDa) {
    this.TrangThai = 'DA_KET_THUC';
  } else if (this.NgayBatDau > now) {
    this.TrangThai = 'LEN_LICH';
  } else {
    this.TrangThai = 'DANG_DIEN_RA';
  }
  next();
});

module.exports = mongoose.model('KhuyenMai', khuyenMaiSchema);
