const mongoose = require('mongoose');
const NhaCungCap = require('./src/models/NhaCungCap');
const PhieuDatHangNCC = require('./src/models/PhieuDatHangNCC');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Tạo 1 nhà cung cấp thử nghiệm
        const testNCC = await NhaCungCap.create({
            MaNCC: 'TEST_' + Date.now().toString().slice(-4),
            TenNCC: 'Nhà cung cấp Thử Nghiệm Công Nợ',
            SDT: '0987654321',
            CongNo: 1000000 // Ban đầu nợ 1 triệu
        });
        console.log(`Đã tạo NCC TEST: ${testNCC.TenNCC}, Công nợ ban đầu: ${testNCC.CongNo.toLocaleString()}đ`);

        // 2. Mô phỏng tạo phiếu đặt hàng PO trị giá 50 triệu
        const poTongTien = 50000000;
        const testPO = await PhieuDatHangNCC.create({
            MaPhieu: 'PDH_TEST_' + Date.now().toString().slice(-4),
            SupplierID: testNCC._id,
            TongTien: poTongTien,
            ChiTiet: [
                { MaItem: 'NVL001', TenItem: 'Hóa chất A', SoLuong: 100, DonGia: 500000, ThanhTien: poTongTien }
            ],
            TrangThai: 'Mới'
        });
        console.log(`Đã tạo phiếu đặt hàng PO: ${testPO.MaPhieu}, Tổng tiền: ${testPO.TongTien.toLocaleString()}đ`);

        // 3. Thực hiện cộng công nợ (logic mới sửa đổi)
        await NhaCungCap.findByIdAndUpdate(testNCC._id, {
            $inc: { CongNo: testPO.TongTien || 0 }
        });

        // 4. Lấy lại NCC và xem công nợ mới
        const updatedNCC = await NhaCungCap.findById(testNCC._id);
        console.log(`Công nợ mới sau khi đặt hàng: ${updatedNCC.CongNo.toLocaleString()}đ`);
        
        const expectedDebt = testNCC.CongNo + poTongTien;
        if (updatedNCC.CongNo === expectedDebt) {
            console.log('✅ TEST THÀNH CÔNG: Công nợ được tính chính xác bằng công nợ cũ + tiền đặt hàng!');
        } else {
            console.log('❌ TEST THẤT BẠI: Tính toán công nợ bị sai lệch!');
        }

        // Dọn dẹp dữ liệu test
        await NhaCungCap.findByIdAndDelete(testNCC._id);
        await PhieuDatHangNCC.findByIdAndDelete(testPO._id);
        console.log('Đã dọn dẹp dữ liệu test.');

        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi chạy test:', error);
        process.exit(1);
    }
}

runTest();
