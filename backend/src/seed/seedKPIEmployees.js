const mongoose = require('mongoose');
const dotenv = require('dotenv');
const NhanVien = require('../models/NhanVien');
const connectDB = require('../utils/db');

dotenv.config();

const seedKPIEmployees = async () => {
  try {
    await connectDB();
    console.log('--- Đang bắt đầu cập nhật dữ liệu KPI cho nhân sự ---');

    const employees = await NhanVien.find({});
    
    if (employees.length === 0) {
      console.log('[!] Không tìm thấy nhân sự nào để cập nhật.');
      process.exit(0);
    }

    for (const nv of employees) {
      let soDonDaBan = 0;
      let soMauDaPha = 0;
      let soDonDaGiao = 0;
      let diemKPI = Math.floor(Math.random() * 40) + 60; // 60 - 100
      let diemDanhGia = Math.floor(Math.random() * 20) + 80; // 80 - 100

      // Phân bổ KPI theo phòng ban
      switch (nv.BoPhan) {
        case 'Kinh doanh':
        case 'Sale / MKT':
        case 'CSKH Bảo Hành':
          soDonDaBan = Math.floor(Math.random() * 50) + 10;
          break;
        case 'Kỹ thuật':
        case 'Sản xuất':
          soMauDaPha = Math.floor(Math.random() * 100) + 20;
          break;
        case 'Kho':
        case 'Giao nhận':
        case 'Logistic':
        case 'Vận tải':
          soDonDaGiao = Math.floor(Math.random() * 80) + 30;
          break;
        default:
          // Admin hoặc các phòng ban khác
          soDonDaBan = Math.floor(Math.random() * 5);
          soMauDaPha = Math.floor(Math.random() * 5);
          soDonDaGiao = Math.floor(Math.random() * 5);
      }

      // Cập nhật dữ liệu
      nv.HieuSuatKPI = {
        ...nv.HieuSuatKPI,
        diemKPI,
        diemDanhGia,
        soDonDaBan,
        soMauDaPha,
        soDonDaGiao,
        tyLeMotDon: Math.floor(Math.random() * 15) + 85, // 85-100%
        tyLeTestMau: Math.floor(Math.random() * 20) + 80   // 80-100%
      };

      await nv.save();
      console.log(`[+] Đã cập nhật KPI cho: ${nv.MaNV} - ${nv.HoTen} (${nv.BoPhan})`);
    }

    console.log('--- Hoàn tất cập nhật dữ liệu KPI mẫu ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed KPI:', error);
    process.exit(1);
  }
};

seedKPIEmployees();
