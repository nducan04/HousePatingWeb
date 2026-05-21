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

const mockData = [
  {
    thang: 1,
    quy: 1,
    nam: 2025,
    doanhThuKeHoach: 10500000000,
    doanhThuThucTe: 9800000000,
    sanLuongKeHoach: 1050, // Tấn
    sanLuongThucTe: 990   // Tấn
  },
  {
    thang: 2,
    quy: 1,
    nam: 2025,
    doanhThuKeHoach: 10200000000,
    doanhThuThucTe: 8800000000,
    sanLuongKeHoach: 1020,
    sanLuongThucTe: 900
  },
  {
    thang: 3,
    quy: 1,
    nam: 2025,
    doanhThuKeHoach: 11000000000,
    doanhThuThucTe: 11800000000,
    sanLuongKeHoach: 1100,
    sanLuongThucTe: 1180
  },
  {
    thang: 4,
    quy: 2,
    nam: 2025,
    doanhThuKeHoach: 12000000000,
    doanhThuThucTe: 13200000000,
    sanLuongKeHoach: 1200,
    sanLuongThucTe: 1310
  },
  {
    thang: 5,
    quy: 2,
    nam: 2025,
    doanhThuKeHoach: 12500000000,
    doanhThuThucTe: 11500000000,
    sanLuongKeHoach: 1250,
    sanLuongThucTe: 1170
  },
  {
    thang: 6,
    quy: 2,
    nam: 2025,
    doanhThuKeHoach: 13000000000,
    doanhThuThucTe: 14800000000,
    sanLuongKeHoach: 1300,
    sanLuongThucTe: 1450
  },
  {
    thang: 7,
    quy: 3,
    nam: 2025,
    doanhThuKeHoach: 14000000000,
    doanhThuThucTe: 12200000000,
    sanLuongKeHoach: 1400,
    sanLuongThucTe: 1250
  },
  {
    thang: 8,
    quy: 3,
    nam: 2025,
    doanhThuKeHoach: 15000000000,
    doanhThuThucTe: 16500000000,
    sanLuongKeHoach: 1500,
    sanLuongThucTe: 1620
  },
  {
    thang: 9,
    quy: 3,
    nam: 2025,
    doanhThuKeHoach: 16500000000,
    doanhThuThucTe: 18200000000,
    sanLuongKeHoach: 1650,
    sanLuongThucTe: 1800
  },
  {
    thang: 10,
    quy: 4,
    nam: 2025,
    doanhThuKeHoach: 18000000000,
    doanhThuThucTe: 19800000000,
    sanLuongKeHoach: 1800,
    sanLuongThucTe: 1950
  },
  {
    thang: 11,
    quy: 4,
    nam: 2025,
    doanhThuKeHoach: 19500000000,
    doanhThuThucTe: 21800000000,
    sanLuongKeHoach: 1950,
    sanLuongThucTe: 2150
  },
  {
    thang: 12,
    quy: 4,
    nam: 2025,
    doanhThuKeHoach: 21000000000,
    doanhThuThucTe: 17800000000,
    sanLuongKeHoach: 2100,
    sanLuongThucTe: 1820
  }
];

