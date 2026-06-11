const PhanHoiHoTro = require('../models/PhanHoiHoTro');

exports.getSessions = async (req, res) => {
  try {
    const userRole = req.user.VaiTro;
    let query = {};
    
    // Nếu là khách hàng, chỉ thấy chat của chính mình
    if (userRole === 'KhachHangB2B' || userRole === 'KhachHangB2C') {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (!kh) return res.status(404).json({ success: false, message: 'Customer not found' });
      query.CustomerID = kh._id;
    }

    const sessions = await PhanHoiHoTro.find(query)
      .populate('CustomerID', 'TenKhachHang SoDienThoai Email')
      .populate('AssignedTo', 'HoTen')
      .sort({ updatedAt: -1 });

    const mappedSessions = sessions.map(s => ({
      _id: s._id,
      KhachHangID: s.CustomerID,
      NhanVienID: s.AssignedTo,
      Status: s.TrangThai === 'Đã đóng' ? 'closed' : 'open',
      Messages: s.LichSuTraLoi ? s.LichSuTraLoi.map(m => ({
        senderRole: m.NguoiTraLoi === 'KhachHang' ? 'KhachHangB2C' : m.NguoiTraLoi === 'NhanVien' ? 'NhanVien' : 'AI',
        senderName: m.NguoiTraLoi,
        content: m.NoiDung,
        timestamp: m.ThoiGian
      })) : []
    }));

    res.status(200).json({ success: true, data: mappedSessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const s = await PhanHoiHoTro.findById(req.params.id)
      .populate('CustomerID', 'TenKhachHang SoDienThoai Email')
      .populate('AssignedTo', 'HoTen');
      
    if (!s) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const mappedSession = {
      _id: s._id,
      KhachHangID: s.CustomerID,
      NhanVienID: s.AssignedTo,
      Status: s.TrangThai === 'Đã đóng' ? 'closed' : 'open',
      Messages: s.LichSuTraLoi ? s.LichSuTraLoi.map(m => ({
        senderRole: m.NguoiTraLoi === 'KhachHang' ? 'KhachHangB2C' : m.NguoiTraLoi === 'NhanVien' ? 'NhanVien' : 'AI',
        senderName: m.NguoiTraLoi,
        content: m.NoiDung,
        timestamp: m.ThoiGian
      })) : []
    };
    
    res.status(200).json({ success: true, data: mappedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrGetSession = async (req, res) => {
  try {
    const userRole = req.user.VaiTro;
    let customerId;

    if (userRole === 'KhachHangB2B' || userRole === 'KhachHangB2C') {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (!kh) return res.status(404).json({ success: false, message: 'Customer not found' });
      customerId = kh._id;
    } else {
      customerId = req.body.customerId;
      if (!customerId) return res.status(400).json({ success: false, message: 'Missing customerId' });
    }

    let session = await PhanHoiHoTro.findOne({ CustomerID: customerId, TrangThai: { $ne: 'Đã đóng' } })
      .populate('CustomerID', 'TenKhachHang SoDienThoai Email');
    
    if (!session) {
      session = await PhanHoiHoTro.create({
        MaPhanHoi: `HT-${Date.now()}`,
        CustomerID: customerId,
        PhanLoai: 'Hỗ trợ kỹ thuật',
        NoiDungYeuCau: 'Live Chat Support',
        LichSuTraLoi: []
      });
      session = await PhanHoiHoTro.findById(session._id).populate('CustomerID', 'TenKhachHang SoDienThoai Email');
    }

    const mappedSession = {
      _id: session._id,
      KhachHangID: session.CustomerID,
      NhanVienID: session.AssignedTo,
      Status: session.TrangThai === 'Đã đóng' ? 'closed' : 'open',
      Messages: session.LichSuTraLoi ? session.LichSuTraLoi.map(m => ({
        senderRole: m.NguoiTraLoi === 'KhachHang' ? 'KhachHangB2C' : m.NguoiTraLoi === 'NhanVien' ? 'NhanVien' : 'AI',
        senderName: m.NguoiTraLoi,
        content: m.NoiDung,
        timestamp: m.ThoiGian
      })) : []
    };

    res.status(200).json({ success: true, data: mappedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
