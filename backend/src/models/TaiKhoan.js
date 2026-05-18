const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const taiKhoanSchema = new mongoose.Schema({
  TenDangNhap: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
  },
  MatKhau: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false,
  },
  Email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Vui lòng nhập email hợp lệ']
  },
  VaiTro: {
    type: String,
    enum: {
      values: ['Admin', 'Director', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'NhaCungCap'],
      message: 'Vai trò không hợp lệ'
    },
    required: [true, 'Vui lòng chọn vai trò'],
  },
  TrangThai: {
    type: Boolean,
    default: true,
  },
  NgayTao: {
    type: Date,
    default: Date.now,
  },
});

// Hash mật khẩu trước khi lưu vào DB
taiKhoanSchema.pre('save', async function (next) {
  // Chỉ hash lại nếu mật khẩu bị thay đổi (tránh hash đè lên chuỗi đã hash)
  if (!this.isModified('MatKhau')) return next();

  const salt = await bcrypt.genSalt(10);
  this.MatKhau = await bcrypt.hash(this.MatKhau, salt);
  next();
});

// So sánh mật khẩu do người dùng nhập với hash trong DB
taiKhoanSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.MatKhau);
};

module.exports = mongoose.model('TaiKhoan', taiKhoanSchema, 'TaiKhoans');
