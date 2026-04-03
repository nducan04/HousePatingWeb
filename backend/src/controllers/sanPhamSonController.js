const SanPhamSon = require('../models/SanPhamSon');

/**
 * Helper: Xây query phân trang + lọc + tìm kiếm
 */
const buildQuery = (queryParams) => {
  const { page = 1, limit = 20, search, thuongHieu, phanLoai, sort = '-createdAt' } = queryParams;
  const filter = {};

  if (search) {
    filter.$or = [
      { MaSanPham: { $regex: search, $options: 'i' } },
      { TenDongSon: { $regex: search, $options: 'i' } },
      { 'DanhSachMaMau.MaMau': { $regex: search, $options: 'i' } },
      { 'DanhSachMaMau.TenMau': { $regex: search, $options: 'i' } },
    ];
  }
  if (thuongHieu) filter.ThuongHieu = thuongHieu;
  if (phanLoai) filter.PhanLoai = phanLoai;

  return { filter, page: parseInt(page), limit: parseInt(limit), sort };
};

// @desc    Lấy danh sách sản phẩm (phân trang + lọc)
// @route   GET /api/san-pham-son
exports.getAll = async (req, res) => {
  try {
    const { filter, page, limit, sort } = buildQuery(req.query);
    const total = await SanPhamSon.countDocuments(filter);
    const data = await SanPhamSon.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server: ' + error.message });
  }
};

// @desc    Lấy chi tiết 1 sản phẩm
// @route   GET /api/san-pham-son/:id
exports.getById = async (req, res) => {
  try {
    const item = await SanPhamSon.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/san-pham-son
exports.create = async (req, res) => {
  try {
    const item = await SanPhamSon.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã sản phẩm đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/san-pham-son/:id
exports.update = async (req, res) => {
  try {
    const item = await SanPhamSon.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/san-pham-son/:id
exports.remove = async (req, res) => {
  try {
    const item = await SanPhamSon.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Thêm mã màu vào sản phẩm
// @route   POST /api/san-pham-son/:id/ma-mau
exports.addColor = async (req, res) => {
  try {
    const item = await SanPhamSon.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });

    item.DanhSachMaMau.push(req.body);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật mã màu
// @route   PUT /api/san-pham-son/:id/ma-mau/:colorId
exports.updateColor = async (req, res) => {
  try {
    const item = await SanPhamSon.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });

    const color = item.DanhSachMaMau.id(req.params.colorId);
    if (!color) return res.status(404).json({ success: false, error: 'Không tìm thấy mã màu' });

    Object.assign(color, req.body);
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa mã màu
// @route   DELETE /api/san-pham-son/:id/ma-mau/:colorId
exports.removeColor = async (req, res) => {
  try {
    const item = await SanPhamSon.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });

    const color = item.DanhSachMaMau.id(req.params.colorId);
    if (!color) return res.status(404).json({ success: false, error: 'Không tìm thấy mã màu' });

    color.deleteOne();
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
