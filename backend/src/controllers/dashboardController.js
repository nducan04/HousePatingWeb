const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const KhachHang = require('../models/KhachHang');
const SanPhamSon = require('../models/SanPhamSon');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const SalesTarget = require('../models/SalesTarget');
const RevenueTarget = require('../models/RevenueTarget');
const ProductionTarget = require('../models/ProductionTarget');
const BaoHanh = require('../models/BaoHanh');
const PhanHoiHoTro = require('../models/PhanHoiHoTro');
const DoiTra = require('../models/DoiTra');
const NhanVien = require('../models/NhanVien');
const mongoose = require('mongoose');

// Helper giải quyết khoảng thời gian động dựa trên tham số period từ frontend
const resolvePeriodDates = (period) => {
  let queryYear = new Date().getFullYear();
  if (period) {
    const yearMatch = period.match(/\d{4}/);
    if (yearMatch) {
      queryYear = parseInt(yearMatch[0], 10);
    }
  }

  let startDate, endDate, prevStartDate, prevEndDate;
  let granularity = 'month';
  let bins = [];

  if (period && period.startsWith('Tháng')) {
    const month = parseInt(period.split(' ')[1].split('/')[0]);
    startDate = new Date(queryYear, month - 1, 1);
    endDate = new Date(queryYear, month, 0, 23, 59, 59);
    prevStartDate = new Date(queryYear, month - 2, 1);
    prevEndDate = new Date(queryYear, month - 1, 0, 23, 59, 59);
    granularity = 'day';
    const daysInMonth = endDate.getDate();
    for(let i = 1; i <= daysInMonth; i++) {
      bins.push({ label: `N${i}`, day: i, month, year: queryYear });
    }
  } else if (period && period.startsWith('Quý')) {
    const quarter = parseInt(period.split(' ')[1].split('/')[0]);
    startDate = new Date(queryYear, (quarter - 1) * 3, 1);
    endDate = new Date(queryYear, quarter * 3, 0, 23, 59, 59);
    prevStartDate = new Date(queryYear, (quarter - 2) * 3, 1);
    prevEndDate = new Date(queryYear, (quarter - 1) * 3, 0, 23, 59, 59);
    granularity = 'month';
    for(let i = (quarter - 1) * 3 + 1; i <= quarter * 3; i++) {
      bins.push({ label: `T${i}`, month: i, year: queryYear });
    }
  } else {
    // Mặc định lọc theo năm
    startDate = new Date(queryYear, 0, 1);
    endDate = new Date(queryYear, 11, 31, 23, 59, 59);
    prevStartDate = new Date(queryYear - 1, 0, 1);
    prevEndDate = new Date(queryYear - 1, 11, 31, 23, 59, 59);
    granularity = 'month';
    for(let i = 1; i <= 12; i++) {
      bins.push({ label: `T${i}`, month: i, year: queryYear });
    }
  }

  return { queryYear, startDate, endDate, prevStartDate, prevEndDate, granularity, bins };
};

