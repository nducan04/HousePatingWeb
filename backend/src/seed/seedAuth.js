const mongoose = require("mongoose");
const dotenv = require("dotenv");
const TaiKhoan = require("../models/TaiKhoan");
const NhanVien = require("../models/NhanVien");
const KhachHang = require("../models/KhachHang");
const connectDB = require("../utils/db");
dotenv.config();

const seedAuth = async () => {
  try {
    await connectDB();

    // === XÓA DỮ LIỆU CŨ ===
    console.log("Đang xóa dữ liệu cũ...");
    await TaiKhoan.deleteMany();
    await NhanVien.deleteMany();

    // === 1. TẠO TÀI KHOẢN ADMIN ===
    console.log("Tạo tài khoản Admin...");
    const adminAccount = await TaiKhoan.create({
      TenDangNhap: "admin",
      MatKhau: "123456",
      Email: "admin@vtsc.vn",
      VaiTro: "Admin",
      TrangThai: true,
    });

    // Tạo NhanVien profile cho Admin
    await NhanVien.create({
      AccountID: adminAccount._id,
      MaNV: "NV001",
      HoTen: "admin",
      Email: "admin@vtsc.vn",
      SDT: "0901234567",
      ChucVu: "Quản trị viên",
    });

    // === 2. TẠO TÀI KHOẢN NHÂN VIÊN ===
    console.log("Tạo tài khoản Nhân viên...");
    const staffAccount = await TaiKhoan.create({
      TenDangNhap: "nhanvien",
      MatKhau: "123456",
      Email: "nhanvien@vtsc.vn",
      VaiTro: "NhanVien",
      TrangThai: true,
    });

    await NhanVien.create({
      AccountID: staffAccount._id,
      MaNV: "NV002",
      HoTen: "Nguyễn Duy Dũng",
      Email: "nguyenduydung@vtsc.vn",
      SDT: "0902345678",
      ChucVu: "Nhân viên Kinh doanh",
    });

    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("  ✅ SEED HOÀN TẤT — Tài khoản mẫu:");
    console.log("═══════════════════════════════════════");
    console.log("  Admin:      admin / 123456");
    console.log("  Nhân viên:  nhanvien / 123456");
    console.log("═══════════════════════════════════════");
    console.log("");

    process.exit();
  } catch (error) {
    console.error("Lỗi seed:", error);
    process.exit(1);
  }
};

seedAuth();
