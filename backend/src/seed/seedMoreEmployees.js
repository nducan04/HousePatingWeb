const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const connectDB = require('../utils/db');

dotenv.config();

const employeesData = [
  {
    MaNV: 'NV003',
    HoTen: 'Trần Thị Mai',
    Email: 'maitran@vtsc.vn',
    SDT: '0912000003',
    BoPhan: 'Kinh doanh',
    ChucVu: 'Chuyên viên Kinh doanh',
    TenDangNhap: 'nv003',
    GioiTinh: 'Nữ'
  },
  {
    MaNV: 'NV004',
    HoTen: 'Lê Văn Tùng',
    Email: 'tunglv@vtsc.vn',
    SDT: '0912000004',
    BoPhan: 'Kinh doanh',
    ChucVu: 'CSKH & Hỗ trợ đại lý',
    TenDangNhap: 'nv004',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV005',
    HoTen: 'Hoàng Minh Đức',
    Email: 'duchm@vtsc.vn',
    SDT: '0912000005',
    BoPhan: 'Kỹ thuật',
    ChucVu: 'Kỹ sư R&D Sơn',
    TenDangNhap: 'nv005',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV006',
    HoTen: 'Phạm Hồng Nhung',
    Email: 'nhungph@vtsc.vn',
    SDT: '0912000006',
    BoPhan: 'Kỹ thuật',
    ChucVu: 'Chuyên viên Pha màu',
    TenDangNhap: 'nv006',
    GioiTinh: 'Nữ'
  },
  {
    MaNV: 'NV007',
    HoTen: 'Nguyễn Văn Hùng',
    Email: 'hungnv@vtsc.vn',
    SDT: '0912000007',
    BoPhan: 'Sản xuất',
    ChucVu: 'Tổ trưởng Tổ sản xuất',
    TenDangNhap: 'nv007',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV008',
    HoTen: 'Vũ Anh Tuấn',
    Email: 'tuanva@vtsc.vn',
    SDT: '0912000008',
    BoPhan: 'Sản xuất',
    ChucVu: 'Nhân viên Vận hành Máy',
    TenDangNhap: 'nv008',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV009',
    HoTen: 'Đặng Thu Hà',
    Email: 'hadt@vtsc.vn',
    SDT: '0912000009',
    BoPhan: 'Kho',
    ChucVu: 'Quản lý Kho thành phẩm',
    TenDangNhap: 'nv009',
    GioiTinh: 'Nữ'
  },
  {
    MaNV: 'NV010',
    HoTen: 'Bùi Xuân Hợp',
    Email: 'hopbx@vtsc.vn',
    SDT: '0912000010',
    BoPhan: 'Kho',
    ChucVu: 'Nhân viên Kiểm kho',
    TenDangNhap: 'nv010',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV011',
    HoTen: 'Ngô Quốc Bảo',
    Email: 'baonq@vtsc.vn',
    SDT: '0912000011',
    BoPhan: 'Giao nhận',
    ChucVu: 'Tài xế chuyên dụng (Team A)',
    TenDangNhap: 'nv011',
    GioiTinh: 'Nam'
  },
  {
    MaNV: 'NV012',
    HoTen: 'Lý Tiểu Phụng',
    Email: 'phunglt@vtsc.vn',
    SDT: '0912000012',
    BoPhan: 'Giao nhận',
    ChucVu: 'Tài xế chuyên dụng (Team B)',
    TenDangNhap: 'nv012',
    GioiTinh: 'Nữ'
  }
];

const seedMoreEmployees = async () => {
  try {
    await connectDB();
    console.log('--- Đang bắt đầu tạo thêm 10 nhân sự ---');

    for (const data of employeesData) {
      // Check if NhanVien exists by MaNV
      const existingNV = await NhanVien.findOne({ MaNV: data.MaNV });
      if (existingNV) {
        console.log(`[!] Bỏ qua ${data.MaNV} - ${data.HoTen} (Đã tồn tại)`);
        continue;
      }

      // 1. Create TaiKhoan
      const account = await TaiKhoan.create({
        TenDangNhap: data.TenDangNhap,
        MatKhau: '123456',
        Email: data.Email,
        VaiTro: 'NhanVien',
        TrangThai: true
      });

      // 2. Create NhanVien
      await NhanVien.create({
        AccountID: account._id,
        MaNV: data.MaNV,
        HoTen: data.HoTen,
        Email: data.Email,
        SDT: data.SDT,
        BoPhan: data.BoPhan,
        ChucVu: data.ChucVu,
        GioiTinh: data.GioiTinh,
        TrangThai: 'Đang làm'
      });

      console.log(`[+] Đã tạo xong: ${data.MaNV} - ${data.HoTen} (${data.BoPhan})`);
    }

    console.log('--- Hoàn tất quá trình tạo nhân sự mẫu ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed:', error);
    process.exit(1);
  }
};

seedMoreEmployees();
