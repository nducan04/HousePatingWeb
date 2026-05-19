const mongoose = require('mongoose');
const RevenueTarget = require('./src/models/RevenueTarget');
const ProductionTarget = require('./src/models/ProductionTarget');
const SalesTarget = require('./src/models/SalesTarget');
const HopDong = require('./src/models/HopDong');
const LenhSanXuat = require('./src/models/LenhSanXuat');
const KhachHang = require('./src/models/KhachHang');
const NhanVien = require('./src/models/NhanVien');
const CongThuc = require('./src/models/CongThuc');

require('dotenv').config();

// Kế hoạch chỉ tiêu cho 12 tháng năm 2026
const mockData2026 = [
  { thang: 1, quy: 1, nam: 2026, doanhThuKeHoach: 11000000000, sanLuongKeHoach: 1100 },
  { thang: 2, quy: 1, nam: 2026, doanhThuKeHoach: 10500000000, sanLuongKeHoach: 1050 },
  { thang: 3, quy: 1, nam: 2026, doanhThuKeHoach: 11500000000, sanLuongKeHoach: 1150 },
  { thang: 4, quy: 2, nam: 2026, doanhThuKeHoach: 12500000000, sanLuongKeHoach: 1250 },
  { thang: 5, quy: 2, nam: 2026, doanhThuKeHoach: 13000000000, sanLuongKeHoach: 1300 },
  { thang: 6, quy: 2, nam: 2026, doanhThuKeHoach: 13500000000, sanLuongKeHoach: 1350 },
  { thang: 7, quy: 3, nam: 2026, doanhThuKeHoach: 14500000000, sanLuongKeHoach: 1450 },
  { thang: 8, quy: 3, nam: 2026, doanhThuKeHoach: 15500000000, sanLuongKeHoach: 1550 },
  { thang: 9, quy: 3, nam: 2026, doanhThuKeHoach: 17000000000, sanLuongKeHoach: 1700 },
  { thang: 10, quy: 4, nam: 2026, doanhThuKeHoach: 18500000000, sanLuongKeHoach: 1850 },
  { thang: 11, quy: 4, nam: 2026, doanhThuKeHoach: 20000000000, sanLuongKeHoach: 2000 },
  { thang: 12, quy: 4, nam: 2026, doanhThuKeHoach: 22000000000, sanLuongKeHoach: 2200 }
];

// Chỉ tiêu mẫu để seed SalesTarget cho các năm 2024 & 2025
const mockData2024 = [
  { thang: 1, nam: 2024, doanhThuKeHoach: 8500000000, sanLuongKeHoach: 850 },
  { thang: 2, nam: 2024, doanhThuKeHoach: 8200000000, sanLuongKeHoach: 820 },
  { thang: 3, nam: 2024, doanhThuKeHoach: 9000000000, sanLuongKeHoach: 900 },
  { thang: 4, nam: 2024, doanhThuKeHoach: 9800000000, sanLuongKeHoach: 980 },
  { thang: 5, nam: 2024, doanhThuKeHoach: 10200000000, sanLuongKeHoach: 1020 },
  { thang: 6, nam: 2024, doanhThuKeHoach: 10800000000, sanLuongKeHoach: 1080 },
  { thang: 7, nam: 2024, doanhThuKeHoach: 11500000000, sanLuongKeHoach: 1150 },
  { thang: 8, nam: 2024, doanhThuKeHoach: 12200000000, sanLuongKeHoach: 1220 },
  { thang: 9, nam: 2024, doanhThuKeHoach: 13500000000, sanLuongKeHoach: 1350 },
  { thang: 10, nam: 2024, doanhThuKeHoach: 14800000000, sanLuongKeHoach: 1480 },
  { thang: 11, nam: 2024, doanhThuKeHoach: 16000000000, sanLuongKeHoach: 1600 },
  { thang: 12, nam: 2024, doanhThuKeHoach: 17500000000, sanLuongKeHoach: 1750 }
];

