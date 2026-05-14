const mongoose = require('mongoose');
const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const KhachHang = require('../models/KhachHang');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Helper to hash password if needed (TaiKhoan model has a pre-save hook, so we save plain text)
        
        // 1. Create Employee Account
        const employeeData = {
            TenDangNhap: 'employee1',
            MatKhau: 'password123',
            Email: 'employee1@vtsc.vn',
            VaiTro: 'NhanVien'
        };

        let employeeAcc = await TaiKhoan.findOne({ TenDangNhap: employeeData.TenDangNhap });
        if (!employeeAcc) {
            employeeAcc = await TaiKhoan.create(employeeData);
            console.log('Created Employee Account');
        } else {
            console.log('Employee Account already exists');
        }

        let employeeProfile = await NhanVien.findOne({ AccountID: employeeAcc._id });
        if (!employeeProfile) {
            await NhanVien.create({
                AccountID: employeeAcc._id,
                MaNV: 'NV001',
                HoTen: 'Nguyễn Văn Nhân Viên',
                ChucVu: 'Kinh Doanh',
                BoPhan: 'Phòng Kinh Doanh',
                Email: employeeData.Email,
                SDT: '0912345678',
                TrangThai: 'Đang làm'
            });
            console.log('Created Employee Profile');
        }

        // 2. Create B2C Customer Account
        const b2cData = {
            TenDangNhap: 'cust_b2c',
            MatKhau: 'password123',
            Email: 'customer_b2c@gmail.com',
            VaiTro: 'KhachHangB2C'
        };

        let b2cAcc = await TaiKhoan.findOne({ TenDangNhap: b2cData.TenDangNhap });
        if (!b2cAcc) {
            b2cAcc = await TaiKhoan.create(b2cData);
            console.log('Created B2C Customer Account');
        } else {
            console.log('B2C Customer Account already exists');
        }

        let b2cProfile = await KhachHang.findOne({ AccountID: b2cAcc._id });
        if (!b2cProfile) {
            await KhachHang.create({
                AccountID: b2cAcc._id,
                MaKH: 'KH_B2C_001',
                PhanLoai: 'B2C',
                TenKhachHang: 'Khách Hàng Lẻ (B2C)',
                Email: b2cData.Email,
                SDT: '0987654321',
                DiaChi: 'Hà Nội'
            });
            console.log('Created B2C Customer Profile');
        }

        // 3. Create B2B Customer Account
        const b2bData = {
            TenDangNhap: 'cust_b2b',
            MatKhau: 'password123',
            Email: 'partner_b2b@company.com',
            VaiTro: 'KhachHangB2B'
        };

        let b2bAcc = await TaiKhoan.findOne({ TenDangNhap: b2bData.TenDangNhap });
        if (!b2bAcc) {
            b2bAcc = await TaiKhoan.create(b2bData);
            console.log('Created B2B Customer Account');
        } else {
            console.log('B2B Customer Account already exists');
        }

        let b2bProfile = await KhachHang.findOne({ AccountID: b2bAcc._id });
        if (!b2bProfile) {
            await KhachHang.create({
                AccountID: b2bAcc._id,
                MaKH: 'KH_B2B_001',
                PhanLoai: 'B2B',
                TenKhachHang: 'Công Ty Đối Tác (B2B)',
                Email: b2bData.Email,
                SDT: '0241234567',
                DiaChi: 'Hải Phòng'
            });
            console.log('Created B2B Customer Profile');
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
