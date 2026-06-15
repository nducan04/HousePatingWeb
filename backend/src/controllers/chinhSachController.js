const ChinhSach = require('../models/ChinhSach');

// @desc    Lấy danh sách các chính sách
// @route   GET /api/chinh-sach
// @access  Public
exports.getPolicies = async (req, res) => {
  try {
    const policies = await ChinhSach.find({});
    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách chính sách' });
  }
};

// @desc    Cập nhật hoặc tạo mới một chính sách
// @route   POST /api/chinh-sach
// @access  Private/Admin
exports.updatePolicy = async (req, res) => {
  try {
    const { LoaiChinhSach, NoiDung } = req.body;

    if (!LoaiChinhSach || !NoiDung) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp loại chính sách và nội dung' });
    }

    const validTypes = ['DOI_TRA', 'BAO_HANH', 'VAN_CHUYEN', 'HAU_MAI'];
    if (!validTypes.includes(LoaiChinhSach)) {
      return res.status(400).json({ success: false, error: 'Loại chính sách không hợp lệ' });
    }

    let policy = await ChinhSach.findOne({ LoaiChinhSach });

    if (policy) {
      policy.NoiDung = NoiDung;
      await policy.save();
    } else {
      policy = await ChinhSach.create({ LoaiChinhSach, NoiDung });
    }

    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server khi cập nhật chính sách' });
  }
};
