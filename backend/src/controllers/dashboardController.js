const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const KhachHang = require('../models/KhachHang');
const SanPhamSon = require('../models/SanPhamSon');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const SalesTarget = require('../models/SalesTarget');
const mongoose = require('mongoose');

// @desc    Get global dashboard stats
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. KPI: Customer Count
    const totalCustomers = await KhachHang.countDocuments();
    const prevCustomers = await KhachHang.countDocuments({
      createdAt: { $lt: new Date(currentYear, currentMonth - 1, 1) }
    });
    const customerChange = prevCustomers === 0 ? 100 : Math.round(((totalCustomers - prevCustomers) / prevCustomers) * 100);

    // 2. KPI: Revenue & Volume (Aggregated from Orders & Contracts)
    // Orders
    const orderStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$TongTien' },
        totalVolume: { $sum: { $sum: '$Items.SoLuong' } }
      }}
    ]);

    // Contracts
    const contractStats = await HopDong.aggregate([
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$TongGiaTri' },
        totalVolume: { $sum: { $sum: '$ChiTietHopDong.SoLuong' } }
      }}
    ]);

    const globalRevenue = (orderStats[0]?.totalRevenue || 0) + (contractStats[0]?.totalRevenue || 0);
    const globalVolume = (orderStats[0]?.totalVolume || 0) + (contractStats[0]?.totalVolume || 0);

    // 3. Monthly Series for Charts (Last 6 months)
    const monthlySeries = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59);

      // Revenue for this month
      const ordersM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: '$TongTien' } } }]);
      const contractsM = await HopDong.aggregate([{ $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: '$TongGiaTri' } } }]);
      
      // Target for this month
      const targetsM = await SalesTarget.aggregate([{ $match: { 'period.month': m, 'period.year': y } }, { $group: { _id: null, rev: { $sum: '$targetRevenue' }, vol: { $sum: '$targetKg' } } }]);

      // Volume for this month
      const ordersVolM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$Items.SoLuong' } } } }]);
      const contractsVolM = await HopDong.aggregate([{ $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$ChiTietHopDong.SoLuong' } } } }]);

      const revActual = ((ordersM[0]?.total || 0) + (contractsM[0]?.total || 0)) / 1000000; // In Millions
      const volActual = (ordersVolM[0]?.total || 0) + (contractsVolM[0]?.total || 0);

      monthlySeries.push({
        month: `T${m}/${y.toString().slice(-2)}`,
        revenueActual: Math.round(revActual),
        revenuePlan: Math.round((targetsM[0]?.rev || 500000000) / 1000000), // Fallback if no specific targets
        prodActual: Math.round(volActual),
        prodPlan: targetsM[0]?.vol || 2000
      });
    }

    // 4. Top Customers
    const topCustomerStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' } } },
      { $group: {
        _id: '$KhachHang',
        volume: { $sum: { $sum: '$Items.SoLuong' } },
        revenue: { $sum: '$TongTien' }
      }},
      { $sort: { volume: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'KhachHangs',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo'
      }},
      { $unwind: '$customerInfo' }
    ]);

    const formattedTopCustomers = topCustomerStats.map(c => ({
      name: c.customerInfo.TenKhachHang,
      segment: c.customerInfo.PhanLoai,
      volume: c.volume,
      target: 2500, // Default target or fetch from SalesTarget if exists
      revenue: c.revenue
    }));

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalRevenue: { value: Math.round(globalRevenue / 1000000), unit: 'Tr VNĐ', change: 12, label: 'Tổng Doanh Thu' },
          totalProduction: { value: globalVolume, unit: 'kg', change: 8, label: 'Tổng Sản Lượng' },
          customerCount: { value: totalCustomers, unit: 'Đối tác', change: customerChange, label: 'Tổng Khách Hàng' },
          avgOrderValue: { value: Math.round(globalRevenue / (totalCustomers || 1) / 1000000), unit: 'Tr/Khách', change: 5, label: 'Giá trị Trung bình' }
        },
        monthlyTrends: monthlySeries,
        topCustomers: formattedTopCustomers
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed analytics for reports
// @route   GET /api/dashboard/detailed-stats
exports.getDetailedStats = async (req, res) => {
  try {
    // 1. Order Status Distribution
    const orderStatusDist = await DonHang.aggregate([
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 2. Revenue by Product Category
    // We need to join with SanPhamSon to get the category (PhanLoai)
    const revenueByCategory = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' } } },
      { $unwind: '$Items' },
      { $lookup: {
        from: 'SanPhamSons',
        localField: 'Items.SanPhamId',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $group: {
        _id: '$product.PhanLoai',
        revenue: { $sum: { $multiply: ['$Items.GiaHienTai', '$Items.SoLuong'] } },
        volume: { $sum: '$Items.SoLuong' }
      }}
    ]);

    // 3. R&D Performance
    const rdStats = await NhatKyTestMau.aggregate([
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 4. Contract Status
    const contractStats = await HopDong.aggregate([
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 5. Unified Top 5 Products (Combined from DonHang & HopDong)
    // Step 5a: Aggregate from DonHang
    const dhProductStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' } } },
      { $unwind: '$Items' },
      { $group: {
        _id: '$Items.TenSanPham', // Use name for easier merging with HopDong
        totalSold: { $sum: '$Items.SoLuong' },
        popularity: { $sum: 1 },
        revenue: { $sum: { $multiply: ['$Items.GiaHienTai', '$Items.SoLuong'] } },
        sku: { $first: '$Items.MaSanPham' } // We might need this, but might be empty in some records
      }}
    ]);

    // Step 5b: Aggregate from HopDong
    const hdProductStats = await HopDong.aggregate([
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$ChiTietHopDong' },
      { $group: {
        _id: '$ChiTietHopDong.productName',
        totalSold: { $sum: '$ChiTietHopDong.quantity' },
        popularity: { $sum: 1 },
        revenue: { $sum: { $multiply: ['$ChiTietHopDong.unitPrice', '$ChiTietHopDong.quantity'] } }
      }}
    ]);

    // Step 5c: Merge results
    const productMergeMap = {};
    [...dhProductStats, ...hdProductStats].forEach(p => {
      const name = p._id;
      if (!productMergeMap[name]) {
        productMergeMap[name] = { name, sold: 0, popularity: 0, revenue: 0, sku: p.sku || 'N/A' };
      }
      productMergeMap[name].sold += p.totalSold;
      productMergeMap[name].popularity += p.popularity;
      productMergeMap[name].revenue += p.revenue;
      if (p.sku && productMergeMap[name].sku === 'N/A') productMergeMap[name].sku = p.sku;
    });

    const topProducts = Object.values(productMergeMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // 6. Recent Large Contracts (> 100M)
    const largeContracts = await HopDong.find({ TongGiaTri: { $gte: 100000000 } })
      .populate('CustomerID', 'TenKhachHang PhanLoai')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent High Value Orders (> 5M)
    const highValueOrders = await DonHang.find({ TongTien: { $gte: 5000000 } })
      .populate('KhachHang', 'TenKhachHang PhanLoai')
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Top Popular Colors (Combined from DonHang & HopDong)
    const dhColorStats = await DonHang.aggregate([
      { $unwind: '$Items' },
      { $match: { 'Items.MaMau': { $exists: true, $ne: '' } } },
      { $group: { _id: '$Items.MaMau', count: { $sum: 1 } } }
    ]);
    const hdColorStats = await HopDong.aggregate([
      { $unwind: '$ChiTietHopDong' },
      { $match: { 'ChiTietHopDong.colorCode': { $exists: true, $ne: '' } } },
      { $group: { _id: '$ChiTietHopDong.colorCode', count: { $sum: 1 } } }
    ]);

    // Merge and sort in memory
    const colorMap = {};
    [...dhColorStats, ...hdColorStats].forEach(c => {
      colorMap[c._id] = (colorMap[c._id] || 0) + c.count;
    });

    const topColors = Object.keys(colorMap)
      .map(code => ({ name: code, count: colorMap[code] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 9. Top Sales Staff Performance (Revenue vs Count)
    // 9a. From DonHang
    const dhSalesStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' }, NhanVienPhuTrach: { $exists: true } } },
      { $group: {
        _id: '$NhanVienPhuTrach',
        revenue: { $sum: '$TongTien' },
        orderCount: { $sum: 1 }
      }}
    ]);

    // 9b. From HopDong
    const hdSalesStats = await HopDong.aggregate([
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] }, EmployeeID: { $exists: true } } },
      { $group: {
        _id: '$EmployeeID',
        revenue: { $sum: '$TongGiaTri' },
        contractCount: { $sum: 1 }
      }}
    ]);

    // 9c. Merge and Lookup NhanVien info
    const salesStaffMap = {};
    dhSalesStats.forEach(s => {
      salesStaffMap[s._id] = { revenue: s.revenue, orderCount: s.orderCount };
    });
    hdSalesStats.forEach(s => {
      if (!salesStaffMap[s._id]) salesStaffMap[s._id] = { revenue: 0, orderCount: 0 };
      salesStaffMap[s._id].revenue += s.revenue;
      salesStaffMap[s._id].orderCount += s.contractCount;
    });

    const staffIds = Object.keys(salesStaffMap).map(id => new mongoose.Types.ObjectId(id));
    const NhanVien = require('../models/NhanVien');
    const staffInfo = await NhanVien.find({ _id: { $in: staffIds } }).select('MaNV HoTen BoPhan');

    const topSalesStaff = staffInfo.map(info => ({
      id: info._id,
      maNV: info.MaNV,
      hoTen: info.HoTen,
      boPhan: info.BoPhan,
      revenue: salesStaffMap[info._id].revenue,
      count: salesStaffMap[info._id].orderCount
    })).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        orderStatusDist,
        revenueByCategory,
        rdStats,
        contractStats,
        topProducts,
        topSalesStaff,
        largeContracts: largeContracts.map(c => ({
          id: c._id,
          code: c.MaHopDong,
          customer: c.CustomerID?.TenKhachHang || 'N/A',
          type: c.CustomerID?.PhanLoai || 'B2B',
          value: c.TongGiaTri,
          status: c.TrangThai,
          date: c.createdAt
        })),
        highValueOrders: highValueOrders.map(o => ({
          id: o._id,
          code: o.MaDonHang,
          customer: o.KhachHang?.TenKhachHang || 'N/A',
          value: o.TongTien,
          status: o.TrangThai,
          date: o.createdAt
        })),
        topColors
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
