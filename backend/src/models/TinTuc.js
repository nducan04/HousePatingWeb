const mongoose = require('mongoose');

const tinTucSchema = new mongoose.Schema({
  MaTinTuc: {
    type: String,
    required: [true, 'Vui lòng nhập mã bài viết'],
    unique: true,
    trim: true,
  },
  TieuDe: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề'],
    trim: true,
  },
  Abstract: {
    type: String,
    trim: true,
  },
  NoiDung: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung bài viết'],
  },
  HinhAnh: {
    type: String,
    trim: true,
  },
  GhiChu: {
    type: String,
    trim: true,
  },
  NhanVienDang: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
  },
  TrangThai: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft',
  },
  NgayDang: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('TinTuc', tinTucSchema, 'TinTucs');
