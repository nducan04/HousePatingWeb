const mongoose = require('mongoose');

// 1. CHUYỂN TỒN KHO VÀO TRONG MÃ MÀU
const maMauSchema = new mongoose.Schema({
  MaMau: { type: String, required: true, trim: true, uppercase: true },
  TenMau: { type: String, required: true, trim: true },
  HexCode: { type: String, trim: true, match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Mã Hex không hợp lệ'] },
  HinhAnh: { type: String, trim: true },
  
  // NÂNG CẤP TỒN KHO CHUẨN B2B (Đưa vào từng mã màu)
  TonKhoKhaDung: { type: Number, default: 0, min: 0 }, // Số lượng Sales được phép bán
  TonKhoTamGiu: { type: Number, default: 0, min: 0 },  // Đã ký hợp đồng nhưng chưa xuất kho
  NguongCanhBao: { type: Number, default: 200 },       // Dưới 200kg sẽ báo động đỏ
  
  TrangThai: { type: Boolean, default: true },
}, { _id: true });

// 2. BẢNG CHA CHỈ CHỨA THÔNG TIN CHUNG
const sanPhamSonSchema = new mongoose.Schema({
  MaSanPham: { type: String, required: true, unique: true, trim: true, uppercase: true },
  TenDongSon: { type: String, required: true, trim: true },
  ThuongHieu: { type: String, default: 'AkzoNobel' },
  PhanLoai: { type: String, enum: ['Sơn tĩnh điện', 'Sơn tàu biển', 'Sơn công nghiệp', 'Sơn nội thất'] },
  MoTa: { type: String, trim: true },
  DonViTinh: { type: String, enum: ['Thùng', 'Kg'], default: 'Kg' }, // Bán sơn theo Kg chuẩn hơn
  DonGiaCoSo: { type: Number, required: true, min: 0 },
  HinhAnh: { type: String, trim: true },
  
  // Tính tổng tự động từ mảng MaMau (Không nhập tay)
  TongTonKho: { type: Number, default: 0 }, 
  SoLuongDaBan: { type: Number, default: 0 },
  
  DanhGia: [{
    KhachHang: String,
    SoSao: { type: Number, min: 1, max: 5 },
    BinhLuan: String,
    NgayDanhGia: { type: Date, default: Date.now }
  }],
  DanhSachMaMau: [maMauSchema],
}, { timestamps: true });

// Middleware: Tự động cộng tổng tồn kho từ các mã màu trước khi lưu
sanPhamSonSchema.pre('save', function(next) {
  if (this.DanhSachMaMau && this.DanhSachMaMau.length > 0) {
    this.TongTonKho = this.DanhSachMaMau.reduce((total, mau) => total + (mau.TonKhoKhaDung || 0), 0);
  } else {
    this.TongTonKho = 0;
  }
  next();
});

sanPhamSonSchema.index({ TenDongSon: 'text', MaSanPham: 'text', ThuongHieu: 'text' });
module.exports = mongoose.model('SanPhamSon', sanPhamSonSchema, 'SanPhamSons');
