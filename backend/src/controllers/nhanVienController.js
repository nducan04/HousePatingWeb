const NhanVien = require('../models/NhanVien');

// @desc    Lấy danh sách nhân viên (phân trang + lọc)
// @route   GET /api/nhan-vien
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 300, search, chucVu, sort = '-createdAt' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { MaNV: { $regex: search, $options: 'i' } },
        { HoTen: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
      ];
    }
    if (chucVu) filter.ChucVu = { $regex: chucVu, $options: 'i' };

    const total = await NhanVien.countDocuments(filter);
    const data = await NhanVien.find(filter)
      .populate('AccountID', 'TenDangNhap VaiTro TrangThai')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true, count: data.length, total,
      page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server: ' + error.message });
  }
};

// @desc    Lấy chi tiết 1 nhân viên
// @route   GET /api/nhan-vien/:id
exports.getById = async (req, res) => {
  try {
    const item = await NhanVien.findById(req.params.id).populate('AccountID', 'TenDangNhap VaiTro TrangThai');
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhân viên' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Tạo nhân viên mới
// @route   POST /api/nhan-vien
exports.create = async (req, res) => {
  try {
    const item = await NhanVien.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã nhân viên hoặc email đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật nhân viên
// @route   PUT /api/nhan-vien/:id
exports.update = async (req, res) => {
  try {
    const item = await NhanVien.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhân viên' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa nhân viên
// @route   DELETE /api/nhan-vien/:id
exports.remove = async (req, res) => {
  try {
    const item = await NhanVien.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhân viên' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Lấy chi tiết nhân viên qua AccountID
// @route   GET /api/nhan-vien/account/:accountId
exports.getByAccountId = async (req, res) => {
  try {
    const item = await NhanVien.findOne({ AccountID: req.params.accountId }).populate('AccountID', 'TenDangNhap VaiTro TrangThai');
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin nhân viên cho tài khoản này' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
