const NhaCungCap = require('../models/NhaCungCap');

// @desc    Lấy danh sách nhà cung cấp (phân trang + lọc)
// @route   GET /api/nha-cung-cap
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sort = '-createdAt' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { MaNCC: { $regex: search, $options: 'i' } },
        { TenNCC: { $regex: search, $options: 'i' } },
        { NguoiLienHe: { $regex: search, $options: 'i' } },
        { MaSoThue: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await NhaCungCap.countDocuments(filter);
    const data = await NhaCungCap.find(filter)
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

// @desc    Lấy chi tiết 1 nhà cung cấp
exports.getById = async (req, res) => {
  try {
    const item = await NhaCungCap.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhà cung cấp' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Tạo nhà cung cấp mới
exports.create = async (req, res) => {
  try {
    const item = await NhaCungCap.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã nhà cung cấp đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật nhà cung cấp
exports.update = async (req, res) => {
  try {
    const item = await NhaCungCap.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhà cung cấp' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa nhà cung cấp
exports.remove = async (req, res) => {
  try {
    const item = await NhaCungCap.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy nhà cung cấp' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
