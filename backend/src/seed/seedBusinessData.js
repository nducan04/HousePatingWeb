const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const HopDong = require('../models/HopDong');
const DonHang = require('../models/DonHang');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const KhachHang = require('../models/KhachHang');
const NhanVien = require('../models/NhanVien');
const SanPhamSon = require('../models/SanPhamSon');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Massive Seeding...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seedData = async () => {
    try {
        await connectDB();

        // 1. Fetch dependencies
        const customers = await KhachHang.find();
        const employees = await NhanVien.find();
        const products = await SanPhamSon.find();

        if (customers.length === 0 || employees.length === 0 || products.length === 0) {
            console.error('Error: Please run seedAuth.js first.');
            process.exit(1);
        }

        console.log('Cleaning existing SEED data...');
        await HopDong.deleteMany({ MaHopDong: { $regex: /^SEED-/ } });
        await DonHang.deleteMany({ MaDonHang: { $regex: /^SEED-/ } });
        await NhatKyTestMau.deleteMany({ MaNhatKy: { $regex: /^SEED-/ } });

        const contractsBuffer = [];
        const ordersBuffer = [];
        const rdBuffer = [];

        const paintTypes = ['Sơn Epoxy phủ sàn', 'Sơn Polyurethane (PU)', 'Sơn chống rỉ Alkyd', 'Sơn nội thất cao cấp', 'Sơn tàu biển AkzoNobel', 'Sơn tĩnh điện bột'];
        const contractStatuses = ['draft', 'created', 'signed', 'delivering', 'completed'];
        const orderStatuses = ['CHO_XAC_NHAN', 'DANG_XU_LY', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY'];
        const rdStatuses = ['pending', 'testing', 'approved', 'rejected'];

        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const today = new Date();

        console.log('Generating 1,000 Contracts...');
        for (let i = 1; i <= 1000; i++) {
            const customer = customers[i % customers.length];
            const employee = employees[i % employees.length];
            const product = products[i % products.length];
            const date = getRandomDate(sixMonthsAgo, today);
            
            contractsBuffer.push({
                MaHopDong: `SEED-HD-${20000 + i}`,
                title: `Hợp đồng cung ứng ${paintTypes[Math.floor(Math.random() * paintTypes.length)]} - Dự án ${i}`,
                CustomerID: customer._id,
                EmployeeID: employee._id,
                LoaiHopDong: customer.PhanLoai === 'B2B' ? 'B2B' : (customer.PhanLoai === 'Đại lý' ? 'Đại lý' : 'B2C'),
                TongGiaTri: 10000000 + Math.floor(Math.random() * 500000000),
                DaThanhToan: Math.random() > 0.5 ? 5000000 : 0,
                TrangThai: contractStatuses[Math.floor(Math.random() * contractStatuses.length)],
                NgayLap: date,
                ChiTietHopDong: [
                    {
                        productName: product.TenDongSon,
                        colorCode: product.MaMau || 'BASE',
                        quantity: 100 + Math.floor(Math.random() * 1000),
                        unitPrice: product.DonGiaCoSo,
                        technicalReqs: 'Tiêu chuẩn ISO 9001:2015'
                    }
                ],
                partyBRepresentative: customer.TenKhachHang,
                partyBAddress: customer.DiaChi
            });
        }

        const insertedContracts = await HopDong.insertMany(contractsBuffer);
        console.log(`Inserted ${insertedContracts.length} Contracts.`);

        console.log('Generating 1,000 Orders...');
        for (let i = 1; i <= 1000; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = 1 + Math.floor(Math.random() * 50);
            const date = getRandomDate(sixMonthsAgo, today);

            ordersBuffer.push({
                MaDonHang: `SEED-DH-${30000 + i}`,
                KhachHang: customer._id,
                Items: [
                    {
                        SanPham: product._id,
                        TenSanPham: product.TenDongSon,
                        MaMau: product.MaMau || 'BASE',
                        SoLuong: qty,
                        DonGia: product.DonGiaCoSo,
                        ThanhTien: qty * product.DonGiaCoSo
                    }
                ],
                TongTien: qty * product.DonGiaCoSo,
                TrangThai: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
                DiaChiGiaoHang: customer.DiaChi || 'Hà Nội, Việt Nam',
                createdAt: date,
                PhuongThucThanhToan: 'TIEN_MAT',
                TrangThaiThanhToan: Math.random() > 0.7 ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN'
            });
        }
        await DonHang.insertMany(ordersBuffer);
        console.log('Inserted 1,000 Orders.');

        console.log('Generating 1,000 R&D Process Tracks...');
        for (let i = 1; i <= 1000; i++) {
            const contract = insertedContracts[i % insertedContracts.length];
            const employee = employees.find(e => e.BoPhan === 'R&D' || e.BoPhan === 'Kỹ thuật') || employees[0];

            rdBuffer.push({
                MaNhatKy: `SEED-RD-${40000 + i}`,
                ContractID: contract._id,
                MaMauYeuCau: `RAL-${Math.floor(Math.random() * 9000) + 1000}`,
                TrangThai: rdStatuses[Math.floor(Math.random() * rdStatuses.length)],
                LichSuPhienBan: [
                    {
                        version: 'V1.0',
                        date: getRandomDate(sixMonthsAgo, today),
                        result: Math.random() > 0.5 ? 'fail' : 'pass',
                        parameters: 'Hàm lượng rắn: 62%, Độ nhớt: 88 KU',
                        feedback: 'Cần điều chỉnh độ bền màu dưới tia UV',
                        tester: employee.HoTen,
                        testerCode: employee.MaNV
                    }
                ]
            });
        }
        await NhatKyTestMau.insertMany(rdBuffer);
        console.log('Inserted 1,000 R&D Tracks.');

        console.log('MASSIVE SEED SUCCESS: Generated 3,000 new records total.');
        process.exit(0);
    } catch (err) {
        console.error('MASSIVE SEED ERROR:', err);
        process.exit(1);
    }
};

seedData();
