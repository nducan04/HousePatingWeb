const TinTuc = require('../models/TinTuc');

// @desc    Lấy danh sách tin tức
// @route   GET /api/tin-tuc
exports.getAll = async (req, res) => {
  try {
    const data = await TinTuc.find()
      .populate('NhanVienDang', 'MaNV HoTen')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Tạo bài viết mới
// @route   POST /api/tin-tuc
exports.create = async (req, res) => {
  try {
    const { MaTinTuc, TieuDe, NoiDung, HinhAnh, GhiChu, TrangThai, Abstract } = req.body;
    
    // Tìm NhanVien ID từ req.user (được thiết lập bởi protect middleware)
    let nhanVienDangId = undefined;
    if (req.user) {
      const NhanVien = require('../models/NhanVien');
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) nhanVienDangId = nv._id;
    }

    const item = await TinTuc.create({
      MaTinTuc,
      TieuDe,
      NoiDung,
      HinhAnh,
      GhiChu,
      TrangThai,
      Abstract,
      NhanVienDang: nhanVienDangId
    });
    
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cập nhật bài viết
// @route   PUT /api/tin-tuc/:id
exports.update = async (req, res) => {
  try {
    const item = await TinTuc.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa bài viết
// @route   DELETE /api/tin-tuc/:id
exports.remove = async (req, res) => {
  try {
    const item = await TinTuc.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
