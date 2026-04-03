const KhachHang = require('../models/KhachHang');

// @desc    Lấy danh sách khách hàng (phân trang + lọc)
// @route   GET /api/khach-hang
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, phanLoai, sort = '-createdAt' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { MaKH: { $regex: search, $options: 'i' } },
        { TenKhachHang: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
      ];
    }
    if (phanLoai) filter.PhanLoai = phanLoai;

    const total = await KhachHang.countDocuments(filter);
    const data = await KhachHang.find(filter)
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

// @desc    Lấy chi tiết 1 khách hàng
// @route   GET /api/khach-hang/:id
exports.getById = async (req, res) => {
  try {
    const item = await KhachHang.findById(req.params.id).populate('AccountID', 'TenDangNhap VaiTro TrangThai');
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Tạo khách hàng mới
// @route   POST /api/khach-hang
exports.create = async (req, res) => {
  try {
    const item = await KhachHang.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã khách hàng hoặc email đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật khách hàng
// @route   PUT /api/khach-hang/:id
exports.update = async (req, res) => {
  try {
    const item = await KhachHang.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa khách hàng
// @route   DELETE /api/khach-hang/:id
exports.remove = async (req, res) => {
  try {
    const item = await KhachHang.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
