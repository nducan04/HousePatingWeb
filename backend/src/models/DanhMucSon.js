const mongoose = require('mongoose');

const danhMucSonSchema = new mongoose.Schema({
  TenDanhMuc: {
    type: String,
    required: [true, 'Vui lòng nhập tên danh mục'],
    unique: true,
    trim: true,
  },
  MoTa: {
    type: String,
    trim: true,
  },
  TrangThai: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('DanhMucSon', danhMucSonSchema, 'DanhMucSons');