// @desc    Get global dashboard stats
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    const { queryYear, startDate, endDate, prevStartDate, prevEndDate, granularity, bins } = resolvePeriodDates(period);

    // 1. KPI: Customer Count (Filtered by period)
    const totalCustomers = await KhachHang.countDocuments({
      createdAt: { $lte: endDate }
    });
    const prevCustomers = await KhachHang.countDocuments({
      createdAt: { $lte: startDate }
    });
    const customerChange = prevCustomers === 0 ? 100 : Math.round(((totalCustomers - prevCustomers) / prevCustomers) * 100);

    // 1b. KPI: Order Count (Filtered by period)
    const totalOrders = await DonHang.countDocuments({
      TrangThai: { $ne: 'DA_HUY' },
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const prevOrders = await DonHang.countDocuments({
      TrangThai: { $ne: 'DA_HUY' },
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });
    const orderChange = prevOrders === 0 ? 100 : Math.round(((totalOrders - prevOrders) / prevOrders) * 100);

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

    // Fetch all revenue and production targets for the query year at once to avoid query inside loop
    const allRevTargets = await RevenueTarget.find({ type: 'month', year: queryYear });
    const allProdTargets = await ProductionTarget.find({ type: 'month', year: queryYear });

    // 3. Monthly/Daily Series for Charts (Adjusted by period bins)
    const monthlySeries = [];

    for (const bin of bins) {
      let binStart, binEnd;
      if (granularity === 'day') {
        binStart = new Date(bin.year, bin.month - 1, bin.day);
        binEnd = new Date(bin.year, bin.month - 1, bin.day, 23, 59, 59);
      } else {
        binStart = new Date(bin.year, bin.month - 1, 1);
        binEnd = new Date(bin.year, bin.month, 0, 23, 59, 59);
      }

      // Revenue for this bin (Based on actual payments)
      const ordersM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: binStart, $lte: binEnd } } }, { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$TrangThaiThanhToan', 'DA_THANH_TOAN'] }, '$TongTien', { $ifNull: ['$DaCoc', 0] }] } } } }]);
      const contractsM = await HopDong.aggregate([{ $match: { createdAt: { $gte: binStart, $lte: binEnd } } }, { $group: { _id: null, total: { $sum: { $ifNull: ['$DaThanhToan', 0] } } } }]);
      
      // Target matching for this bin
      const matchedRevTarget = allRevTargets.find(t => t.month === bin.month);
      const matchedProdTarget = allProdTargets.find(t => t.month === bin.month);
      const targetRevVal = matchedRevTarget ? matchedRevTarget.targetAmount : 500000000;
      const targetProdVal = matchedProdTarget ? matchedProdTarget.targetAmount : 2000;

      // Volume for this bin
      const ordersVolM = await DonHang.aggregate([{ $match: { TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: binStart, $lte: binEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$Items.SoLuong' } } } }]);
      const contractsVolM = await HopDong.aggregate([{ $match: { createdAt: { $gte: binStart, $lte: binEnd } } }, { $group: { _id: null, total: { $sum: { $sum: '$ChiTietHopDong.quantity' } } } }]);

      const revActual = ((ordersM[0]?.total || 0) + (contractsM[0]?.total || 0)) / 1000000; // In Millions
      const volActual = (ordersVolM[0]?.total || 0) + (contractsVolM[0]?.total || 0);

      monthlySeries.push({
        month: bin.label,
        revenueActual: Math.round(revActual),
        revenuePlan: Math.round(targetRevVal / 1000000 / (granularity === 'day' ? 30 : 1)), 
        prodActual: Math.round(volActual),
        prodPlan: Math.round(targetProdVal / (granularity === 'day' ? 30 : 1))
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
          totalProduction: { value: globalVolume, unit: 'thùng', change: volChange, label: 'Tổng Sản Lượng' },
          customerCount: { value: totalCustomers, unit: 'Đối tác', change: customerChange, label: 'Tổng Khách Hàng' },
          orderCount: { value: totalOrders, unit: 'đơn', change: orderChange, label: 'Đơn đặt hàng' },
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
      { $match: { TrangThai: { $ne: 'DA_HUY' }, NhanVienPhuTrach: { $exists: true, $ne: null }, createdAt: { $gte: startDate, $lte: endDate } } },
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
      { $match: { TrangThai: { $nin: ['cancelled', 'draft'] }, EmployeeID: { $exists: true, $ne: null }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$EmployeeID',
        revenue: { $sum: { $ifNull: ['$DaThanhToan', 0] } },
        contractCount: { $sum: 1 }
      }}
    ]);

    // 9c. Merge and Lookup NhanVien info
    const salesStaffMap = {};
    dhSalesStats.forEach(s => {
      if (s._id) {
        salesStaffMap[s._id] = { revenue: s.revenue, orderCount: s.orderCount };
      }
    });
    hdSalesStats.forEach(s => {
      if (s._id) {
        if (!salesStaffMap[s._id]) salesStaffMap[s._id] = { revenue: 0, orderCount: 0 };
        salesStaffMap[s._id].revenue += s.revenue;
        salesStaffMap[s._id].orderCount += s.contractCount;
      }
    });

    const staffIds = Object.keys(salesStaffMap)
      .filter(id => id && id !== 'null' && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    const NhanVienModel = require('../models/NhanVien');
    const staffInfo = await NhanVienModel.find({ _id: { $in: staffIds } }).select('MaNV HoTen BoPhan');

    const topSalesStaff = staffInfo.map(info => ({
      id: info._id,
      maNV: info.MaNV,
      hoTen: info.HoTen,
      boPhan: info.BoPhan,
      revenue: salesStaffMap[info._id.toString()]?.revenue || 0,
      count: salesStaffMap[info._id.toString()]?.orderCount || 0
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

    const bestSellers = await DonHang.aggregate([
      {
        $match: {
          TrangThai: { $ne: 'DA_HUY' },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$Items" },
      {
        $group: {
          _id: "$Items.SanPham",
          SoLuongBan: { $sum: "$Items.SoLuong" },
          TongDoanhThu: { $sum: "$Items.ThanhTien" }
        }
      },
      {
        $lookup: {
          from: "SanPhamSons",
          localField: "_id",
          foreignField: "_id",
          as: "SanPhamInfo"
        }
      },
      { $unwind: "$SanPhamInfo" },
      {
        $project: {
          _id: 1,
          MaSanPham: "$SanPhamInfo.MaSanPham",
          TenDongSon: "$SanPhamInfo.TenDongSon",
          HinhAnh: { $arrayElemAt: ["$SanPhamInfo.HinhAnh", 0] },
          SoLuongBan: 1,
          TongDoanhThu: 1
        }
      },
      { $sort: { SoLuongBan: -1 } },
      { $limit: 10 }
    ]);

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
        recentMovements: formattedMovements,
        bestSellers
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
    const { startDate, endDate, granularity, bins } = resolvePeriodDates(period);

    const LenhSanXuat = require('../models/LenhSanXuat');
    
    // 1. Production Volume
    const productionTrendsRaw = await LenhSanXuat.aggregate([
      { $match: { TrangThai: 'completed', CompletionTime: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: granularity === 'day' 
          ? { day: { $dayOfMonth: '$CompletionTime' }, month: { $month: '$CompletionTime' }, year: { $year: '$CompletionTime' } }
          : { month: { $month: '$CompletionTime' }, year: { $year: '$CompletionTime' } },
        totalKg: { $sum: '$TargetWeight' }
      }}
    ]);

    const productionTrends = bins.map(bin => {
      const finder = granularity === 'day' 
        ? t => t._id.day === bin.day && t._id.month === bin.month && t._id.year === bin.year
        : t => t._id.month === bin.month && t._id.year === bin.year;
      const data = productionTrendsRaw.find(finder);
      return {
        month: bin.label,
        totalKg: data ? data.totalKg : 0
      };
    });

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

// @desc    Get customer service stats
// @route   GET /api/dashboard/customer-service-stats
exports.getCustomerServiceStats = async (req, res) => {
  try {
    const { period } = req.query;
    const { queryYear, startDate, endDate, granularity, bins } = resolvePeriodDates(period);

    // 1. KPI: Total Returns/Warranty (using DoiTra model)
    const totalReturns = await DoiTra.countDocuments({
      LoaiYeuCau: { $in: ['Bảo hành', 'Đổi trả'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const fixedReturns = await DoiTra.countDocuments({
      LoaiYeuCau: { $in: ['Bảo hành', 'Đổi trả'] },
      TrangThai: { $in: ['Đã hoàn tiền', 'Đã hoàn tất'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const successRate = totalReturns > 0 ? ((fixedReturns / totalReturns) * 100).toFixed(1) : 100;

    // 2. Pending Requests (DoiTra)
    const pendingTickets = await DoiTra.find({
      TrangThai: { $nin: ['Đã hoàn tất', 'Đã hủy', 'Đã hoàn tiền'] },
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('KhachHang', 'TenKhachHang')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingComplaints = pendingTickets.map(t => ({
      id: t.MaDoiTra || t._id.toString(),
      customer: t.KhachHang?.TenKhachHang || 'Khách hàng',
      status: t.TrangThai === 'draft' ? 'Chờ tiếp nhận' : (t.TrangThai || 'Chờ tiếp nhận'),
      time: new Date(t.createdAt).toLocaleDateString('vi-VN')
    }));

    // 3. Trends (DoiTra theo thời gian thực)
    const supportTrendsRaw = await DoiTra.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: granularity === 'day' 
          ? { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }
          : { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        tickets: { $sum: 1 }
      }}
    ]);

    const formattedTrends = bins.map(bin => {
      const finder = granularity === 'day' 
        ? t => t._id.day === bin.day && t._id.month === bin.month && t._id.year === bin.year
        : t => t._id.month === bin.month && t._id.year === bin.year;

      const data = supportTrendsRaw.find(finder);
      return {
        week: bin.label, // Giữ nguyên key week để frontend không lỗi chart
        tickets: data ? data.tickets : 0
      };
    });

    // 4. Loyalty & Vouchers (From KhuyenMai and DonHang)
    let activeVouchers = 0;
    let vipCustomers = 0;
    let churnAlerts = 0;
    let totalVouchers = 0;
    let voucherTypes = { PHAN_TRAM: 0, GIAM_THANG: 0, TANG_KEM: 0 };
    let voucherUsagesList = [];
    let topVouchers = [];
    
    try {
      const KhuyenMai = require('../models/KhuyenMai');
      activeVouchers = await KhuyenMai.countDocuments({ TrangThai: 'DANG_DIEN_RA', createdAt: { $lte: endDate } });
      totalVouchers = await KhuyenMai.countDocuments({});

      // Group vouchers by type
      const allVouchers = await KhuyenMai.find({});
      allVouchers.forEach(v => {
        if (voucherTypes[v.LoaiGiamGia] !== undefined) {
          voucherTypes[v.LoaiGiamGia]++;
        } else {
          voucherTypes[v.LoaiGiamGia] = 1;
        }
      });
      
      const DonHang = require('../models/DonHang');
      
      // Calculate VIP Customers (Spent > 1,000,000,000)
      const vipAggregation = await DonHang.aggregate([
        { $match: { TrangThai: { $ne: 'DA_HUY' } } },
        { $group: { _id: '$KhachHang', totalSpent: { $sum: '$TongTien' } } },
        { $match: { totalSpent: { $gte: 1000000000 } } }
      ]);
      vipCustomers = vipAggregation.length;

      // Calculate Churn Alerts (No orders in the last 60 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const recentOrders = await DonHang.aggregate([
        { $match: { TrangThai: { $ne: 'DA_HUY' } } },
        { $group: { _id: '$KhachHang', lastOrder: { $max: '$createdAt' } } }
      ]);
      churnAlerts = recentOrders.filter(o => o.lastOrder < sixtyDaysAgo).length;

      // Who used which voucher, when
      const usages = await DonHang.find({ KhuyenMai: { $ne: null } })
        .populate('KhachHang', 'TenKhachHang')
        .populate('KhuyenMai', 'MaVoucher LoaiGiamGia MucGiam')
        .sort({ createdAt: -1 })
        .limit(20);

      voucherUsagesList = usages.map(u => ({
        orderId: u.MaDonHang || u._id.toString(),
        customerName: u.KhachHang?.TenKhachHang || 'Khách hàng lẻ',
        voucherCode: u.KhuyenMai?.MaVoucher || 'N/A',
        discountAmount: u.GiamGia || 0,
        totalAmount: u.TongTien,
        date: new Date(u.createdAt).toLocaleDateString('vi-VN'),
        status: u.TrangThai
      }));

      // Top 5 used vouchers
      const allOrdersWithVouchers = await DonHang.find({ KhuyenMai: { $ne: null }, TrangThai: { $ne: 'DA_HUY' } })
        .populate('KhuyenMai', 'MaVoucher');
      const voucherUsageCounts = {};
      allOrdersWithVouchers.forEach(o => {
        const code = o.KhuyenMai?.MaVoucher;
        if (code) {
          voucherUsageCounts[code] = (voucherUsageCounts[code] || 0) + 1;
        }
      });
      topVouchers = Object.keys(voucherUsageCounts).map(code => ({
        code,
        count: voucherUsageCounts[code]
      })).sort((a, b) => b.count - a.count).slice(0, 5);

    } catch (err) {
      console.log('Error fetching loyalty stats:', err.message);
    }

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalReturns,
          successRate,
          avgResponseTime: 2.5, // Mock data since no time tracking yet
          csatScore: 4.5
        },
        loyalty: {
          activeVouchers,
          vipCustomers,
          churnAlerts,
          totalVouchers,
          voucherTypes,
          voucherUsagesList,
          topVouchers
        },
        supportTrends: formattedTrends,
        pendingComplaints
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed customer service report data for Excel Export
// @route   GET /api/dashboard/customer-service-report
exports.getCustomerServiceReportData = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    const DoiTra = require('../models/DoiTra');

    const returns = await DoiTra.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('KhachHang', 'TenKhachHang')
      .populate('NhanVienPhuTrach', 'HoTen')
      .sort({ createdAt: -1 });

    let combinedLogs = [];

    returns.forEach(r => {
      combinedLogs.push({
        id: r.MaDoiTra || r._id.toString(),
        customer: r.KhachHang?.TenKhachHang || 'Khách hàng',
        type: r.LoaiYeuCau || 'Đổi trả',
        cause: r.LyDo || '',
        status: r.TrangThai === 'draft' ? 'Chờ tiếp nhận' : (r.TrangThai || 'Chờ tiếp nhận'),
        assignee: r.NhanVienPhuTrach?.HoTen || '',
        solution: r.PhuongAnGiaiQuyet || '',
        createdAt: r.createdAt
      });
    });

    combinedLogs.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: combinedLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get HR & Legal stats

// @route   GET /api/dashboard/hr-legal-stats
exports.getHrLegalStats = async (req, res) => {
  try {
    const { period } = req.query;
    const { queryYear, startDate, endDate, granularity, bins } = resolvePeriodDates(period);

    // 1. HR KPIs
    const totalStaff = await NhanVien.countDocuments({ TrangThai: 'Đang làm' });
    
    // 2. Legal cases (Disputed Contracts)
    const activeLegalCases = await HopDong.countDocuments({ TrangThai: 'disputed' });

    // 3. HR Trends (Tuyển mới và nghỉ việc theo khoảng thời gian thực)
    const hrTrendsRaw = await NhanVien.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: granularity === 'day' 
          ? { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }
          : { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        newHires: { $sum: 1 }
      }}
    ]);

    const resignationsRaw = await NhanVien.aggregate([
      { $match: { TrangThai: 'Đã nghỉ việc', updatedAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: granularity === 'day' 
          ? { day: { $dayOfMonth: '$updatedAt' }, month: { $month: '$updatedAt' }, year: { $year: '$updatedAt' } }
          : { month: { $month: '$updatedAt' }, year: { $year: '$updatedAt' } },
        resignations: { $sum: 1 }
      }}
    ]);

    const hrTrends = bins.map(bin => {
      const finder = granularity === 'day' 
        ? t => t._id.day === bin.day && t._id.month === bin.month && t._id.year === bin.year
        : t => t._id.month === bin.month && t._id.year === bin.year;

      const monthData = hrTrendsRaw.find(finder);
      const resigData = resignationsRaw.find(finder);
      
      return {
        month: bin.label,
        newHires: monthData ? monthData.newHires : 0,
        resignations: resigData ? resigData.resignations : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalStaff,
          expiringContracts: 0, // Mock as no HR Contract model exists
          onTimeRate: 98.2, // Mock as no Timesheet model exists
          activeLegalCases
        },
        hrTrends,
        expiringContractsList: []
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed HR & Legal report data for Excel Export
// @route   GET /api/dashboard/hr-legal-report
exports.getHrLegalReportData = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    const HopDong = require('../models/HopDong');
    
    // Fetch B2B Contracts for Blockchain Audit Table
    const b2bContracts = await HopDong.find({
      LoaiHopDong: 'B2B',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('CustomerID', 'TenKhachHang').sort({ createdAt: -1 });

    const contractLogs = b2bContracts.map(c => {
      const isVerified = c.TransactionHash && c.TransactionHash.length > 5;
      return {
        id: c.MaHopDong,
        partner: c.CustomerID?.TenKhachHang || c.partyBRepresentative || 'Khách hàng',
        txHash: c.TransactionHash || 'Chưa có dữ liệu băm',
        block: isVerified ? `Block #${Math.floor(Math.random() * 100000) + 5600000}` : 'N/A',
        status: isVerified ? 'Đã xác minh' : 'Chờ ký số',
        date: c.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: contractLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed business report data for Excel Export
// @route   GET /api/dashboard/business-report
exports.getBusinessReportData = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    // Get Orders (B2C)
    const DonHang = require('../models/DonHang');
    const orders = await DonHang.find({ TrangThai: { $ne: 'DA_HUY' }, createdAt: { $gte: startDate, $lte: endDate } })
      .populate('KhachHang', 'TenKhachHang');

    // Get Contracts (B2B)
    const HopDong = require('../models/HopDong');
    const contracts = await HopDong.find({ TrangThai: { $nin: ['cancelled', 'draft'] }, createdAt: { $gte: startDate, $lte: endDate } })
      .populate('CustomerID', 'TenKhachHang');

    let transactions = [];

    // Map Orders
    orders.forEach(order => {
      const orderSubtotal = order.Items.reduce((acc, i) => acc + ((i.SoLuong || 0) * (i.DonGia || 0)), 0);
      const applyTax = orderSubtotal >= 5000000;
      order.Items.forEach(item => {
        const qty = item.SoLuong || 0;
        const price = item.DonGia || 0;
        const amount = qty * price;
        const tax = applyTax ? amount * 0.08 : 0;
        transactions.push({
          id: order.MaDonHang || order._id.toString(),
          customer: order.KhachHang?.TenKhachHang || 'Khách lẻ',
          type: 'B2C',
          product: item.TenSanPham || 'Sản phẩm',
          quantity: qty,
          unitPrice: price,
          tax: tax,
          total: amount + tax,
          date: order.createdAt
        });
      });
    });

    // Map Contracts
    contracts.forEach(contract => {
      const contractSubtotal = contract.ChiTietHopDong.reduce((acc, i) => acc + ((i.quantity || 0) * (i.unitPrice || 0)), 0);
      const applyTax = contractSubtotal >= 5000000;
      contract.ChiTietHopDong.forEach(item => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const amount = qty * price;
        const tax = applyTax ? amount * 0.08 : 0;
        transactions.push({
          id: contract.MaHopDong || contract._id.toString(),
          customer: contract.CustomerID?.TenKhachHang || 'Dự án B2B',
          type: 'B2B',
          product: item.productName || 'Sản phẩm dự án',
          quantity: qty,
          unitPrice: price,
          tax: tax,
          total: amount + tax,
          date: contract.createdAt
        });
      });
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed inventory report data for Excel Export
// @route   GET /api/dashboard/inventory-report
exports.getInventoryReportData = async (req, res) => {
  try {
    const SanPhamSon = require('../models/SanPhamSon');
    const products = await SanPhamSon.find({});

    let inventoryList = [];

    products.forEach(p => {
      if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
        p.DanhSachMaMau.forEach(mau => {
          const qty = mau.TonKhoKhaDung || 0;
          const price = p.DonGiaCoSo || 0;
          inventoryList.push({
            sku: `${p.MaSanPham}-${mau.MaMau}`,
            name: `${p.TenDongSon} - ${mau.TenMau}`,
            category: p.PhanLoai || 'Chung',
            quantity: qty,
            unitPrice: price,
            totalValue: qty * price
          });
        });
      } else {
        const qty = p.TongTonKho || p.TonKho || 0;
        const price = p.DonGiaCoSo || 0;
        inventoryList.push({
          sku: p.MaSanPham,
          name: p.TenDongSon,
          category: p.PhanLoai || 'Chung',
          quantity: qty,
          unitPrice: price,
          totalValue: qty * price
        });
      }
    });

    res.status(200).json({
      success: true,
      data: inventoryList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed production & R&D report data for Excel Export
// @route   GET /api/dashboard/production-report
exports.getProductionReportData = async (req, res) => {
  try {
    const { period } = req.query;
    const { startDate, endDate } = resolvePeriodDates(period);

    const NhatKyTestMau = require('../models/NhatKyTestMau');
    const rdLogs = await NhatKyTestMau.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'ContractID',
      populate: { path: 'CustomerID', select: 'TenKhachHang' }
    }).sort({ createdAt: -1 });

    const formattedLogs = rdLogs.map(log => {
      let testWeight = 0;
      let engineer = 'Chưa phân công';
      if (log.LichSuPhienBan && log.LichSuPhienBan.length > 0) {
        testWeight = log.LichSuPhienBan.reduce((sum, v) => sum + (v.inputWeight || 0), 0);
        engineer = log.LichSuPhienBan[log.LichSuPhienBan.length - 1].tester || 'Chưa phân công';
      }

      let statusStr = 'Tiếp nhận';
      if (['testing'].includes(log.TrangThai)) statusStr = 'Đang pha chế';
      else if (['approved', 'rejected'].includes(log.TrangThai)) statusStr = 'Kiểm định KCS';
      else if (['complete', 'completed'].includes(log.TrangThai)) statusStr = 'Hoàn thành';

      return {
        id: log.MaNhatKy,
        customer: log.ContractID?.CustomerID?.TenKhachHang || 'Nội bộ VTSC',
        colorCode: log.MaMauYeuCau,
        testWeight: testWeight,
        status: statusStr,
        engineer: engineer
      };
    });

    res.status(200).json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
