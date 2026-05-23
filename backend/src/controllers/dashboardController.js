const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const KhachHang = require('../models/KhachHang');
const SanPhamSon = require('../models/SanPhamSon');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const SalesTarget = require('../models/SalesTarget');
const mongoose = require('mongoose');

// Helper giải quyết khoảng thời gian động dựa trên tham số period từ frontend
const resolvePeriodDates = (period) => {
  let queryYear = 2026;
  if (period) {
    const yearMatch = period.match(/\d{4}/);
    if (yearMatch) {
      queryYear = parseInt(yearMatch[0], 10);
    }
  }

  let startDate, endDate, prevStartDate, prevEndDate;

  if (period && period.startsWith('Tháng')) {
    const month = parseInt(period.split(' ')[1].split('/')[0]);
    startDate = new Date(queryYear, month - 1, 1);
    endDate = new Date(queryYear, month, 0, 23, 59, 59);
    prevStartDate = new Date(queryYear, month - 2, 1);
    prevEndDate = new Date(queryYear, month - 1, 0, 23, 59, 59);
  } else if (period && period.startsWith('Quý')) {
    const quarter = parseInt(period.split(' ')[1].split('/')[0]);
    startDate = new Date(queryYear, (quarter - 1) * 3, 1);
    endDate = new Date(queryYear, quarter * 3, 0, 23, 59, 59);
    prevStartDate = new Date(queryYear, (quarter - 2) * 3, 1);
    prevEndDate = new Date(queryYear, (quarter - 1) * 3, 0, 23, 59, 59);
  } else {
    // Mặc định lọc theo năm
    startDate = new Date(queryYear, 0, 1);
    endDate = new Date(queryYear, 11, 31, 23, 59, 59);
    prevStartDate = new Date(queryYear - 1, 0, 1);
    prevEndDate = new Date(queryYear - 1, 11, 31, 23, 59, 59);
  }

  return { queryYear, startDate, endDate, prevStartDate, prevEndDate };
};