const mockData2025 = [
  { thang: 1, nam: 2025, doanhThuKeHoach: 10500000000, sanLuongKeHoach: 1050 },
  { thang: 2, nam: 2025, doanhThuKeHoach: 10200000000, sanLuongKeHoach: 1020 },
  { thang: 3, nam: 2025, doanhThuKeHoach: 11000000000, sanLuongKeHoach: 1100 },
  { thang: 4, nam: 2025, doanhThuKeHoach: 12000000000, sanLuongKeHoach: 1200 },
  { thang: 5, nam: 2025, doanhThuKeHoach: 12500000000, sanLuongKeHoach: 1250 },
  { thang: 6, nam: 2025, doanhThuKeHoach: 13000000000, sanLuongKeHoach: 1300 },
  { thang: 7, nam: 2025, doanhThuKeHoach: 14000000000, sanLuongKeHoach: 1400 },
  { thang: 8, nam: 2025, doanhThuKeHoach: 15000000000, sanLuongKeHoach: 1500 },
  { thang: 9, nam: 2025, doanhThuKeHoach: 16500000000, sanLuongKeHoach: 1650 },
  { thang: 10, nam: 2025, doanhThuKeHoach: 18000000000, sanLuongKeHoach: 1800 },
  { thang: 11, nam: 2025, doanhThuKeHoach: 19500000000, sanLuongKeHoach: 1950 },
  { thang: 12, nam: 2025, doanhThuKeHoach: 21000000000, sanLuongKeHoach: 2100 }
];

