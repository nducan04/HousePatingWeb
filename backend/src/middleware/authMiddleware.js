const jwt = require('jsonwebtoken');
const TaiKhoan = require('../models/TaiKhoan');

// Bypass auth logic for local development if needed, but required here per specs.
// Protected routes
exports.protect = async (req, res, next) => {
  let token;

  // Lấy token từ header Authorization theo dạng "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Gắn user vào req để các controller phía sau sử dụng
      req.user = await TaiKhoan.findById(decoded.id);

      if (!req.user || !req.user.TrangThai) {
        return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Silently return 401 so frontend can trigger refresh token logic without spamming backend logs
        return res.status(401).json({ success: false, error: 'TokenExpired' });
      }
      console.error('Error with token verification:', error.message);
      return res.status(401).json({ success: false, error: 'Token không hợp lệ' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Không được phép truy cập, không có token' });
  }
};

// Cấp quyền dựa trên VaiTro (RBAC)
// @roles - spread array chứa những role được phép ('Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.VaiTro) {
      return res.status(403).json({ success: false, error: 'Quyền truy cập bị từ chối' });
    }

    if (!roles.includes(req.user.VaiTro)) {
      return res.status(403).json({
        success: false,
        error: `Quản lý phân quyền (RBAC): Vai trò ${req.user.VaiTro} không được phép thực hiện hành động này!`
      });
    }

    next();
  };
};
