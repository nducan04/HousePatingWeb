const mongoose = require('mongoose');
const NhanVien = require('./src/models/NhanVien');
const HopDong = require('./src/models/HopDong');
const KhachHang = require('./src/models/KhachHang');
require('dotenv').config();

async function seedHR() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/VTSC_DB');
    console.log('Connected to MongoDB');

    // Đảm bảo có ít nhất 1 khách hàng để tạo Hợp đồng
    let customer = await KhachHang.findOne();
    if (!customer) {
      customer = await KhachHang.create({
        MaKH: 'KH-DUMMY-HR',
        PhanLoai: 'B2B',
        TenKhachHang: 'Công ty Cổ phần Thử nghiệm Pháp lý',
        Email: 'phaply@dummy.com',
        SoDienThoai: '0988777666'
      });
      console.log('Đã tạo khách hàng mẫu KH-DUMMY-HR');
    }

    console.log('Seeding NhanVien (Nhân sự)...');
    const hrData = [
      { month: 0, count: 2 }, // T1
      { month: 1, count: 1 }, // T2
      { month: 2, count: 3 }, // T3
      { month: 3, count: 2 }, // T4
      { month: 4, count: 4 }, // T5
    ];

    let nvCounter = 1;
    for (const data of hrData) {
      for (let i = 0; i < data.count; i++) {
        // Tạo nhân viên với createdAt tuỳ chỉnh
        const nv = new NhanVien({
          MaNV: `NV${2026000 + nvCounter}`,
          HoTen: `Nhân viên mẫu ${nvCounter}`,
          ChucVu: 'Nhân viên kinh doanh',
          BoPhan: 'Phòng Kinh Doanh',
          TrangThai: 'Đang làm'
        });

        // Ghi đè createdAt
        nv.createdAt = new Date(2026, data.month, 15);
        nv.updatedAt = new Date(2026, data.month, 15);

        // Lưu bỏ qua validation để giữ nguyên createdAt
        await nv.save({ timestamps: false });
        nvCounter++;
      }
    }
    console.log(`Đã tạo ${nvCounter - 1} nhân viên trải dài từ T1 đến T5/2026.`);

    console.log('Seeding HopDong (Vụ việc pháp lý)...');
    // Xoá các hợp đồng mẫu cũ (tuỳ chọn)
    await HopDong.deleteMany({ title: { $regex: 'Hợp đồng thử nghiệm' } });

    const hopDongs = [];
    for (let i = 1; i <= 5; i++) {
      hopDongs.push({
        MaHopDong: `HD-TEST-${Date.now()}-${i}`,
        title: `Hợp đồng thử nghiệm số ${i}`,
        CustomerID: customer._id,
        TongGiaTri: 50000000 * i,
        // Đặt 2 hợp đồng vào trạng thái tranh chấp (disputed)
        TrangThai: i <= 2 ? 'disputed' : 'completed',
        LoaiHopDong: 'B2B',
      });
    }

    await HopDong.insertMany(hopDongs);
    console.log(`Đã tạo 5 hợp đồng (2 vụ đang tranh chấp).`);

    console.log('Thành công! Đóng kết nối...');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu HR:', error);
    process.exit(1);
  }
}

seedHR();
