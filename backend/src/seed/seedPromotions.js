const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KhuyenMai = require('../models/KhuyenMai');
const NhanVien = require('../models/NhanVien');
const connectDB = require('../utils/db');

dotenv.config();

const promotionsData = [
  {
    MaVoucher: 'SUMMER2024',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 15,
    GiamToiDa: 1000000,
    DonHangToiThieu: 5000000,
    SoLuongToiDa: 200,
    GhiChu: 'Chương trình khuyến mãi Hè rực rỡ cho các dòng sơn ngoại thất.'
  },
  {
    MaVoucher: 'PARTNER5M',
    LoaiGiamGia: 'GIAM_THANG',
    MucGiam: 5000000,
    DonHangToiThieu: 100000000,
    SoLuongToiDa: 20,
    GhiChu: 'Ưu đãi đặc biệt cho đối tác B2B ký hợp đồng nguyên tắc.'
  },
  {
    MaVoucher: 'NEWUSER',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 5,
    GiamToiDa: 200000,
    DonHangToiThieu: 1000000,
    SoLuongToiDa: 1000,
    GhiChu: 'Khuyến mãi cho khách hàng mới đăng ký tài khoản.'
  },
  {
    MaVoucher: 'FLASH20',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 20,
    GiamToiDa: 500000,
    DonHangToiThieu: 3000000,
    SoLuongToiDa: 50,
    GhiChu: 'Flash Sale giờ vàng - Số lượng có hạn!'
  },
  {
    MaVoucher: 'OPENING',
    LoaiGiamGia: 'GIAM_THANG',
    MucGiam: 1000000,
    DonHangToiThieu: 10000000,
    SoLuongToiDa: 100,
    GhiChu: 'Voucher khai trương chi nhánh mới.'
  },
  {
    MaVoucher: 'PREORDER',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 10,
    GiamToiDa: 0,
    DonHangToiThieu: 0,
    SoLuongToiDa: 500,
    NgayBatDau: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Start in 7 days
    NgayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    GhiChu: 'Khuyến mãi đặt trước cho dòng sơn thế hệ mới (Lên lịch).'
  },
  {
    MaVoucher: 'EXPIRED_SALE',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 10,
    GiamToiDa: 500000,
    DonHangToiThieu: 2000000,
    SoLuongToiDa: 100,
    NgayBatDau: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    NgayHetHan: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
    GhiChu: 'Khuyến mãi đã hết hạn để test bộ lọc.'
  }
];

const seedPromotions = async () => {
  try {
    await connectDB();
    console.log('--- Đang bắt đầu tạo dữ liệu Khuyến mãi ---');

    // 1. Get an employee to link as creator
    const admin = await NhanVien.findOne({ MaNV: 'NV001' });
    const creatorId = admin ? admin._id : null;

    for (const data of promotionsData) {
      // Check if voucher exists
      const existing = await KhuyenMai.findOne({ MaVoucher: data.MaVoucher });
      if (existing) {
        console.log(`[!] Bỏ qua ${data.MaVoucher} (Đã tồn tại)`);
        continue;
      }

      // Set default dates if not provided
      const promo = {
        ...data,
        NhanVienTao: creatorId,
        NgayBatDau: data.NgayBatDau || new Date(),
        NgayHetHan: data.NgayHetHan || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Default 90 days
      };

      await KhuyenMai.create(promo);
      console.log(`[+] Đã tạo Voucher: ${data.MaVoucher} - ${data.GhiChu}`);
    }

    console.log('--- Hoàn tất quá trình tạo dữ liệu khuyến mãi ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed Khuyến mãi:', error);
    process.exit(1);
  }
};

seedPromotions();
