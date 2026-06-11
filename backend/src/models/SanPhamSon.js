const mongoose = require('mongoose');

// 1. CHUYỂN TỒN KHO VÀO TRONG MÃ MÀU
const maMauSchema = new mongoose.Schema({
  MaMau: { type: String, required: [true, 'Vui lòng nhập mã màu'], trim: true, uppercase: true },
  TenMau: { type: String, required: [true, 'Vui lòng nhập tên màu'], trim: true },
  HexCode: { type: String, trim: true, match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Mã màu Hex không hợp lệ'] },
  HinhAnh: { type: String, trim: true },
  
  // NÂNG CẤP TỒN KHO CHUẨN B2B (Đưa vào từng mã màu)
  TonKhoKhaDung: { type: Number, default: 0, min: 0 }, // Số lượng Sales được phép bán
  TonKhoTamGiu: { type: Number, default: 0, min: 0 },  // Đã ký hợp đồng nhưng chưa xuất kho
  NguongCanhBao: { type: Number, default: 200 },       // Dưới 200kg sẽ báo động đỏ
  
  // THÔNG SỐ KỸ THUẬT CHI TIẾT CỦA MÀU SƠN
  ThongSoKyThuat: {
    DanhMuc: { type: String },
    DoBong: { type: String },
    BeMat: { type: String },
    UngDung: { type: String },
    DoPhuLyThuyet: { type: String },
    QuyCachDongGoi: { type: String },
    QuyTrinhPhaChe: { type: String }
  },

  TrangThai: { type: Boolean, default: true },
}, { _id: true });

// 2. BẢNG CHA CHỈ CHỨA THÔNG TIN CHUNG
const sanPhamSonSchema = new mongoose.Schema({
  MaSanPham: { type: String, required: [true, 'Vui lòng nhập mã sản phẩm'], unique: true, trim: true, uppercase: true },
  TenDongSon: { type: String, required: [true, 'Vui lòng nhập tên dòng sơn'], trim: true },
  ThuongHieu: { type: String, default: 'AkzoNobel' },
  PhanLoai: { 
    type: String, 
    required: [true, 'Vui lòng chọn phân loại sản phẩm']
  },
  MoTa: { type: String, trim: true },
  DonViTinh: { 
    type: String, 
    enum: {
      values: ['Thùng', 'Thùng'],
      message: 'Đơn vị tính không hợp lệ'
    }, 
    default: 'Thùng' 
  },
  DonGiaCoSo: { type: Number, required: [true, 'Vui lòng nhập đơn giá'], min: [0, 'Giá không được âm'] },
  HinhAnh: [{ type: String, trim: true }],
  
  // Thông tin truy xuất nguồn gốc (QR)
  TruyXuatNguonGoc: {
    HoaDonMuaSon: { type: String, trim: true },
    QuyTrinhSanXuat: { type: String, trim: true },
    NgaySanXuat: { type: Date },
    HanSuDung: { type: String, trim: true }
  },
  
  // Tính tổng tự động từ mảng MaMau (Không nhập tay)
  TongTonKho: { type: Number, default: 0 }, 
  TonKho: { type: Number }, // Legacy field for compatibility
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