// @desc    Get global dashboard stats
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    const { queryYear, startDate, endDate, prevStartDate, prevEndDate } = resolvePeriodDates(period);

    // 1. KPI: Customer Count (Filtered by period)
    const totalCustomers = await KhachHang.countDocuments({
      createdAt: { $lte: endDate }
    });
    const prevCustomers = await KhachHang.countDocuments({
      createdAt: { $lte: startDate }
    });
    const customerChange = prevCustomers === 0 ? 100 : Math.round(((totalCustomers - prevCustomers) / prevCustomers) * 100);

    // 2. KPI: Revenue & Volume (Filtered by period)
    const getStatsForRange = async (start, end) => {
      const orders = await DonHang.aggregate([
        { $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: null,
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$TrangThaiThanhToan', 'DA_THANH_TOAN'] }, 
                '$TongTien', 
                { $ifNull: ['$DaCoc', 0] } 
              ]
            }
          },
          totalVolume: { $sum: { $sum: '$Items.SoLuong' } }
        }}
      ]);
      const contracts = await HopDong.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$DaThanhToan', 0] } },
          totalVolume: { $sum: { $sum: '$ChiTietHopDong.quantity' } }
        }}
      ]);
      return {
        revenue: (orders[0]?.totalRevenue || 0) + (contracts[0]?.totalRevenue || 0),
        volume: (orders[0]?.totalVolume || 0) + (contracts[0]?.totalVolume || 0)
      };
    };

    const currentStats = await getStatsForRange(startDate, endDate);
    const prevStats = await getStatsForRange(prevStartDate, prevEndDate);

    const globalRevenue = currentStats.revenue;
    const globalVolume = currentStats.volume;

    // 3. Monthly Series for Charts (Adjusted by period)
    const monthlySeries = [];
    let monthsToShow = 6;
    let endMonth = now.getMonth();
    let endYear = now.getFullYear();

    if (period && period.startsWith('Tháng')) {
      monthsToShow = 6;
      endMonth = parseInt(period.split(' ')[1].split('/')[0]) - 1;
    } else if (period && period.startsWith('Quý')) {
      const quarter = parseInt(period.split(' ')[1].split('/')[0]);
      monthsToShow = 3;
      endMonth = quarter * 3 - 1;
    } else if (period && period.startsWith('Năm')) {
      monthsToShow = 12;
      endMonth = 11;
    }

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(queryYear, endMonth - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59);

      // Revenue for this month (Based on actual payments)
      const ordersM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$TrangThaiThanhToan', 'DA_THANH_TOAN'] }, '$TongTien', { $ifNull: ['$DaCoc', 0] }] } } } }]);
      const contractsM = await HopDong.aggregate([{ $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $ifNull: ['$DaThanhToan', 0] } } } }]);
      
      // Target for this month
      const targetsM = await SalesTarget.aggregate([{ $match: { 'period.month': m, 'period.year': y } }, { $group: { _id: null, rev: { $sum: '$targetRevenue' }, vol: { $sum: '$targetKg' } } }]);

      // Volume for this month
      const ordersVolM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$Items.SoLuong' } } } }]);
      const contractsVolM = await HopDong.aggregate([{ $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$ChiTietHopDong.quantity' } } } }]);

      const revActual = ((ordersM[0]?.total || 0) + (contractsM[0]?.total || 0)) / 1000000; // In Millions
      const volActual = (ordersVolM[0]?.total || 0) + (contractsVolM[0]?.total || 0);

      monthlySeries.push({
        month: `T${m}/${y.toString().slice(-2)}`,
        revenueActual: Math.round(revActual),
        revenuePlan: Math.round((targetsM[0]?.rev || 500000000) / 1000000), 
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

    // Calculate real growth compared to last period
    const revChange = prevStats.revenue > 0 
      ? Math.round(((currentStats.revenue - prevStats.revenue) / prevStats.revenue) * 100) 
      : 0;
    
    const volChange = prevStats.volume > 0 
      ? Math.round(((currentStats.volume - prevStats.volume) / prevStats.volume) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalRevenue: { value: Math.round(globalRevenue / 1000000), unit: 'Tr VNĐ', change: revChange, label: 'Tổng Doanh Thu' },
          totalProduction: { value: globalVolume, unit: 'kg', change: volChange, label: 'Tổng Sản Lượng' },
          customerCount: { value: totalCustomers, unit: 'Đối tác', change: customerChange, label: 'Tổng Khách Hàng' },
          avgOrderValue: { value: Math.round(globalRevenue / (totalCustomers || 1) / 1000000), unit: 'Tr/Khách', change: 0, label: 'Giá trị Trung bình' }
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
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    // 1. Order Status Distribution
    const orderStatusDist = await DonHang.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 2. Revenue by Product Category (Unified from Orders & Contracts)
    const dhRevenueByCat = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$Items' },
      { $lookup: {
        from: 'SanPhamSons',
        localField: 'Items.SanPham',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $group: {
        _id: '$product.PhanLoai',
        revenue: { $sum: { $multiply: ['$Items.DonGia', '$Items.SoLuong'] } },
        volume: { $sum: '$Items.SoLuong' }
      }}
    ]);

    const hdRevenueByCat = await HopDong.aggregate([
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$ChiTietHopDong' },
      { $group: {
        _id: 'Dự án B2B',
        revenue: { $sum: { $multiply: ['$ChiTietHopDong.unitPrice', '$ChiTietHopDong.quantity'] } },
        volume: { $sum: '$ChiTietHopDong.quantity' }
      }}
    ]);

    const revenueByCategory = [...dhRevenueByCat, ...hdRevenueByCat];

    // 3. R&D Performance
    const rdStats = await NhatKyTestMau.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 4. Contract Status
    const contractStats = await HopDong.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 5. Unified Top 5 Products (Combined from DonHang & HopDong)
    const dhProductStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$Items' },
      { $group: {
        _id: '$Items.TenSanPham', 
        totalSold: { $sum: '$Items.SoLuong' },
        popularity: { $sum: 1 },
        revenue: { $sum: { $multiply: ['$Items.DonGia', '$Items.SoLuong'] } }
      }}
    ]);

    const hdProductStats = await HopDong.aggregate([
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] }, createdAt: { $gte: startDate, $lte: endDate } } },
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
        productMergeMap[name] = { name, sold: 0, popularity: 0, revenue: 0, sku: 'N/A' };
      }
      productMergeMap[name].sold += p.totalSold;
      productMergeMap[name].popularity += p.popularity;
      productMergeMap[name].revenue += p.revenue;
    });

    const topProducts = Object.values(productMergeMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // 6. Recent Large Contracts (> 100M)
    const largeContracts = await HopDong.find({ 
      TongGiaTri: { $gte: 100000000 },
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('CustomerID', 'TenKhachHang PhanLoai')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent High Value Orders (> 5M)
    const highValueOrders = await DonHang.find({ 
      TongTien: { $gte: 5000000 },
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('KhachHang', 'TenKhachHang PhanLoai')
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Top Popular Colors (Combined from DonHang & HopDong)
    const dhColorStats = await DonHang.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$Items' },
      { $match: { 'Items.MaMau': { $exists: true, $ne: '' } } },
      { $group: { _id: '$Items.MaMau', count: { $sum: 1 } } }
    ]);
    const hdColorStats = await HopDong.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
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

    // 9. Top Sales Staff Performance (Revenue vs Count based on payments)
    const dhSalesStats = await DonHang.aggregate([
      { $match: { TrangThai: { $ne: 'DA_HUY' }, NhanVienPhuTrach: { $exists: true }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$NhanVienPhuTrach',
        revenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$TrangThaiThanhToan', 'DA_THANH_TOAN'] }, 
              '$TongTien', 
              { $ifNull: ['$DaCoc', 0] } 
            ]
          } 
        },
        orderCount: { $sum: 1 }
      }}
    ]);

    const hdSalesStats = await HopDong.aggregate([
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] }, EmployeeID: { $exists: true }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$EmployeeID',
        revenue: { $sum: { $ifNull: ['$DaThanhToan', 0] } },
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

