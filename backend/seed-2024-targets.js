const mongoose = require('mongoose');
const RevenueTarget = require('./src/models/RevenueTarget');
const ProductionTarget = require('./src/models/ProductionTarget');
const HopDong = require('./src/models/HopDong');
const LenhSanXuat = require('./src/models/LenhSanXuat');
const KhachHang = require('./src/models/KhachHang');
const NhanVien = require('./src/models/NhanVien');
const CongThuc = require('./src/models/CongThuc');
const SanPhamSon = require('./src/models/SanPhamSon');

require('dotenv').config();

// Dữ liệu Mock năm 2024 — Công ty giai đoạn tăng trưởng ổn định, chưa đạt đỉnh như 2025
const mockData2024 = [
  {
    thang: 1,
    quy: 1,
    nam: 2024,
    doanhThuKeHoach: 8500000000,
    doanhThuThucTe: 7600000000,   // -10.6% sau Tết Dương lịch
    sanLuongKeHoach: 850,
    sanLuongThucTe: 775
  },
  {
    thang: 2,
    quy: 1,
    nam: 2024,
    doanhThuKeHoach: 8200000000,
    doanhThuThucTe: 6900000000,   // -15.9% Tết Nguyên Đán kéo dài
    sanLuongKeHoach: 820,
    sanLuongThucTe: 700
  },
  {
    thang: 3,
    quy: 1,
    nam: 2024,
    doanhThuKeHoach: 9000000000,
    doanhThuThucTe: 9700000000,   // +7.8% phục hồi sau Tết
    sanLuongKeHoach: 900,
    sanLuongThucTe: 960
  },
  {
    thang: 4,
    quy: 2,
    nam: 2024,
    doanhThuKeHoach: 9800000000,
    doanhThuThucTe: 10800000000,  // +10.2% mùa xây dựng
    sanLuongKeHoach: 980,
    sanLuongThucTe: 1070
  },
  {
    thang: 5,
    quy: 2,
    nam: 2024,
    doanhThuKeHoach: 10200000000,
    doanhThuThucTe: 9300000000,   // -8.8% mưa đầu mùa
    sanLuongKeHoach: 1020,
    sanLuongThucTe: 940
  },
  {
    thang: 6,
    quy: 2,
    nam: 2024,
    doanhThuKeHoach: 10800000000,
    doanhThuThucTe: 12100000000,  // +12.0% cuối Q2 bứt phá
    sanLuongKeHoach: 1080,
    sanLuongThucTe: 1190
  },
  {
    thang: 7,
    quy: 3,
    nam: 2024,
    doanhThuKeHoach: 11500000000,
    doanhThuThucTe: 9800000000,   // -14.8% tháng Ngâu
    sanLuongKeHoach: 1150,
    sanLuongThucTe: 1010
  },
  {
    thang: 8,
    quy: 3,
    nam: 2024,
    doanhThuKeHoach: 12200000000,
    doanhThuThucTe: 13500000000,  // +10.7% thị trường mở
    sanLuongKeHoach: 1220,
    sanLuongThucTe: 1340
  },
  {
    thang: 9,
    quy: 3,
    nam: 2024,
    doanhThuKeHoach: 13500000000,
    doanhThuThucTe: 14900000000,  // +10.4% cao điểm Q3
    sanLuongKeHoach: 1350,
    sanLuongThucTe: 1480
  },
  {
    thang: 10,
    quy: 4,
    nam: 2024,
    doanhThuKeHoach: 14800000000,
    doanhThuThucTe: 16200000000,  // +9.5% cao điểm bàn giao
    sanLuongKeHoach: 1480,
    sanLuongThucTe: 1600
  },
  {
    thang: 11,
    quy: 4,
    nam: 2024,
    doanhThuKeHoach: 16000000000,
    doanhThuThucTe: 17800000000,  // +11.3% chạy nước rút
    sanLuongKeHoach: 1600,
    sanLuongThucTe: 1760
  },
  {
    thang: 12,
    quy: 4,
    nam: 2024,
    doanhThuKeHoach: 17500000000,
    doanhThuThucTe: 14800000000,  // -15.4% khoá sổ cuối năm
    sanLuongKeHoach: 1750,
    sanLuongThucTe: 1510
  }
];

