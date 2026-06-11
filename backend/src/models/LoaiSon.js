const mongoose = require('mongoose');

/**
 * Collection: LoaiSon (Phân loại sơn)
 * Bảng độc lập quản lý danh mục các loại sơn theo yêu cầu.
 */
const loaiSonSchema = new mongoose.Schema({
  MaLoaiSon: {
    type: String,
    required: [true, 'Vui lòng nhập mã loại sơn'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  TenLoaiSon: {
    type: String,
    required: [true, 'Vui lòng nhập tên loại sơn'],
    trim: true,
  },
  HinhAnh: {
    type: String,
    trim: true,
  },
  MoTa: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('LoaiSon', loaiSonSchema, 'LoaiSons');
