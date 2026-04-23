const DonHang = require('../models/DonHang');
const VanChuyen = require('../models/VanChuyen');
const NhanVien = require('../models/NhanVien');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const PhanHoiHoTro = require('../models/PhanHoiHoTro');
const mongoose = require('mongoose');

// @desc    Lấy chỉ số hiệu suất tổng hợp cho dashboard
// @route   GET /api/hieu-suat/stats
exports.getPerformanceStats = async (req, res) => {
    try {
        // 1. Lấy danh sách toàn bộ nhân viên để map dữ liệu
        const staff = await NhanVien.find({ TrangThai: 'Đang làm' });

        // 2. TỔNG HỢP DOANH SỐ (Kinh doanh)
        const salesStats = await DonHang.aggregate([
            { $match: { TrangThai: { $ne: 'DA_HUY' } } },
            { $group: {
                _id: '$NhanVienPhuTrach',
                totalRevenue: { $sum: '$TongTien' },
                orderCount: { $sum: 1 }
            }}
        ]);

        // 3. TỔNG HỢP VẬN CHUYỂN (Logistics)
        const logisticsStats = await VanChuyen.aggregate([
            { $match: { TrangThaiTongQuat: 'Giao hàng thành công' } },
            { $group: {
                _id: '$VanChuyenInfo.NhanVien',
                deliveryCount: { $sum: 1 }
            }}
        ]);

        // 4. TỔNG HỢP R&D (Kỹ thuật)
        // Lưu ý: NhatKyTestMau lưu tester là string (tên), nên ta aggregate theo tên
        const rdStats = await NhatKyTestMau.aggregate([
            { $unwind: '$LichSuPhienBan' },
            { $match: { 'LichSuPhienBan.result': 'pass' } },
            { $group: {
                _id: '$LichSuPhienBan.tester',
                testCount: { $sum: 1 }
            }}
        ]);

        // 5. TỔNG HỢP CSKH (Hỗ trợ)
        const supportStats = await PhanHoiHoTro.aggregate([
            { $group: {
                _id: '$AssignedTo',
                ticketCount: { $sum: 1 }
            }}
        ]);

        // 6. TRỘN DỮ LIỆU VÀO NHÂN VIÊN
        const processedStaff = staff.map(nv => {
            const nvId = nv._id.toString();
            const nvName = nv.HoTen;

            // Doanh số
            const sales = salesStats.find(s => s._id && s._id.toString() === nvId) || { totalRevenue: 0, orderCount: 0 };
            
            // Logistics
            const logistics = logisticsStats.find(l => l._id && l._id.toString() === nvId) || { deliveryCount: 0 };
            
            // R&D (Dựa trên tên nhân viên)
            const rd = rdStats.find(r => r._id === nvName) || { testCount: 0 };

            // CSKH
            const support = supportStats.find(su => su._id && su._id.toString() === nvId) || { ticketCount: 0 };

            return {
                id: nv._id,
                maNV: nv.MaNV,
                name: nv.HoTen,
                dept: nv.BoPhan,
                role: nv.ChucVu,
                avatar: nv.Avatar,
                // KPI Metrics
                revenue: sales.totalRevenue,
                orders: sales.orderCount,
                deliveries: logistics.deliveryCount,
                tests: rd.testCount,
                customers: support.ticketCount,
                satisfaction: nv.HieuSuatKPI?.diemKPI || 90, 
                level: nv.HieuSuatKPI?.diemKPI >= 95 ? 'Excellent' : (nv.HieuSuatKPI?.diemKPI >= 80 ? 'Good' : 'Average')
            };
        });

        // 6. TỔNG HỢP CHỈ SỐ DASHBOARD
        const totalRevenue = salesStats.reduce((sum, s) => sum + s.totalRevenue, 0);
        const topSalesStaff = [...processedStaff]
            .filter(s => s.dept === 'Sale / MKT' || s.dept === 'Kinh doanh' || s.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(s => ({
                name: s.name.split(' ').slice(-1)[0], // Lấy tên cuối
                fullName: s.name,
                value: Math.round(s.revenue / 1000000), // Triệu VNĐ
                color: 'var(--accent-cyan)'
            }));

        const bestStaff = processedStaff.sort((a, b) => (b.revenue + b.deliveries * 1000000 + b.tests * 500000) - (a.revenue + a.deliveries * 1000000 + a.tests * 500000))[0];

        res.status(200).json({
            success: true,
            summary: {
                totalRevenue,
                bestStaff,
                errorRate: 1.2 // Mock figure for now unless we have a specific error log collection
            },
            charts: {
                topSales: topSalesStaff,
                // Radar data based on global avg or specific staff if passed in query
                radar: [
                    { subject: 'Kỹ thuật', A: 120, fullMark: 150 },
                    { subject: 'Doanh số', A: 110, fullMark: 150 },
                    { subject: 'Kỷ luật', A: 130, fullMark: 150 },
                    { subject: 'Thái độ', A: 140, fullMark: 150 },
                ]
            },
            staff: processedStaff
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
