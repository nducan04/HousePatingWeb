const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const KhachHang = require('../models/KhachHang');
const connectDB = require('../utils/db');
dotenv.config();

const seedAuth = async () => {
  try {
    await connectDB();

    // === XÓA DỮ LIỆU CŨ ===
    console.log('Đang xóa dữ liệu cũ...');
    await TaiKhoan.deleteMany();
    await NhanVien.deleteMany();
    // Không xóa KhachHang vì có thể có dữ liệu nhập từ Excel

    // === 1. TẠO TÀI KHOẢN ADMIN ===
    console.log('Tạo tài khoản Admin...');
    const adminAccount = await TaiKhoan.create({
      TenDangNhap: 'admin',
      MatKhau: '123456',
      VaiTro: 'Admin',
      TrangThai: true,
    });

    // Tạo NhanVien profile cho Admin
    await NhanVien.create({
      AccountID: adminAccount._id,
      MaNV: 'NV001',
      HoTen: 'Phí Bình Minh',
      Email: 'phibinhminh@vtsc.vn',
      SDT: '0901234567',
      ChucVu: 'Trưởng phòng Kinh doanh Sơn',
    });

    // === 2. TẠO TÀI KHOẢN NHÂN VIÊN ===
    console.log('Tạo tài khoản Nhân viên...');
    const staffAccount = await TaiKhoan.create({
      TenDangNhap: 'staff',
      MatKhau: '123456',
      VaiTro: 'NhanVien',
      TrangThai: true,
    });

    await NhanVien.create({
      AccountID: staffAccount._id,
      MaNV: 'NV002',
      HoTen: 'Nguyễn Duy Dũng',
      Email: 'nguyenduydung@vtsc.vn',
      SDT: '0902345678',
      ChucVu: 'Nhân viên Kinh doanh',
    });

    // === 3. TẠO TÀI KHOẢN KHÁCH HÀNG B2B MẪU ===
    console.log('Tạo tài khoản Khách hàng B2B mẫu...');
    const b2bAccount = await TaiKhoan.create({
      TenDangNhap: 'khachhang_ncc',
      MatKhau: '123456',
      VaiTro: 'KhachHangB2B',
      TrangThai: true,
    });

    // Kiểm tra KhachHang đã tồn tại chưa (tránh lỗi duplicate)
    const existingKH = await KhachHang.findOne({ MaKH: 'KH-B2B-001' });
    if (!existingKH) {
      await KhachHang.create({
        AccountID: b2bAccount._id,
        MaKH: 'KH-B2B-001',
        PhanLoai: 'B2B',
        TenKhachHang: 'Công ty TNHH NCC Aluminium',
        Email: 'contact@ncc-aluminium.vn',
        SDT: '0243456789',
        DiaChi: 'KCN Phố Nối A, Hưng Yên',
        WalletAddress: '',
      });
    } else {
      // Cập nhật AccountID nếu KH đã tồn tại
      existingKH.AccountID = b2bAccount._id;
      await existingKH.save();
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  ✅ SEED HOÀN TẤT — Tài khoản mẫu:');
    console.log('═══════════════════════════════════════');
    console.log('  Admin:      admin / 123456');
    console.log('  Nhân viên:  staff / 123456');
    console.log('  Khách B2B:  khachhang_ncc / 123456');
    console.log('═══════════════════════════════════════');
    console.log('');

    process.exit();
  } catch (error) {
    console.error('Lỗi seed:', error);
    process.exit(1);
  }
};

seedAuth();