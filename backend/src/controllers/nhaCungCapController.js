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
      ];
    }

    const total = await NhaCungCap.countDocuments(filter);
    const data = await NhaCungCap.find(filter)
      .populate('AccountID', 'TenDangNhap Email VaiTro')
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

const TaiKhoan = require('../models/TaiKhoan');
const NguyenVatLieu = require('../models/NguyenVatLieu');

// @desc    Tạo/Cấp tài khoản đăng nhập cho nhà cung cấp
exports.createAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, Email } = req.body;
    const supplierId = req.params.id;

    const supplier = await NhaCungCap.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhà cung cấp' });
    }

    if (supplier.AccountID) {
      return res.status(400).json({ success: false, error: 'Nhà cung cấp này đã được cấp tài khoản' });
    }

    // Tạo tài khoản mới
    const account = await TaiKhoan.create({
      TenDangNhap,
      MatKhau,
      Email,
      VaiTro: 'NhaCungCap',
      TrangThai: true
    });

    // Liên kết tài khoản vào nhà cung cấp
    supplier.AccountID = account._id;
    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Cấp tài khoản nhà cung cấp thành công',
      data: account
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập hoặc Email đã tồn tại trong hệ thống' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Lấy thông tin nhà cung cấp của tài khoản đăng nhập hiện tại
exports.getMyProfile = async (req, res) => {
  try {
    const supplier = await NhaCungCap.findOne({ AccountID: req.user._id });
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin nhà cung cấp liên kết với tài khoản này' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Lấy danh sách vật tư của nhà cung cấp hiện tại
exports.getMyMaterials = async (req, res) => {
  try {
    let supplierId;
    if (req.user.role === 'Admin' && req.query.supplierId) {
      supplierId = req.query.supplierId;
    } else {
      const supplier = await NhaCungCap.findOne({ AccountID: req.user._id });
      if (!supplier) {
        return res.status(404).json({ success: false, error: 'Tài khoản chưa được liên kết với nhà cung cấp nào' });
      }
      supplierId = supplier._id;
    }

    const materials = await NguyenVatLieu.find({ NhaCungCap: supplierId }).sort('-createdAt');
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Nhà cung cấp tự thêm vật tư mới
exports.createMyMaterial = async (req, res) => {
  try {
    let supplierId;
    if (req.user.role === 'Admin' && req.body.NhaCungCap) {
      supplierId = req.body.NhaCungCap;
    } else {
      const supplier = await NhaCungCap.findOne({ AccountID: req.user._id });
      if (!supplier) {
        return res.status(404).json({ success: false, error: 'Tài khoản chưa được liên kết với nhà cung cấp nào' });
      }
      supplierId = supplier._id;
    }

    const { MaNVL, TenNguyenVatLieu, PhanLoai, DonViTinh, DonGia, GiaNhapDinhMuc, GhiChu } = req.body;
    const materialCode = MaNVL || 'NVL' + Date.now().toString().slice(-6);

    const material = await NguyenVatLieu.create({
      MaNVL: materialCode,
      TenNguyenVatLieu,
      PhanLoai,
      DonViTinh,
      DonGia: DonGia || 0,
      GiaNhapDinhMuc: GiaNhapDinhMuc || DonGia || 0,
      NhaCungCap: supplierId,
      GhiChu
    });

    res.status(201).json({ success: true, message: 'Thêm vật tư thành công', data: material });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã vật tư đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Nhà cung cấp cập nhật báo giá vật tư
exports.updateMyMaterial = async (req, res) => {
  try {
    let supplierId;
    if (req.user.role === 'Admin') {
      const material = await NguyenVatLieu.findByIdAndUpdate(req.params.materialId, req.body, { new: true });
      if (!material) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy vật tư' });
      }
      return res.status(200).json({ success: true, message: 'Cập nhật báo giá thành công', data: material });
    }

    const supplier = await NhaCungCap.findOne({ AccountID: req.user._id });
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Tài khoản chưa được liên kết với nhà cung cấp nào' });
    }
    supplierId = supplier._id;

    const { TenNguyenVatLieu, PhanLoai, DonViTinh, DonGia, GiaNhapDinhMuc, GhiChu } = req.body;

    const material = await NguyenVatLieu.findOneAndUpdate(
      { _id: req.params.materialId, NhaCungCap: supplierId },
      {
        TenNguyenVatLieu,
        PhanLoai,
        DonViTinh,
        DonGia,
        GiaNhapDinhMuc,
        GhiChu
      },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy vật tư hoặc vật tư không thuộc nhà cung cấp này' });
    }

    res.status(200).json({ success: true, message: 'Cập nhật báo giá thành công', data: material });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