const seed2025Data = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');

    // Lấy hoặc tạo SanPhamSon
    let sp = await SanPhamSon.findOne();
    if (!sp) {
      sp = await SanPhamSon.create({
        MaSanPham: 'SP_MOCK_2025',
        TenDongSon: 'Sơn tĩnh điện B2B Mock',
        DonGiaCoSo: 85000,
        PhanLoai: 'Sơn tĩnh điện',
        DanhSachMaMau: [
          { MaMau: 'BASE_WHITE', TenMau: 'Trắng Cơ Bản', HexCode: '#ffffff', TonKhoKhaDung: 5000 }
        ]
      });
      console.log('Created a fallback SanPhamSon document.');
    }

    const firstColor = sp.DanhSachMaMau[0]?.MaMau || 'BASE_WHITE';

    // Lấy bản ghi phụ thuộc khác
    let kh = await KhachHang.findOne();
    let nv = await NhanVien.findOne();
    let ct = await CongThuc.findOne();

    if (!kh) {
      kh = await KhachHang.create({
        MaKhachHang: 'KH_MOCK_2025',
        name: 'Đối Tác Mock B2B 2025',
        segment: 'B2B',
        contactName: 'Đại diện Mock B2B',
        phone: '0912345678',
        email: 'mockb2b@customer.com'
      });
      console.log('Created a fallback KhachHang document for seeding.');
    }

    if (!nv) {
      nv = await NhanVien.create({
        MaNhanVien: 'NV_MOCK_2025',
        HoTen: 'Nhân Viên Mock 2025',
        ChucVu: 'Nhân viên phụ trách',
        Email: 'mocknv@company.com',
        SoDienThoai: '0901234567',
        PhongBan: 'Sales'
      });
      console.log('Created a fallback NhanVien document for seeding.');
    }

    if (!ct) {
      ct = await CongThuc.create({
        MaCongThuc: 'CT_MOCK_2025',
        TenCongThuc: 'Công thức Mock Sơn tĩnh điện',
        SanPham: sp._id,
        MaMau: firstColor,
        DòngSơn: 'Sơn bóng cao cấp',
        MoTa: 'Công thức dùng cho dữ liệu test sản lượng 2025'
      });
      console.log('Created a fallback CongThuc document for seeding.');
    }

    // 1. Xóa tất cả mục tiêu và hợp đồng/lệnh sản xuất mẫu của năm 2025 để tránh trùng lặp
    await RevenueTarget.deleteMany({ year: 2025 });
    await ProductionTarget.deleteMany({ year: 2025 });
    await HopDong.deleteMany({ MaHopDong: /^HD-25-/ });
    await LenhSanXuat.deleteMany({ MaLenhSanXuat: /^LSX-25-/ });
    console.log('Cleaned up previous 2025 targets and seed contracts/production orders.');

    const revenueTargets = [];
    const productionTargets = [];
    const hopDongs = [];
    const lenhSanXuats = [];

    // Tổng năm
    let totalRevenuePlan = 0;
    let totalProductionPlan = 0;

    // Tổng quý
    const quarterRevPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const quarterProdPlans = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const m of mockData) {
      // Tính lũy kế
      totalRevenuePlan += m.doanhThuKeHoach;
      totalProductionPlan += m.sanLuongKeHoach * 1000; // Đổi sang KG

      quarterRevPlans[m.quy] += m.doanhThuKeHoach;
      quarterProdPlans[m.quy] += m.sanLuongKeHoach * 1000; // Đổi sang KG

      // --- A. GHI MỤC TIÊU CHO THÁNG ---
      revenueTargets.push({
        type: 'month',
        year: 2025,
        month: m.thang,
        quarter: null,
        targetAmount: m.doanhThuKeHoach
      });

      productionTargets.push({
        type: 'month',
        year: 2025,
        month: m.thang,
        quarter: null,
        targetAmount: m.sanLuongKeHoach * 1000
      });

      // --- B. TẠO HỢP ĐỒNG ĐỂ TÍNH DOANH THU THỰC TẾ ---
      const formattedMonth = String(m.thang).padStart(2, '0');
      const maHD = `HD-25-T${formattedMonth}`;

      hopDongs.push({
        MaHopDong: maHD,
        title: `Hợp đồng nguyên tắc cung cấp sơn - T${formattedMonth}/2025`,
        CustomerID: kh._id,
        LoaiHopDong: 'B2B',
        EmployeeID: nv._id,
        NgayLap: new Date(`2025-${formattedMonth}-15T12:00:00.000Z`),
        createdAt: new Date(`2025-${formattedMonth}-15T12:00:00.000Z`),
        updatedAt: new Date(`2025-${formattedMonth}-15T12:00:00.000Z`),
        TongGiaTri: m.doanhThuThucTe,
        DaThanhToan: m.doanhThuThucTe,
        TrangThai: 'completed',
        ChiTietHopDong: [
          {
            productName: 'Sơn tĩnh điện Mock',
            quantity: m.sanLuongThucTe * 1000,
            unitPrice: Math.round(m.doanhThuThucTe / (m.sanLuongThucTe * 1000))
          }
        ]
      });
    }

    // --- D. GHI MỤC TIÊU CHO QUÝ & NĂM ---
    for (let q = 1; q <= 4; q++) {
      revenueTargets.push({
        type: 'quarter',
        year: 2025,
        month: null,
        quarter: q,
        targetAmount: quarterRevPlans[q]
      });

      productionTargets.push({
        type: 'quarter',
        year: 2025,
        month: null,
        quarter: q,
        targetAmount: quarterProdPlans[q]
      });
    }

    // Năm
    revenueTargets.push({
      type: 'year',
      year: 2025,
      month: null,
      quarter: null,
      targetAmount: totalRevenuePlan
    });

    productionTargets.push({
      type: 'year',
      year: 2025,
      month: null,
      quarter: null,
      targetAmount: totalProductionPlan
    });

    // Thực hiện lưu Targets
    await RevenueTarget.insertMany(revenueTargets);
    await ProductionTarget.insertMany(productionTargets);
    console.log('Seeded RevenueTarget and ProductionTarget for months, quarters, and year 2025!');

    // Thực hiện lưu Hợp đồng
    const insertedContracts = await HopDong.insertMany(hopDongs);
    console.log('Seeded actual HopDong records for 2025 revenue representation!');

    // --- E. TẠO VÀ LƯU LỆNH SẢN XUẤT HOÀN THÀNH ---
    for (let idx = 0; idx < mockData.length; idx++) {
      const m = mockData[idx];
      const contract = insertedContracts.find(c => c.MaHopDong === `HD-25-T${String(m.thang).padStart(2, '0')}`);
      const formattedMonth = String(m.thang).padStart(2, '0');

      lenhSanXuats.push({
        MaLenhSanXuat: `LSX-25-T${formattedMonth}`,
        ContractID: contract._id,
        CongThucID: ct._id,
        TargetWeight: m.sanLuongThucTe * 1000, // Đổi sang KG
        Assignee: nv._id,
        TrangThai: 'completed',
        StartTime: new Date(`2025-${formattedMonth}-10T08:00:00.000Z`),
        CompletionTime: new Date(`2025-${formattedMonth}-20T17:00:00.000Z`)
      });
    }

    await LenhSanXuat.insertMany(lenhSanXuats);
    console.log('Seeded actual LenhSanXuat records for 2025 production representation!');

    console.log('==================================================');
    console.log('SUCCESS: All 2025 mock data seeded perfectly!');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL: Error seeding 2025 targets and actuals:', error);
    process.exit(1);
  }
};

seed2025Data();
