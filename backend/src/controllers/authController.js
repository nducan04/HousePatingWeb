const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const KhachHang = require('../models/KhachHang');
const jwt = require('jsonwebtoken');

// Hàm tạo Access Token (chứa AccountID + Role trong payload)
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

// Hàm tạo Refresh Token (chỉ chứa AccountID — bảo mật tối đa)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

/**
 * Hàm tiện ích: Truy vấn profile nghiệp vụ từ AccountID
 * Admin/NhanVien → Collection NhanVien
 * KhachHangB2B/B2C → Collection KhachHang
 */
const getProfileByAccount = async (accountId, role) => {
  if (role === 'Admin' || role === 'NhanVien') {
    return await NhanVien.findOne({ AccountID: accountId });
  } else {
    return await KhachHang.findOne({ AccountID: accountId });
  }
};

// @desc    Đăng nhập người dùng (Tạo Access + Refresh Token)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    // Xác thực format đầu vào
    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tên đăng nhập và mật khẩu' });
    }

    // Tìm tài khoản và chèn trả về mật khẩu (vì select: false trong Schema)
    const taiKhoan = await TaiKhoan.findOne({ TenDangNhap }).select('+MatKhau');

    if (!taiKhoan) {
      return res.status(401).json({ success: false, error: 'Thông tin đăng nhập không hợp lệ' });
    }

    // Kiểm tra trạng thái tài khoản (bị khóa hay không)
    if (!taiKhoan.TrangThai) {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa' });
    }

    // So sánh mật khẩu nhập với hash trong DB
    const isMatch = await taiKhoan.matchPassword(MatKhau);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Thông tin đăng nhập không hợp lệ' });
    }

    // Khởi tạo cả 2 token
    const accessToken = generateAccessToken(taiKhoan._id, taiKhoan.VaiTro);
    const refreshToken = generateRefreshToken(taiKhoan._id);

    // Cấu hình cookie HttpOnly cho Refresh Token (7 ngày)
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,       // Bảo vệ khỏi XSS
      secure: false,        // Tắt secure trên localhost để trình duyệt nhận cookie qua http
      sameSite: 'lax',      // Dùng lax cho môi trường phát triển
    };

    // Truy vấn profile nghiệp vụ
    const userProfile = await getProfileByAccount(taiKhoan._id, taiKhoan.VaiTro);

    res
      .status(200)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json({
        success: true,
        accessToken,
        user: {
          id: taiKhoan._id,
          username: taiKhoan.TenDangNhap,
          role: taiKhoan.VaiTro,
          profile: userProfile || null,
        }
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Lỗi Server' });
  }
};

// @desc    Làm mới Access Token thông qua Refresh Token (HttpOnly Cookie)
// @route   POST /api/auth/refresh
// @access  Public (cookie tự gửi)
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Không tìm thấy refresh token trong cookie' });
    }

    // Giải mã và xác minh Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Kiểm tra tài khoản còn tồn tại và hoạt động
    const taiKhoan = await TaiKhoan.findById(decoded.id);
    if (!taiKhoan || !taiKhoan.TrangThai) {
      return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }

    // Cấp Access Token mới
    const newAccessToken = generateAccessToken(taiKhoan._id, taiKhoan.VaiTro);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
       return res.status(403).json({ success: false, error: 'Refresh token đã hết hạn, vui lòng đăng nhập lại' });
    }
    res.status(403).json({ success: false, error: 'Refresh token không hợp lệ' });
  }
};

// @desc    Lấy thông tin hiện tại của người dùng (từ JWT Token)
// @route   GET /api/auth/me
// @access  Private (yêu cầu Bearer Token)
exports.getMe = async (req, res) => {
  try {
    const taiKhoan = await TaiKhoan.findById(req.user._id);

    if (!taiKhoan) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    }

    // Truy vấn profile nghiệp vụ
    const userProfile = await getProfileByAccount(taiKhoan._id, taiKhoan.VaiTro);

    res.status(200).json({
      success: true,
      user: {
        id: taiKhoan._id,
        username: taiKhoan.TenDangNhap,
        role: taiKhoan.VaiTro,
        profile: userProfile || null,
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, error: 'Lỗi Server' });
  }
};

// @desc    Đăng xuất (Xóa Refresh Token khỏi Cookie)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Hết hạn ngay trong 10 giây
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
    message: 'Đăng xuất thành công',
  });
};
