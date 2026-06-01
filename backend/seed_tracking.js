const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0')
  .then(async () => {
    console.log('Connected to DB for seeding Tracking data');
    
    const KhachHang = require('./src/models/KhachHang');
    const DonHang = require('./src/models/DonHang');
    const VanChuyen = require('./src/models/VanChuyen');
    const PhanHoiHoTro = require('./src/models/PhanHoiHoTro');
    const DoiTra = require('./src/models/DoiTra');
    const BaoHanh = require('./src/models/BaoHanh');
    const SanPhamSon = require('./src/models/SanPhamSon');

    // Get a random customer and product
    const kh = await KhachHang.findOne() || await KhachHang.create({
      TenKhachHang: 'Công ty Cổ phần Xây dựng Thử Nghiệm',
      MaKhachHang: 'KH-TEST01',
      LoaiKhachHang: 'B2B',
      SoDienThoai: '0988123456',
      Email: 'test@b2b.com',
      DiaChi: 'Hà Nội'
    });

    const sp = await SanPhamSon.findOne();
    if (!sp) {
      console.log('No products found, skipping order creation');
      process.exit(0);
    }

    // 1. Create DonHang
    const dh = await DonHang.findOneAndUpdate(
      { MaDonHang: 'DH1002' },
      {
        KhachHang: kh._id,
        Items: [{
          SanPham: sp._id,
          TenSanPham: sp.TenDongSon,
          MaMau: 'INT-R3020',
          SoLuong: 50,
          DonGia: 150000,
          ThanhTien: 7500000
        }],
        TienThue: 750000,
        TongTien: 8250000,
        TrangThai: 'DANG_GIAO',
        PhuongThucThanhToan: 'CHUYEN_KHOAN',
        DiaChiGiaoHang: 'KCN Bắc Thăng Long, Hà Nội'
      },
      { upsert: true, new: true }
    );

    // 2. Create VanChuyen
    await VanChuyen.findOneAndUpdate(
      { MaVanChuyen: 'VC-DH1002' },
      {
        DonHang: dh._id,
        LoHang: { SoKien: 50, KhoiLuong: 1000, MauSon: 'Signal Red' },
        VanChuyenInfo: { DonVi: 'Đội xe nội bộ VTSC', SDT: '0901234567' },
        LoTrinh: [
          { ThoiGian: new Date(Date.now() - 86400000), NoiDung: 'Lấy hàng từ Kho trung tâm', Status: 'COMPLETE' },
          { ThoiGian: new Date(), NoiDung: 'Đang di chuyển trên QL5', Status: 'PROCESSING' }
        ],
        TrangThaiTongQuat: 'Đang giao hàng',
        DuKienBanGiao: new Date(Date.now() + 86400000)
      },
      { upsert: true }
    );

    // 3. Create PhanHoiHoTro (Complaint/Ticket)
    await PhanHoiHoTro.findOneAndUpdate(
      { MaPhanHoi: 'PH005' },
      {
        CustomerID: kh._id,
        PhanLoai: 'Khiếu nại',
        NoiDungYeuCau: 'Sơn tĩnh điện mã INT-M5540 bị vón cục ở đáy thùng.',
        TrangThai: 'Đang xử lý',
        LichSuTraLoi: [
          { NguoiTraLoi: 'KhachHang', NoiDung: 'Sơn tĩnh điện mã INT-M5540 bị vón cục ở đáy thùng.' },
          { NguoiTraLoi: 'NhanVien', NoiDung: 'Dạ, VTSC đã ghi nhận phản ánh. Kỹ thuật viên sẽ xuống tận xưởng kiểm tra trong chiều nay ạ.' }
        ]
      },
      { upsert: true }
    );

    // 4. Create DoiTra
    await DoiTra.findOneAndUpdate(
      { MaDoiTra: 'DT001' },
      {
        DonHang: dh._id,
        LyDo: 'Hàng không đúng mã màu hợp đồng',
        TrangThai: 'CHO_DUYET',
        SanPhamDoiTra: [{ SanPham: sp._id, SoLuong: 10 }]
      },
      { upsert: true }
    );

    // 5. Create BaoHanh
    await BaoHanh.findOneAndUpdate(
      { MaBaoHanh: 'BH001' },
      {
        DonHang: dh._id,
        ThoiHanBaoHanh: new Date(Date.now() + 31536000000 * 5), // 5 years
        TrangThai: 'DANG_HIEU_LUC',
        DieuKienBaoHanh: 'Bảo hành bong tróc màng sơn trong điều kiện sử dụng bình thường',
        LichSuBaoHanh: []
      },
      { upsert: true }
    );

    console.log('Successfully seeded tracking mock data!');
    process.exit(0);
  })
  .catch(console.error);
