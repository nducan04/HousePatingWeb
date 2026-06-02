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
            {
                $group: {
                    _id: '$NhanVienPhuTrach',
                    totalRevenue: { $sum: '$TongTien' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // 3. TỔNG HỢP VẬN CHUYỂN (Logistics)
        const logisticsStats = await VanChuyen.aggregate([
            { $match: { TrangThaiTongQuat: 'Giao hàng thành công' } },
            {
                $group: {
                    _id: '$VanChuyenInfo.NhanVien',
                    deliveryCount: { $sum: 1 }
                }
            }
        ]);

        // 4. TỔNG HỢP R&D (Kỹ thuật pha chế)
        // Lưu ý: NhatKyTestMau lưu testerCode và tester, ta ưu tiên testerCode (MaNV)
        const rdStats = await NhatKyTestMau.aggregate([
            { $unwind: '$LichSuPhienBan' },
            {
                $group: {
                    _id: '$LichSuPhienBan.testerCode',
                    testerName: { $first: '$LichSuPhienBan.tester' },
                    testCount: { $sum: 1 },
                    passCount: { $sum: { $cond: [{ $eq: ['$LichSuPhienBan.result', 'pass'] }, 1, 0] } },
                    failCount: { $sum: { $cond: [{ $eq: ['$LichSuPhienBan.result', 'fail'] }, 1, 0] } }
                }
            }
        ]);

        let globalTotalTests = 0;
        let globalPassTests = 0;
        let globalFailTests = 0;

        rdStats.forEach(stat => {
            globalTotalTests += stat.testCount;
            globalPassTests += stat.passCount;
            globalFailTests += stat.failCount;
        });

        const errorRate = globalTotalTests > 0 ? parseFloat(((globalFailTests / globalTotalTests) * 100).toFixed(1)) : 0;
        const passRate = globalTotalTests > 0 ? parseFloat(((globalPassTests / globalTotalTests) * 100).toFixed(1)) : 0;

        const mixingChartData = rdStats
            .filter(s => s._id || s.testerName)
            .map(s => {
                const identifier = s._id || s.testerName || 'Unknown';
                const isSystem = identifier.toLowerCase().includes('hệ thống') || identifier.toLowerCase().includes('system');
                let displayName = '';
                if (isSystem) {
                    displayName = 'Hợp đồng pha chế';
                } else {
                    const nameParts = (s.testerName || identifier).split(' ');
                    displayName = nameParts.length > 2 ? nameParts.slice(-2).join(' ') : (s.testerName || identifier);
                }
                return {
                    name: displayName,
                    pass: s.passCount,
                    fail: s.failCount,
                    total: s.testCount
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // 5. TỔNG HỢP CSKH (Hỗ trợ)
        const supportStats = await PhanHoiHoTro.aggregate([
            {
                $group: {
                    _id: '$AssignedTo',
                    ticketCount: { $sum: 1 }
                }
            }
        ]);

        // 6. TRỘN DỮ LIỆU VÀO NHÂN VIÊN
        const processedStaff = staff.map(nv => {
            const nvId = nv._id.toString();
            const nvName = nv.HoTen;
            const nvMaNV = nv.MaNV;

            // Doanh số
            const sales = salesStats.find(s => s._id && s._id.toString() === nvId) || { totalRevenue: 0, orderCount: 0 };

            // Logistics
            const logistics = logisticsStats.find(l => l._id && l._id.toString() === nvId) || { deliveryCount: 0 };

            // R&D (Ưu tiên theo mã nhân viên, fallback theo tên)
            const rd = rdStats.find(r => (r._id && r._id === nvMaNV) || (r.testerName && r.testerName === nvName)) || { testCount: 0 };

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
                level: nv.HieuSuatKPI?.diemKPI >= 95 ? 'Excellent' : (nv.HieuSuatKPI?.diemKPI >= 85 ? 'Good' : 'Average')
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

        // 7. TÍNH TOÁN DỮ LIỆU BIỂU ĐỒ RADAR (ĐỘNG)
        let techScore = 90;
        let salesScore = 85;
        let disciplineScore = 90;
        let attitudeScore = 92;

        const employeeId = req.query.employeeId;
        if (employeeId) {
            const emp = staff.find(nv => nv._id.toString() === employeeId || nv.MaNV === employeeId);
            if (emp) {
                techScore = emp.HieuSuatKPI?.tyLeTestMau || emp.HieuSuatKPI?.diemKPI || 85;
                salesScore = emp.HieuSuatKPI?.diemKPI || 80;
                disciplineScore = emp.HieuSuatKPI?.tyLeMotDon || 90;
                attitudeScore = emp.HieuSuatKPI?.diemDanhGia || 92;
            }
        } else {
            const techStaff = staff.filter(nv => ['Kỹ thuật', 'Sản xuất'].includes(nv.BoPhan));
            const salesStaff = staff.filter(nv => ['Kinh doanh', 'Sale / MKT'].includes(nv.BoPhan));

            const avgTechKPI = techStaff.length > 0
                ? techStaff.reduce((sum, nv) => sum + (nv.HieuSuatKPI?.tyLeTestMau || nv.HieuSuatKPI?.diemKPI || 85), 0) / techStaff.length
                : 85;

            const rdBase = passRate > 0 ? passRate : avgTechKPI;
            techScore = rdBase;

            const avgSalesKPI = salesStaff.length > 0
                ? salesStaff.reduce((sum, nv) => sum + (nv.HieuSuatKPI?.diemKPI || 80), 0) / salesStaff.length
                : 80;
            salesScore = avgSalesKPI;

            const avgDiscipline = staff.length > 0
                ? staff.reduce((sum, nv) => sum + (nv.HieuSuatKPI?.tyLeMotDon || 90), 0) / staff.length
                : 90;
            disciplineScore = avgDiscipline;

            const avgAttitude = staff.length > 0
                ? staff.reduce((sum, nv) => sum + (nv.HieuSuatKPI?.diemDanhGia || 92), 0) / staff.length
                : 92;
            attitudeScore = avgAttitude;
        }

        const radarData = [
            { subject: 'Kỹ thuật', A: Math.round((techScore / 100) * 150), fullMark: 150 },
            { subject: 'Doanh số', A: Math.round((salesScore / 100) * 150), fullMark: 150 },
            { subject: 'Kỷ luật', A: Math.round((disciplineScore / 100) * 150), fullMark: 150 },
            { subject: 'Thái độ', A: Math.round((attitudeScore / 100) * 150), fullMark: 150 }
        ];

        res.status(200).json({
            success: true,
            summary: {
                totalRevenue,
                bestStaff,
                errorRate,
                passRate
            },
            charts: {
                topSales: topSalesStaff,
                mixingStats: mixingChartData,
                radar: radarData
            },
            staff: processedStaff
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
