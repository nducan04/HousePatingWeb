const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const NhanVien = require('../models/NhanVien');
const connectDB = require('../utils/db');

dotenv.config();

const seedSalesAssignments = async () => {
  try {
    await connectDB();
    console.log('--- Đang bắt đầu gán dữ liệu doanh số cho nhân sự ---');

    // 1. Lấy danh sách nhân viên Kinh doanh
    const salesStaff = await NhanVien.find({ 
      BoPhan: { $in: ['Kinh doanh', 'Sale / MKT', 'CSKH Bảo Hành'] } 
    });

    if (salesStaff.length === 0) {
      console.log('[!] Không tìm thấy nhân viên kinh doanh nào. Vui lòng chạy seedMoreEmployees.js trước.');
      process.exit(1);
    }

    console.log(`[i] Tìm thấy ${salesStaff.length} nhân viên kinh doanh.`);

    // 2. Cập nhật Đơn hàng
    const orders = await DonHang.find({ TrangThai: { $ne: 'DA_HUY' } });
    console.log(`[i] Cập nhật ${orders.length} đơn hàng...`);
    
    for (const order of orders) {
      const randomStaff = salesStaff[Math.floor(Math.random() * salesStaff.length)];
      order.NhanVienPhuTrach = randomStaff._id;
      await order.save();
    }

    // 3. Cập nhật Hợp đồng
    const contracts = await HopDong.find({ TrangThai: { $nin: ['cancelled', 'draft'] } });
    console.log(`[i] Cập nhật ${contracts.length} hợp đồng...`);

    for (const contract of contracts) {
      const randomStaff = salesStaff[Math.floor(Math.random() * salesStaff.length)];
      contract.EmployeeID = randomStaff._id;
      await contract.save();
    }

    console.log('--- Gán dữ liệu hoàn tất ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed Sales Assignments:', error);
    process.exit(1);
  }
};

seedSalesAssignments();
