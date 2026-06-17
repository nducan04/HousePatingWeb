const KhuyenMai = require('../models/KhuyenMai');

// Lấy danh sách toàn bộ khuyến mãi
exports.getAllKhuyenMai = async (req, res) => {
  try {
    const listKhuyenMai = await KhuyenMai.find().sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: listKhuyenMai,
      message: 'Lấy danh sách khuyến mãi thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo mới một chương trình khuyến mãi
exports.createKhuyenMai = async (req, res) => {
  try {
    const { MaKhuyenMai, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc, SoLuongToiDa } = req.body;
    
    const newKhuyenMai = await KhuyenMai.create({
      MaKhuyenMai,
      TenChuongTrinh,
      PhanTramGiam,
      NgayBatDau,
      NgayKetThuc,
      SoLuongToiDa,
      DanhSachApDung: [] 
    });

    res.status(201).json({ 
      success: true, 
      data: newKhuyenMai,
      message: 'Tạo khuyến mãi mới thành công' 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Áp dụng mã khuyến mãi: Sử dụng $push để lưu user vào mảng DanhSachApDung
exports.apDungKhuyenMai = async (req, res) => {
  try {
    const { khuyenMaiId } = req.params; 
    const { MaKhachHang, SoTienGiam } = req.body; 

    // Toán tử $push tối ưu hiệu năng
    const updatedKhuyenMai = await KhuyenMai.findByIdAndUpdate(
      khuyenMaiId,
      {
        $push: {
          DanhSachApDung: {
            MaKhachHang: MaKhachHang,
            SoTienGiam: SoTienGiam,
            NgayApDung: new Date()
          }
        }
      },
      { new: true } 
    );

    if (!updatedKhuyenMai) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    res.status(200).json({
      success: true,
      data: updatedKhuyenMai,
      message: 'Áp dụng mã khuyến mãi thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật khuyến mãi
exports.updateKhuyenMai = async (req, res) => {
  try {
    const { khuyenMaiId } = req.params;
    const updateData = req.body;
    
    const updated = await KhuyenMai.findByIdAndUpdate(khuyenMaiId, updateData, { new: true, runValidators: true });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Cập nhật khuyến mãi thành công'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa khuyến mãi
exports.deleteKhuyenMai = async (req, res) => {
  try {
    const { khuyenMaiId } = req.params;
    const deleted = await KhuyenMai.findByIdAndDelete(khuyenMaiId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.validateKhuyenMai = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã khuyến mãi' });
    
    const KhuyenMai = require('../models/KhuyenMai');
    const voucher = await KhuyenMai.findOne({ MaKhuyenMai: { $regex: new RegExp(`^${code}$`, 'i') } });
    if (!voucher) return res.status(404).json({ success: false, message: 'Mã khuyến mãi không tồn tại' });
    
    if (voucher.TrangThai !== 'Đang diễn ra') return res.status(400).json({ success: false, message: 'Mã khuyến mãi không hoạt động' });
    
    const now = new Date();
    if (now < new Date(voucher.NgayBatDau)) return res.status(400).json({ success: false, message: 'Mã khuyến mãi chưa bắt đầu' });
    if (now > new Date(voucher.NgayKetThuc)) return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã hết hạn' });
    
    const maxUsages = voucher.SoLuongToiDa || Number.MAX_SAFE_INTEGER;
    if (voucher.DanhSachApDung && voucher.DanhSachApDung.length >= maxUsages) {
        return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã hết lượt sử dụng' });
    }
    
    const discountAmount = Math.floor((cartTotal * voucher.PhanTramGiam) / 100);

    const responseData = {
        ...voucher.toObject(),
        MaVoucher: voucher.MaKhuyenMai,
        DiscountAmount: discountAmount
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