const seed2024Data = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');

    // Lấy hoặc tạo SanPhamSon
    let sp = await SanPhamSon.findOne();
    if (!sp) {
      sp = await SanPhamSon.create({
        MaSanPham: 'SP_MOCK_2024',
        TenDongSon: 'Sơn tĩnh điện B2B Mock 2024',
        DonGiaCoSo: 82000,
        PhanLoai: 'Sơn tĩnh điện',
        DanhSachMaMau: [
          { MaMau: 'BASE_WHITE', TenMau: 'Trắng Cơ Bản', HexCode: '#ffffff', TonKhoKhaDung: 5000 }
        ]
      });
      console.log('Created a fallback SanPhamSon document.');
    }

    const firstColor = sp.DanhSachMaMau[0]?.MaMau || 'BASE_WHITE';

    // Lấy hoặc tạo các bản ghi phụ thuộc
    let kh = await KhachHang.findOne();
    let nv = await NhanVien.findOne();
    let ct = await CongThuc.findOne();

    if (!kh) {
      kh = await KhachHang.create({
        MaKhachHang: 'KH_MOCK_2024',
        name: 'Đối Tác Mock B2B 2024',
        segment: 'B2B',
        contactName: 'Đại diện Mock 2024',
        phone: '0912345679',
        email: 'mockb2b2024@customer.com'
      });
      console.log('Created a fallback KhachHang document for seeding.');
    }

    if (!nv) {
      nv = await NhanVien.create({
        MaNhanVien: 'NV_MOCK_2024',
        HoTen: 'Nhân Viên Mock 2024',
        ChucVu: 'Nhân viên phụ trách',
        Email: 'mocknv2024@company.com',
        SoDienThoai: '0901234568',
        PhongBan: 'Sales'
      });
      console.log('Created a fallback NhanVien document for seeding.');
    }

    if (!ct) {
      ct = await CongThuc.create({
        MaCongThuc: 'CT_MOCK_2024',
        TenCongThuc: 'Công thức Mock Sơn tĩnh điện 2024',
        SanPham: sp._id,
        MaMau: firstColor,
        MoTa: 'Công thức dùng cho dữ liệu test sản lượng 2024'
      });
      console.log('Created a fallback CongThuc document for seeding.');
    }

    // Xóa dữ liệu cũ của năm 2024 (idempotent)
    await RevenueTarget.deleteMany({ year: 2024 });
    await ProductionTarget.deleteMany({ year: 2024 });
    await HopDong.deleteMany({ MaHopDong: /^HD-24-/ });
    await LenhSanXuat.deleteMany({ MaLenhSanXuat: /^LSX-24-/ });
    console.log('Cleaned up previous 2024 targets and seed data.');

    const revenueTargets = [];
    const productionTargets = [];
    const hopDongs = [];
    const lenhSanXuats = [];

    let totalRevenuePlan = 0;
    let totalProductionPlan = 0;
    const quarterRevPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const quarterProdPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const m of mockData2024) {
      totalRevenuePlan += m.doanhThuKeHoach;
      totalProductionPlan += m.sanLuongKeHoach * 1000;
      quarterRevPlans[m.quy] += m.doanhThuKeHoach;
      quarterProdPlans[m.quy] += m.sanLuongKeHoach * 1000;

      // Mục tiêu tháng
      revenueTargets.push({
        type: 'month',
        year: 2024,
        month: m.thang,
        quarter: null,
        targetAmount: m.doanhThuKeHoach
      });

      productionTargets.push({
        type: 'month',
        year: 2024,
        month: m.thang,
        quarter: null,
        targetAmount: m.sanLuongKeHoach * 1000
      });

      // Hợp đồng thực tế
      const formattedMonth = String(m.thang).padStart(2, '0');
      hopDongs.push({
        MaHopDong: `HD-24-T${formattedMonth}`,
        title: `Hợp đồng nguyên tắc cung cấp sơn - T${formattedMonth}/2024`,
        CustomerID: kh._id,
        LoaiHopDong: 'B2B',
        EmployeeID: nv._id,
        NgayLap: new Date(`2024-${formattedMonth}-15T12:00:00.000Z`),
        createdAt: new Date(`2024-${formattedMonth}-15T12:00:00.000Z`),
        updatedAt: new Date(`2024-${formattedMonth}-15T12:00:00.000Z`),
        TongGiaTri: m.doanhThuThucTe,
        DaThanhToan: m.doanhThuThucTe,
        TrangThai: 'completed',
        ChiTietHopDong: [
          {
            productName: 'Sơn tĩnh điện Mock 2024',
            quantity: m.sanLuongThucTe * 1000,
            unitPrice: Math.round(m.doanhThuThucTe / (m.sanLuongThucTe * 1000))
          }
        ]
      });
    }

    // Mục tiêu quý
    for (let q = 1; q <= 4; q++) {
      revenueTargets.push({ type: 'quarter', year: 2024, month: null, quarter: q, targetAmount: quarterRevPlans[q] });
      productionTargets.push({ type: 'quarter', year: 2024, month: null, quarter: q, targetAmount: quarterProdPlans[q] });
    }

    // Mục tiêu năm
    revenueTargets.push({ type: 'year', year: 2024, month: null, quarter: null, targetAmount: totalRevenuePlan });
    productionTargets.push({ type: 'year', year: 2024, month: null, quarter: null, targetAmount: totalProductionPlan });

    // Lưu vào DB
    await RevenueTarget.insertMany(revenueTargets);
    await ProductionTarget.insertMany(productionTargets);
    console.log('Seeded RevenueTarget & ProductionTarget for 2024 (months, quarters, year)!');

    const insertedContracts = await HopDong.insertMany(hopDongs);
    console.log('Seeded HopDong records for 2024!');

    // Lệnh sản xuất
    for (const m of mockData2024) {
      const formattedMonth = String(m.thang).padStart(2, '0');
      const contract = insertedContracts.find(c => c.MaHopDong === `HD-24-T${formattedMonth}`);
      lenhSanXuats.push({
        MaLenhSanXuat: `LSX-24-T${formattedMonth}`,
        ContractID: contract._id,
        CongThucID: ct._id,
        TargetWeight: m.sanLuongThucTe * 1000,
        Assignee: nv._id,
        TrangThai: 'completed',
        StartTime: new Date(`2024-${formattedMonth}-10T08:00:00.000Z`),
        CompletionTime: new Date(`2024-${formattedMonth}-20T17:00:00.000Z`)
      });
    }

    await LenhSanXuat.insertMany(lenhSanXuats);
    console.log('Seeded LenhSanXuat records for 2024!');

    // In tóm tắt
    const totalRevActual = mockData2024.reduce((s, m) => s + m.doanhThuThucTe, 0);
    const totalProdActual = mockData2024.reduce((s, m) => s + m.sanLuongThucTe, 0);
    console.log('==================================================');
    console.log('SUCCESS: All 2024 mock data seeded perfectly!');
    console.log(`  Tổng DT Kế hoạch: ${(totalRevenuePlan / 1e9).toFixed(1)} Tỷ VNĐ`);
    console.log(`  Tổng DT Thực tế:  ${(totalRevActual / 1e9).toFixed(1)} Tỷ VNĐ`);
    console.log(`  Tổng SL Kế hoạch: ${(totalProductionPlan / 1000).toFixed(0)} Tấn`);
    console.log(`  Tổng SL Thực tế:  ${totalProdActual} Tấn`);
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL: Error seeding 2024 targets and actuals:', error);
    process.exit(1);
  }
};

seed2024Data();
