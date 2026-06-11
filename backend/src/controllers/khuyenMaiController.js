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
    const { MaKhuyenMai, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc } = req.body;
    
    const newKhuyenMai = await KhuyenMai.create({
      MaKhuyenMai,
      TenChuongTrinh,
      PhanTramGiam,
      NgayBatDau,
      NgayKetThuc,
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
