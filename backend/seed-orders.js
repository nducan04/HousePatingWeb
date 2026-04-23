const mongoose = require('mongoose');
const DonHang = require('./src/models/DonHang');
const KhachHang = require('./src/models/KhachHang');
const SanPhamSon = require('./src/models/SanPhamSon');
require('dotenv').config();

const seedOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const khs = await KhachHang.find().limit(2);
        const sps = await SanPhamSon.find().limit(5);

        if (khs.length === 0 || sps.length === 0) {
            console.log('No customers or products found to seed orders.');
            process.exit();
        }

        await DonHang.deleteMany({});

        const statuses = ['CHO_XAC_NHAN', 'DANG_XU_LY', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY'];
        
        const orders = [];
        for (let i = 1; i <= 10; i++) {
            const kh = khs[Math.floor(Math.random() * khs.length)];
            const selectedSps = sps.sort(() => 0.5 - Math.random()).slice(0, 2);
            
            const items = selectedSps.map(sp => ({
                SanPham: sp._id,
                TenSanPham: sp.TenDongSon,
                MaMau: sp.DanhSachMaMau[0]?.MaMau || 'BASE',
                SoLuong: Math.floor(Math.random() * 5) + 1,
                DonGia: sp.DonGiaCoSo,
                ThanhTien: sp.DonGiaCoSo * (Math.floor(Math.random() * 5) + 1)
            }));

            const tongTien = items.reduce((acc, curr) => acc + curr.ThanhTien, 0);

            orders.push({
                MaDonHang: `DH${1000 + i}`,
                KhachHang: kh._id,
                Items: items,
                TongTien: tongTien,
                TrangThai: statuses[i % 5],
                PhuongThucThanhToan: i % 2 === 0 ? 'COD' : 'BANK_TRANSFER',
                TrangThaiThanhToan: i % 3 === 0 ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN',
                DiaChiGiaoHang: kh.DiaChi || '123 Đường Láng, Hà Nội',
                HanXacNhan: new Date(+new Date() + (i % 2 === 0 ? -1 : 1) * 12 * 60 * 60 * 1000), // Some expired
                GhiChu: i % 4 === 0 ? 'Giao hàng giờ hành chính' : ''
            });
        }

        await DonHang.insertMany(orders);
        console.log('Successfully seeded 10 orders');
        process.exit();
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders();