// @desc    Get inventory specific stats
// @route   GET /api/dashboard/inventory-stats
exports.getInventoryStats = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    const products = await SanPhamSon.find();
    
    // 1. Basic Stats
    const totalSKUs = products.length;
    const lowStockItems = products.filter(p => {
      const stock = (p.TongTonKho > 0) ? p.TongTonKho : (p.TonKho || 0);
      return stock < 10;
    }).length;
    
    const totalStockValue = products.reduce((sum, p) => {
      const stock = (p.TongTonKho > 0) ? p.TongTonKho : (p.TonKho || 0);
      return sum + (stock * (p.DonGiaCoSo || 0));
    }, 0);
    
    // 2. Stock by Category
    const categoryDist = await SanPhamSon.aggregate([
      { $group: { 
        _id: '$PhanLoai', 
        count: { $sum: 1 }, 
        totalStock: { $sum: { $cond: [{ $gt: ['$TongTonKho', 0] }, '$TongTonKho', { $ifNull: ['$TonKho', 0] }] } } 
      }}
    ]);

    // 3. Recent Transactions (Filtered by period)
    const PhieuNhapXuatKho = require('../models/PhieuNhapXuatKho');
    const recentMovements = await PhieuNhapXuatKho.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Map TenNguoiLap if NguoiLapPhieu isn't populated
    const formattedMovements = recentMovements.map(m => ({
      _id: m._id,
      MaPhieu: m.MaPhieu,
      LoaiPhieu: m.LoaiPhieu,
      createdAt: m.createdAt,
      NhanVien: { HoTen: m.TenNguoiLap || 'Hệ thống' }
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSKUs,
          lowStockItems,
          totalStockValue,
          totalKg: products.reduce((sum, p) => sum + ((p.TongTonKho > 0) ? p.TongTonKho : (p.TonKho || 0)), 0)
        },
        categoryDist,
        recentMovements: formattedMovements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get production and R&D stats
// @route   GET /api/dashboard/production-stats
exports.getProductionStats = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    const LenhSanXuat = require('../models/LenhSanXuat');
    
    // 1. Production Volume (always show trends for last 6 months but contextualized?)
    // Actually, if a specific month is selected, maybe show that month's production?
    const productionTrends = await LenhSanXuat.aggregate([
      { $match: { TrangThai: 'completed', CompletionTime: { $exists: true, $ne: null } } },
      { $group: {
        _id: { month: { $month: '$CompletionTime' }, year: { $year: '$CompletionTime' } },
        totalKg: { $sum: '$TargetWeight' }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    // 2. R&D Stats (Filtered by period)
    const rdPerformance = await NhatKyTestMau.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
    ]);

    // 3. Efficiency
    const completedRd = rdPerformance.find(p => ['completed', 'DAT', 'DaTest'].includes(p._id))?.count || 0;
    const totalRd = rdPerformance.reduce((s, c) => s + c.count, 0);
    const rdSuccessRate = totalRd > 0 ? Math.round((completedRd / totalRd) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        productionTrends,
        rdPerformance,
        efficiency: 98,
        rdSuccessRate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
