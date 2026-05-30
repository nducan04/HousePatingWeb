const VanChuyen = require('../models/VanChuyen');
const DonHang = require('../models/DonHang');

// @desc    Get all tracking records
// @route   GET /api/van-chuyen
exports.getAllTracking = async (req, res) => {
  try {
    let query = {};
    if (req.user && (req.user.VaiTro === 'KhachHangB2C' || req.user.VaiTro === 'KhachHangB2B')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (kh) {
        // Find all orders belonging to this customer
        const orders = await DonHang.find({ KhachHang: kh._id });
        const orderIds = orders.map(o => o._id);
        query.DonHang = { $in: orderIds };
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    const tracking = await VanChuyen.find(query)
      .populate({
        path: 'DonHang',
        populate: { path: 'KhachHang' }
      })
      .populate('VanChuyenInfo.NhanVien');
    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tracking by tracking code (Public)
// @route   GET /api/van-chuyen/track/:code
exports.getTrackingByCode = async (req, res) => {
  try {
    const tracking = await VanChuyen.findOne({ MaVanChuyen: req.params.code })
      .populate({
        path: 'DonHang',
        populate: { path: 'KhachHang' }
      })
      .populate('VanChuyenInfo.NhanVien');

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin vận chuyển cho mã này' });
    }

    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tracking by Order ID
// @route   GET /api/van-chuyen/order/:orderId
exports.getTrackingByOrder = async (req, res) => {
  try {
    const tracking = await VanChuyen.findOne({ DonHang: req.params.orderId })
      .populate({
        path: 'DonHang',
        populate: { path: 'KhachHang' }
      })
      .populate('VanChuyenInfo.NhanVien');
    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin vận chuyển cho đơn hàng này' });
    }

    // RBAC check
    if (req.user && (req.user.VaiTro === 'KhachHangB2C' || req.user.VaiTro === 'KhachHangB2B')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (!kh || !tracking.DonHang || tracking.DonHang.KhachHang?._id.toString() !== kh._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập thông tin vận chuyển này.' });
      }
    }

    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new tracking record
// @route   POST /api/van-chuyen
exports.createTracking = async (req, res) => {
  try {
    const tracking = await VanChuyen.create(req.body);
    res.status(201).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tracking log (Add new entry to timeline)
// @route   PATCH /api/van-chuyen/:id/log
exports.updateTrackingLog = async (req, res) => {
  try {
    const tracking = await VanChuyen.findById(req.params.id);
    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ vận chuyển' });
    }

    tracking.LoTrinh.push(req.body);
    await tracking.save();

    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tracking record (logs, status, images)
// @route   PATCH /api/van-chuyen/:id
exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrangThaiTongQuat, LoTrinh, HinhAnhGiaoHang, BienBanFile } = req.body;

    const updateData = {};
    if (TrangThaiTongQuat) updateData.TrangThaiTongQuat = TrangThaiTongQuat;
    if (LoTrinh) updateData.LoTrinh = LoTrinh;
    if (HinhAnhGiaoHang) updateData.HinhAnhGiaoHang = HinhAnhGiaoHang;
    if (BienBanFile) updateData['LoHang.BienBanFile'] = BienBanFile;

    const tracking = await VanChuyen.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate({
      path: 'DonHang',
      populate: { path: 'KhachHang' }
    }).populate('VanChuyenInfo.NhanVien');

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi vận chuyển' });
    }

    // Nếu trạng thái mới là "Giao hàng thành công", cập nhật trạng thái đơn hàng tương ứng
    if (TrangThaiTongQuat === 'Giao hàng thành công') {
      await DonHang.findByIdAndUpdate(tracking.DonHang, {
        TrangThai: 'DA_GIAO',
        TrangThaiThanhToan: 'DA_THANH_TOAN' // Giả định giao xong là hoàn tất thanh toán nếu là COD
      });
    }

    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