async function syncAndSeed2026() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');

    // ─────────────────────────────────────────────────────────────────
    // PHẦN 1: DỌN DẸP & THIẾT LẬP MỤC TIÊU BÁO CÁO 2026 (REVENUE & PRODUCTION TARGET)
    // ─────────────────────────────────────────────────────────────────
    await RevenueTarget.deleteMany({ year: 2026 });
    await ProductionTarget.deleteMany({ year: 2026 });
    console.log('Deleted legacy 2026 targets.');

    const revenueTargets = [];
    const productionTargets = [];

    let totalRevenuePlan = 0;
    let totalProductionPlan = 0;
    const quarterRevPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const quarterProdPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const m of mockData2026) {
      totalRevenuePlan += m.doanhThuKeHoach;
      totalProductionPlan += m.sanLuongKeHoach * 1000;
      quarterRevPlans[m.quy] += m.doanhThuKeHoach;
      quarterProdPlans[m.quy] += m.sanLuongKeHoach * 1000;

      // Kế hoạch tháng
      revenueTargets.push({
        type: 'month',
        year: 2026,
        month: m.thang,
        quarter: null,
        targetAmount: m.doanhThuKeHoach
      });

      productionTargets.push({
        type: 'month',
        year: 2026,
        month: m.thang,
        quarter: null,
        targetAmount: m.sanLuongKeHoach * 1000
      });
    }

    // Kế hoạch quý
    for (let q = 1; q <= 4; q++) {
      revenueTargets.push({ type: 'quarter', year: 2026, month: null, quarter: q, targetAmount: quarterRevPlans[q] });
      productionTargets.push({ type: 'quarter', year: 2026, month: null, quarter: q, targetAmount: quarterProdPlans[q] });
    }

    // Kế hoạch năm
    revenueTargets.push({ type: 'year', year: 2026, month: null, quarter: null, targetAmount: totalRevenuePlan });
    productionTargets.push({ type: 'year', year: 2026, month: null, quarter: null, targetAmount: totalProductionPlan });

    await RevenueTarget.insertMany(revenueTargets);
    await ProductionTarget.insertMany(productionTargets);
    console.log('Seeded RevenueTarget and ProductionTarget for year 2026 successfully!');

    // ─────────────────────────────────────────────────────────────────
    // PHẦN 2: THIẾT LẬP MỤC TIÊU BÁN HÀNG CHO KHÁCH HÀNG TRỌNG TÂM (SALES TARGET)
    // ─────────────────────────────────────────────────────────────────
    await SalesTarget.deleteMany({});
    console.log('Cleaned up legacy SalesTargets.');

    // Tìm tất cả khách hàng B2B
    const b2bCustomers = await KhachHang.find({ PhanLoai: 'B2B' });
    const fallbackCustomer = await KhachHang.findOne() || await KhachHang.create({
      MaKhachHang: 'KH_FALLBACK_B2B',
      TenKhachHang: 'Công ty Cổ phần Sơn VTSC',
      PhanLoai: 'B2B',
      TenNguoiLienHe: 'Phí Minh Thành',
      SoDienThoai: '0987654321',
      Email: 'contact@vtscpaint.com',
      DiaChi: 'Hà Nội, Việt Nam'
    });

    const activeB2BList = b2bCustomers.length > 0 ? b2bCustomers : [fallbackCustomer];
    console.log(`Found ${activeB2BList.length} B2B focus customers.`);

    const salesTargets = [];

    // Hỗ trợ chia sẻ chỉ tiêu: Khách hàng đầu tiên nhận 60%, còn lại chia đều 40%
    const getWeights = (count) => {
      if (count === 1) return [1.0];
      const weights = [0.6];
      const remain = 0.4 / (count - 1);
      for (let idx = 1; idx < count; idx++) {
        weights.push(remain);
      }
      return weights;
    };
    const weights = getWeights(activeB2BList.length);

    const allMockYears = [
      { year: 2024, data: mockData2024 },
      { year: 2025, data: mockData2025 },
      { year: 2026, data: mockData2026 }
    ];

    for (const yearObj of allMockYears) {
      for (const m of yearObj.data) {
        activeB2BList.forEach((cust, cIdx) => {
          const w = weights[cIdx] || 0.1;
          salesTargets.push({
            customer: cust._id,
            period: {
              month: m.thang,
              year: yearObj.year
            },
            targetKg: Math.round(m.sanLuongKeHoach * 1000 * w),
            targetRevenue: Math.round(m.doanhThuKeHoach * w)
          });
        });
      }
    }

    await SalesTarget.insertMany(salesTargets);
    console.log(`Seeded ${salesTargets.length} SalesTargets across 2024, 2025, 2026 successfully!`);

    // ─────────────────────────────────────────────────────────────────
    // PHẦN 3: ĐỒNG BỘ SẢN LƯỢNG THỰC TẾ 2026 (LENHSANXUAT COMPLETED)
    // ─────────────────────────────────────────────────────────────────
    // Lấy công thức sơn và nhân sự mẫu
    let ct = await CongThuc.findOne();
    if (!ct) {
      ct = await CongThuc.create({
        MaCongThuc: 'CT_STANDARD_PAINT',
        TenCongThuc: 'Công thức Sơn tĩnh điện VTSC',
        SanPham: new mongoose.Types.ObjectId(),
        MoTa: 'Công thức sơn tiêu chuẩn dùng cho lệnh sản xuất'
      });
    }

    let nv = await NhanVien.findOne();
    if (!nv) {
      nv = await NhanVien.create({
        MaNV: 'NV001',
        HoTen: 'Phí Bình Minh',
        BoPhan: 'Kinh Doanh'
      });
    }

    // Xóa lệnh sản xuất ảo năm 2026 để tránh trùng lặp
    await LenhSanXuat.deleteMany({ MaLenhSanXuat: /^LSX-26-/ });
    console.log('Cleaned up previous 2026 seed production orders.');

    // Tìm tất cả hợp đồng năm 2026
    const startDate2026 = new Date('2026-01-01T00:00:00.000Z');
    const endDate2026 = new Date('2026-12-31T23:59:59.999Z');
    const contracts2026 = await HopDong.find({ createdAt: { $gte: startDate2026, $lte: endDate2026 } });

    console.log(`Synchronizing production orders for ${contracts2026.length} contracts of year 2026...`);

    const newLenhSanXuats = [];
    contracts2026.forEach((c) => {
      // Tính tổng sản lượng trong hợp đồng
      let totalQty = 0;
      if (c.ChiTietHopDong && c.ChiTietHopDong.length > 0) {
        totalQty = c.ChiTietHopDong.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      if (totalQty === 0) totalQty = 1000; // Fallback 1 Tấn

      // Ngày hoàn thành lệnh sản xuất trùng với ngày tạo hợp đồng để khớp đúng tháng
      const completionTime = new Date(c.createdAt);
      const startTime = new Date(completionTime.getTime() - 3 * 24 * 60 * 60 * 1000); // Trước đó 3 ngày

      newLenhSanXuats.push({
        MaLenhSanXuat: `LSX-26-${c.MaHopDong.split('-').pop() || Math.floor(Math.random() * 10000)}`,
        ContractID: c._id,
        CongThucID: ct._id,
        TargetWeight: totalQty,
        Assignee: c.EmployeeID || nv._id,
        TrangThai: 'completed',
        StartTime: startTime,
        CompletionTime: completionTime
      });
    });

    if (newLenhSanXuats.length > 0) {
      await LenhSanXuat.insertMany(newLenhSanXuats);
      console.log(`Successfully synchronized ${newLenhSanXuats.length} completed production orders for 2026 sold contracts!`);
    }

    console.log('\n==================================================');
    console.log('SUCCESS: All 2026 target plan and production actuals synchronized perfectly!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Error synchronizing and seeding 2026:', err);
    process.exit(1);
  }
}

syncAndSeed2026();
