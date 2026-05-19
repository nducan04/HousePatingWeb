const mongoose = require('mongoose');
const NhanVien = require('./src/models/NhanVien');
require('dotenv').config();

async function inspectEmployees() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    const employees = await NhanVien.find({});
    console.log(`--- DANH SÁCH NHÂN SỰ HỆ THỐNG (${employees.length} nhân viên) ---`);
    employees.forEach(nv => {
      console.log(`- Tên: ${nv.HoTen}`);
      console.log(`  + Mã NV: ${nv.MaNV}`);
      console.log(`  + Bộ phận: "${nv.BoPhan}"`);
      console.log(`  + Chức vụ: "${nv.ChucVu || ''}"`);
      console.log(`  + Trạng thái: "${nv.TrangThai || ''}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error inspecting employees:', err);
    process.exit(1);
  }
}

inspectEmployees();
