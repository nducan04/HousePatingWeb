const KhachHang = require('../models/KhachHang');
const HopDong = require('../models/HopDong');
const DonHang = require('../models/DonHang');

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
    const rawData = await KhachHang.find(filter)
      .populate('AccountID', 'TenDangNhap VaiTro TrangThai')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // Tính số đơn hàng cho mỗi khách (bao gồm cả Hợp đồng B2B và Đơn hàng E-commerce)
    const data = await Promise.all(rawData.map(async (kh) => {
      const [countContracts, countOrders] = await Promise.all([
        HopDong.countDocuments({ CustomerID: kh._id }),
        DonHang.countDocuments({ KhachHang: kh._id })
      ]);
      return { ...kh, SoDonHang: countContracts + countOrders };
    }));

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
    let maKH = req.body.MaKH;
    if (!maKH) {
      // Auto-generate VTSC-KH-xxx
      const lastKhachHang = await KhachHang.findOne({ MaKH: /^VTSC-KH-/ }).sort({ MaKH: -1 });
      let nextId = 1;
      if (lastKhachHang && lastKhachHang.MaKH) {
        const parts = lastKhachHang.MaKH.split('-');
        if (parts.length >= 3) {
          const currentId = parseInt(parts[2], 10);
          if (!isNaN(currentId)) {
            nextId = currentId + 1;
          }
        }
      }
      req.body.MaKH = `VTSC-KH-${String(nextId).padStart(3, '0')}`;
    }

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
    let item = await KhachHang.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' });

    // Customer can only update their own profile
    if (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C') {
      if (item.AccountID.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa thông tin người khác' });
      }
    }

    item = await KhachHang.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });

    // Tự động đồng bộ tên, SĐT, Địa chỉ mới sang các đơn hàng đang chờ hoặc đang xử lý
    // để chuẩn bị cho quá trình vận chuyển
    if (item && (req.body.TenKhachHang || req.body.SDT || req.body.DiaChi)) {
      const DonHang = require('../models/DonHang');
      const updateFields = {};
      if (req.body.TenKhachHang) updateFields.TenNguoiNhan = req.body.TenKhachHang;
      if (req.body.SDT) updateFields.SDTNguoiNhan = req.body.SDT;
      if (req.body.DiaChi) updateFields.DiaChiGiaoHang = req.body.DiaChi;

      await DonHang.updateMany(
        {
          KhachHang: item._id,
          TrangThai: { $in: ['CHO_XAC_NHAN', 'DANG_XU_LY'] }
        },
        { $set: updateFields }
      );
    }

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
