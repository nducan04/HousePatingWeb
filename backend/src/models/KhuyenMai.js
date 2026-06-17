const mongoose = require('mongoose');

const khuyenMaiSchema = new mongoose.Schema({
  MaKhuyenMai: { 
    type: String, 
    required: [true, 'Vui lòng nhập mã khuyến mãi'],
    unique: true,
    trim: true 
  },
  TenChuongTrinh: { 
    type: String, 
    required: [true, 'Vui lòng nhập tên chương trình']
  },
  PhanTramGiam: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  NgayBatDau: { 
    type: Date, 
    required: true 
  },
  NgayKetThuc: { 
    type: Date, 
    required: true 
  },
  SoLuongToiDa: {
    type: Number,
    required: true,
    min: 1,
    default: 100
  },
  TrangThai: { 
    type: String, 
    enum: ['Đang diễn ra', 'Tạm dừng', 'Đã kết thúc'],
    default: 'Đang diễn ra' 
  },
  // Áp dụng Embedded Document để tối ưu hiệu suất, không cần JOIN
  DanhSachApDung: [{
    MaKhachHang: { type: String, required: true },
    NgayApDung: { type: Date, default: Date.now },
    SoTienGiam: { type: Number, default: 0 }
  }]
}, {
  timestamps: true 
});

module.exports = mongoose.model('KhuyenMai', khuyenMaiSchema, 'KhuyenMais');
