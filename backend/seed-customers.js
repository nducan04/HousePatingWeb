const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KhachHang = require('./src/models/KhachHang');

dotenv.config({ path: './.env' });

const seedCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Make sure we drop existing if any, though we just dropped it earlier
    await KhachHang.deleteMany({});

    const fakeCustomers = [
      {
        MaKH: "KH2024-001",
        PhanLoai: "B2C",
        TenKhachHang: "Nguyễn Trần Trung Quân",
        Email: "trungquan@gmail.com",
        SDT: "0901234567",
        DiaChi: "123 Đường Số 1, Quận 1, TP. HCM",
        NgaySinh: new Date("1990-05-15")
      },
      {
        MaKH: "KH2024-002",
        PhanLoai: "B2B",
        TenKhachHang: "Công ty TNHH Xây Dựng Bình Minh",
        Email: "contact@binhminhxaydung.vn",
        SDT: "02838123456",
        DiaChi: "456 Xa Lộ Hà Nội, Quận 2, TP. HCM",
        MaSoThue: "0312345678",
        TaiKhoanNganHang: "190312345678 - Techcombank",
        NguoiDaiDien: "Lê Thị Lan"
      },
      {
        MaKH: "KH2024-003",
        PhanLoai: "Đại lý",
        TenKhachHang: "Đại lý Sơn Minh Phát",
        Email: "minhphatpaint@gmail.com",
        SDT: "0934567890",
        DiaChi: "789 Nguyễn Văn Linh, Quận 7, TP. HCM",
        MaSoThueCaNhan: "8312345678",
      },
      {
        MaKH: "KH2024-004",
        PhanLoai: "B2C",
        TenKhachHang: "Trần Anh Khoa",
        Email: "anhkhoatran@yahoo.com",
        SDT: "0987654321",
        DiaChi: "12 Lê Duẩn, Quận 1, TP. HCM",
        NgaySinh: new Date("1985-08-20")
      },
      {
        MaKH: "KH2024-005",
        PhanLoai: "B2B",
        TenKhachHang: "Công ty Cổ phần Kiến Trúc Việt",
        Email: "info@kientrucviet.com",
        SDT: "02871098765",
        DiaChi: "90 Hai Bà Trưng, Quận 3, TP. HCM",
        MaSoThue: "0323456789",
        TaiKhoanNganHang: "0123456789 - Vietcombank",
        NguoiDaiDien: "Phạm Hữu Tiến"
      },
      {
        MaKH: "KH2024-006",
        PhanLoai: "Đại lý",
        TenKhachHang: "Đại lý Cấp 1 An Khang",
        Email: "ankhang_daily@gmail.com",
        SDT: "0912345678",
        DiaChi: "45 Quang Trung, Gò Vấp, TP. HCM",
        MaSoThueCaNhan: "8323456789",
      },
      {
        MaKH: "KH2024-007",
        PhanLoai: "B2C",
        TenKhachHang: "Lý Nhã Kỳ",
        Email: "kynha.ly@gmail.com",
        SDT: "0976543210",
        DiaChi: "Biệt thự K1, Thảo Điền, Quận 2, TP. HCM",
        NgaySinh: new Date("1988-11-05")
      },
      {
        MaKH: "KH2024-008",
        PhanLoai: "B2B",
        TenKhachHang: "Tập đoàn Phát Triển Nam Long",
        Email: "purchasing@namlonggroup.vn",
        SDT: "02838999999",
        DiaChi: "60 Nguyễn Đình Chiểu, Quận 1, TP. HCM",
        MaSoThue: "0311223344",
        TaiKhoanNganHang: "998877665544 - ACB",
        NguoiDaiDien: "Nguyễn Xuân Quang"
      },
      {
        MaKH: "KH2024-009",
        PhanLoai: "Đại lý",
        TenKhachHang: "Vật Liệu Xây Dựng Thành Công",
        Email: "vlxd.thanhcong@gmail.com",
        SDT: "0945678901",
        DiaChi: "200 Lý Thường Kiệt, Quận 10, TP. HCM",
        MaSoThueCaNhan: "8334455667",
      },
      {
        MaKH: "KH2024-010",
        PhanLoai: "B2C",
        TenKhachHang: "Hoàng Thanh Tùng",
        Email: "tunghoang9x@gmail.com",
        SDT: "0967890123",
        DiaChi: "Tòa A2, Vinhomes Central Park, Bình Thạnh, TP. HCM",
        NgaySinh: new Date("1995-02-14")
      }
    ];

    await KhachHang.insertMany(fakeCustomers);
    console.log('Khôi phục dữ liệu Khách Hàng thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding customers:', error);
    process.exit(1);
  }
};

seedCustomers();
