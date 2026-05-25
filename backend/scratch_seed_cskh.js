const mongoose = require('mongoose');
const DoiTra = require('./src/models/DoiTra');
const DonHang = require('./src/models/DonHang');
const SanPhamSon = require('./src/models/SanPhamSon');
const PhanHoiHoTro = require('./src/models/PhanHoiHoTro');
const KhachHang = require('./src/models/KhachHang');
const NhanVien = require('./src/models/NhanVien');
const HopDong = require('./src/models/HopDong');
require('dotenv').config();

async function seedDashboardTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    // ==========================================
    // 0. Seed/Find Customer
    // ==========================================
    let customer = await KhachHang.findOne({});
    if (!customer) {
      customer = await KhachHang.create({
        MaKH: 'KH-TEST-CSKH',
        PhanLoai: 'B2B',
        TenKhachHang: 'Công ty Cổ phần Xây dựng Test',
        Email: 'test-cskh@gmail.com',
        SDT: '0987654321',
        DiaChi: 'Hà Nội'
      });
      console.log('Created a dummy customer:', customer.TenKhachHang);
    } else {
      console.log('Found existing customer:', customer.TenKhachHang);
    }

    // ==========================================
    // 1. Seed/Find Product & Order (Required by DoiTra)
    // ==========================================
    let product = await SanPhamSon.findOne({});
    if (!product) {
      product = await SanPhamSon.create({
        MaSanPham: 'SON-TEST',
        TenDongSon: 'Sơn bột PE D1000',
        ThuongHieu: 'AkzoNobel',
        DonGiaCoSo: 100000,
        TrangThai: 'Còn hàng'
      });
      console.log('Created a dummy product:', product.TenDongSon);
    }

    let order = await DonHang.findOne({});
    if (!order) {
      order = await DonHang.create({
        MaDonHang: 'DH-SEED-TEST',
        KhachHang: customer._id,
        Items: [{
          SanPham: product._id,
          TenSanPham: product.TenDongSon,
          SoLuong: 10,
          DonGia: 100000,
          ThanhTien: 1000000
        }],
        TongTien: 1000000,
        DiaChiGiaoHang: 'Hà Nội'
      });
      console.log('Created a dummy order:', order.MaDonHang);
    } else {
      console.log('Found existing order:', order.MaDonHang);
    }

    // ==========================================
    // 2. Seed DoiTra Data (for May 2026 stats)
    // ==========================================
    const doiTraData = [
      {
        MaDoiTra: 'RET-SEED-01',
        DonHang: order._id,
        KhachHang: customer._id,
        LyDo: 'Màng sơn bị giòn, dễ bong tróc sau 1 tuần sấy',
        LoaiYeuCau: 'Bảo hành',
        TrangThai: 'Đã hoàn tiền', // Counts as success/resolved
        createdAt: new Date(2026, 4, 10) // 10/05/2026
      },
      {
        MaDoiTra: 'RET-SEED-02',
        DonHang: order._id,
        KhachHang: customer._id,
        LyDo: 'Sơn không bám dính tốt trên bề mặt kim loại ẩm',
        LoaiYeuCau: 'Bảo hành',
        TrangThai: 'Yêu cầu mới',
        createdAt: new Date(2026, 4, 15) // 15/05/2026
      },
      {
        MaDoiTra: 'RET-SEED-03',
        DonHang: order._id,
        KhachHang: customer._id,
        LyDo: 'Lỗi vón cục khi phun sơn tĩnh điện',
        LoaiYeuCau: 'Đổi trả',
        TrangThai: 'Đang xử lý',
        createdAt: new Date(2026, 4, 18) // 18/05/2026
      }
    ];

    await DoiTra.deleteMany({ MaDoiTra: { $in: ['RET-SEED-01', 'RET-SEED-02', 'RET-SEED-03'] } });
    await DoiTra.insertMany(doiTraData);
    console.log('Successfully seeded 3 DoiTra records.');

    // ==========================================
    // 3. Seed PhanHoiHoTro (Tickets / Complaints)
    // ==========================================
    const phanHoiData = [];
    const months = [0, 1, 2, 3, 4]; // Jan to May
    const counts = [4, 2, 7, 3, 8]; // Counts for each month

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const count = counts[i];
      for (let j = 0; j < count; j++) {
        const ticketId = `TK-SEED-${month + 1}-${j + 1}`;
        phanHoiData.push({
          MaPhanHoi: ticketId,
          CustomerID: customer._id,
          PhanLoai: 'Khiếu nại',
          NoiDungYeuCau: `Yêu cầu hỗ trợ kỹ thuật và khiếu nại #${j + 1} của Tháng ${month + 1}/2026`,
          TrangThai: j === 0 ? 'Đang mở' : 'Đang xử lý',
          LichSuTraLoi: [
            { NguoiTraLoi: 'KhachHang', NoiDung: `Báo cáo lỗi kỹ thuật sản phẩm sơn dòng Tháng ${month + 1}` },
            { NguoiTraLoi: 'AI', NoiDung: `Hệ thống CSKH VTSC đã tiếp nhận yêu cầu. Mã Ticket: ${ticketId}` }
          ],
          createdAt: new Date(2026, month, 5 + j * 2)
        });
      }
    }

    await PhanHoiHoTro.deleteMany({ MaPhanHoi: { $regex: /^TK-SEED-/ } });
    await PhanHoiHoTro.insertMany(phanHoiData);
    console.log(`Successfully seeded ${phanHoiData.length} PhanHoiHoTro records across Jan-May 2026.`);

    // ==========================================
    // 4. Seed NhanVien (New Hires Trend & Total Staff)
    // ==========================================
    const nvData = [];
    const nvCounts = [2, 1, 3, 2, 4]; // Jan-May 2026

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const count = nvCounts[i];
      for (let j = 0; j < count; j++) {
        const nvId = `NV-SEED-${month + 1}-${j + 1}`;
        nvData.push({
          MaNV: nvId,
          HoTen: `Nhân Viên Thử Nghiệm ${month + 1}-${j + 1}`,
          ChucVu: 'Nhân viên',
          BoPhan: 'Kinh doanh',
          TrangThai: 'Đang làm',
          createdAt: new Date(2026, month, 12 + j * 3)
        });
      }
    }

    await NhanVien.deleteMany({ MaNV: { $regex: /^NV-SEED-/ } });
    await NhanVien.insertMany(nvData);
    console.log(`Successfully seeded ${nvData.length} employee records for HR trends.`);

    // ==========================================
    // 5. Seed HopDong (Disputed contracts for Legal cases)
    // ==========================================
    const hopDongData = [
      {
        MaHopDong: 'HD-SEED-DISPUTED-1',
        title: 'Hợp đồng tranh chấp lô sơn PE-01',
        CustomerID: customer._id,
        LoaiHopDong: 'B2B',
        TongGiaTri: 150000000,
        TrangThai: 'disputed',
        createdAt: new Date(2026, 4, 5) // May 2026
      },
      {
        MaHopDong: 'HD-SEED-DISPUTED-2',
        title: 'Hợp đồng tranh chấp dự án Thái Hưng',
        CustomerID: customer._id,
        LoaiHopDong: 'B2B',
        TongGiaTri: 320000000,
        TrangThai: 'disputed',
        createdAt: new Date(2026, 4, 12) // May 2026
      }
    ];

    await HopDong.deleteMany({ MaHopDong: { $regex: /^HD-SEED-DISPUTED-/ } });
    await HopDong.insertMany(hopDongData);
    console.log('Successfully seeded 2 disputed contract records for Legal stats.');

    console.log('\n======================================================');
    console.log('ALL CSKH & HR-LEGAL TEST DATA SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedDashboardTestData();
