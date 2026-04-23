const TaiKhoan = require('../models/TaiKhoan');
const bcrypt = require('bcryptjs');

// @desc    Lấy danh sách tài khoản
// @route   GET /api/tai-khoan
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, vaiTro } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { TenDangNhap: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
      ];
    }
    if (vaiTro) filter.VaiTro = vaiTro;

    const total = await TaiKhoan.countDocuments(filter);
    const data = await TaiKhoan.find(filter)
      .sort('-NgayTao')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true, count: data.length, total,
      page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Tạo tài khoản mới
// @route   POST /api/tai-khoan
exports.create = async (req, res) => {
  try {
    const { TenDangNhap, Email, MatKhau, VaiTro, TrangThai } = req.body;
    
    // Mật khẩu mặc định nếu không truyền
    const passwordToUse = MatKhau || 'VTSC@123';
    
    const item = await TaiKhoan.create({
      TenDangNhap,
      Email,
      MatKhau: passwordToUse,
      VaiTro,
      TrangThai: TrangThai !== undefined ? TrangThai : true
    });
    
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập hoặc Email đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật tài khoản
// @route   PUT /api/tai-khoan/:id
exports.update = async (req, res) => {
  try {
    const { MatKhau, ...updateFields } = req.body;
    
    if (MatKhau) {
      // Nếu có cập nhật mật khẩu, phải hash lại
      const salt = await bcrypt.genSalt(10);
      updateFields.MatKhau = await bcrypt.hash(MatKhau, salt);
    }

    const item = await TaiKhoan.findByIdAndUpdate(req.params.id, updateFields, {
      new: true, runValidators: true,
    });
    
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập hoặc Email bị trùng' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa tài khoản
// @route   DELETE /api/tai-khoan/:id
exports.remove = async (req, res) => {
  try {
    const item = await TaiKhoan.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
