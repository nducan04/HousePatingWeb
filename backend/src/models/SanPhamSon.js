const mongoose = require('mongoose');

/**
 * Sub-document: Mã màu sơn (nhúng vào SanPhamSon)
 * Theo BRD: Mảng DanhSachMaMau chứa chi tiết từng mã màu thuộc dòng sơn.
 */
const maMauSchema = new mongoose.Schema({
  MaMau: {
    type: String,
    required: [true, 'Vui lòng nhập mã màu'],
    trim: true,
    uppercase: true,
  },
  TenMau: {
    type: String,
    required: [true, 'Vui lòng nhập tên màu'],
    trim: true,
  },
  HexCode: {
    type: String,
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Mã Hex không hợp lệ (VD: #FF5733)'],
  },
  HinhAnh: {
    type: String, // URL ảnh mẫu thực tế
    trim: true,
  },
  TrangThai: {
    type: Boolean,
    default: true, // true = đang kinh doanh
  },
}, { _id: true });

/**
 * Collection: SanPhamSon (Sản phẩm Sơn)
 * Thay thế Product.js cũ. Theo BRD: lưu trữ danh mục sơn theo cấu trúc phân cấp,
 * gộp thông tin loại sơn và bảng màu bằng cơ chế nhúng (Embedding).
 */
const sanPhamSonSchema = new mongoose.Schema({
  MaSanPham: {
    type: String,
    required: [true, 'Vui lòng nhập mã sản phẩm'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  TenDongSon: {
    type: String,
    required: [true, 'Vui lòng nhập tên dòng sơn'],
    trim: true,
  },
  ThuongHieu: {
    type: String,
    required: [true, 'Vui lòng nhập thương hiệu'],
    trim: true,
    default: 'AkzoNobel',
  },
  PhanLoai: {
    type: String,
    required: [true, 'Vui lòng chọn phân loại'],
    enum: ['Sơn tĩnh điện', 'Sơn tàu biển', 'Sơn công nghiệp'],
  },
  MoTa: {
    type: String,
    trim: true,
  },
  DonGiaCoSo: {
    type: Number,
    required: [true, 'Vui lòng nhập đơn giá cơ sở'],
    min: 0,
  },
  HinhAnh: {
    type: String,
    trim: true,
  },
  // Thêm vào schema hiện tại của bạn
  TonKho: {
    type: Number,
    default: 0,
    min: [0, 'Tồn kho không được âm']
  },
  // Mảng nhúng (Embedded) — DanhSachMaMau
  DanhSachMaMau: [maMauSchema],
}, {
  timestamps: true,
});

// Text index cho tìm kiếm toàn văn
sanPhamSonSchema.index({ TenDongSon: 'text', MaSanPham: 'text', ThuongHieu: 'text' });

module.exports = mongoose.model('SanPhamSon', sanPhamSonSchema, 'SanPhamSons');
