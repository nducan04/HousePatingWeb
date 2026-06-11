const HopDong = require('../models/HopDong');
const DonHang = require('../models/DonHang');
const RevenueTarget = require('../models/RevenueTarget');
const LenhSanXuat = require('../models/LenhSanXuat');
const ProductionTarget = require('../models/ProductionTarget');

/**
 * [POST] /api/reports/targets
 * @desc Thiết lập mục tiêu doanh thu (Kế hoạch)
 */
exports.setRevenueTarget = async (req, res) => {
  try {
    const { type, year, month, quarter, targetAmount } = req.body;

    // Validate dữ liệu cơ bản
    if (!['month', 'quarter', 'year'].includes(type) || !year || targetAmount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại tham số type, year và targetAmount.' 
      });
    }

    // Thiết lập bộ lọc để tìm xem mục tiêu đã tồn tại hay chưa
    const filter = { 
      type, 
      year, 
      month: month || null, 
      quarter: quarter || null 
    };

    // Giá trị cập nhật mới
    const update = { targetAmount };

    // Sử dụng findOneAndUpdate với tuỳ chọn upsert: true
    // - upsert: true -> Nếu chưa có dữ liệu sẽ tạo mới (insert)
    // - new: true -> Trả về bản ghi mới nhất sau khi cập nhật
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const target = await RevenueTarget.findOneAndUpdate(filter, update, options);

    return res.status(200).json({ 
      success: true, 
      data: target, 
      message: 'Cập nhật mục tiêu kế hoạch thành công.' 
    });
  } catch (error) {
    console.error('Lỗi API setRevenueTarget:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ. Không thể cài đặt mục tiêu.' 
    });
  }
};

/**
 * [GET] /api/reports/revenue
 * @desc Lấy dữ liệu Biểu đồ Doanh thu (Thực tế vs Kế hoạch)
 */
exports.getRevenueChartData = async (req, res) => {
  try {
    const { year, filter } = req.query; // filter: 'month' | 'quarter' | 'year'

    if (!year || !['month', 'quarter', 'year'].includes(filter)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu hoặc sai tham số year / filter.' 
      });
    }

    const queryYear = parseInt(year, 10);
    // Khoảng thời gian từ đầu năm đến cuối năm
    const startDate = new Date(`${queryYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${queryYear}-12-31T23:59:59.999Z`);

    /**
     * BƯỚC 1: Sử dụng Aggregation Pipeline trên collection HopDong
     * Để tính tổng tiền hợp đồng thực tế (TongGiaTri) đã chốt thành công.
     */
    const contractRevenueAgg = await HopDong.aggregate([
      {
        $match: {
          NgayLap: { $gte: startDate, $lte: endDate },
          TrangThai: { $in: ['signed', 'delivering', 'completed'] } // Chỉ lấy hợp đồng đang hoạt động hoặc hoàn tất
        }
      },
      {
        $project: {
          TongGiaTri: 1,
          month: { $month: "$NgayLap" },
          year: { $year: "$NgayLap" }
        }
      },
      {
        $addFields: {
          quarter: { $ceil: { $divide: ["$month", 3] } }
        }
      },
      {
        $group: {
          _id: filter === 'month' ? "$month" : (filter === 'quarter' ? "$quarter" : "$year"),
          totalRevenue: { $sum: "$TongGiaTri" }
        }
      }
    ]);

    /**
     * BƯỚC 2: Sử dụng Aggregation Pipeline trên collection DonHang
     * Để tính tổng doanh thu từ các đơn hàng bán lẻ đã hoàn thành/đang xử lý (trừ đơn hủy).
     */
    const orderRevenueAgg = await DonHang.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          TrangThai: { $ne: 'DA_HUY' }
        }
      },
      {
        $project: {
          TongTien: 1,
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        }
      },
      {
        $addFields: {
          quarter: { $ceil: { $divide: ["$month", 3] } }
        }
      },
      {
        $group: {
          _id: filter === 'month' ? "$month" : (filter === 'quarter' ? "$quarter" : "$year"),
          totalRevenue: { $sum: "$TongTien" }
        }
      }
    ]);

    // Trộn doanh thu từ cả hai nguồn (Hợp đồng B2B + Đơn hàng bán lẻ)
    const mergedActuals = {};

    contractRevenueAgg.forEach(item => {
      mergedActuals[item._id] = (mergedActuals[item._id] || 0) + item.totalRevenue;
    });

    orderRevenueAgg.forEach(item => {
      mergedActuals[item._id] = (mergedActuals[item._id] || 0) + item.totalRevenue;
    });

    /**
     * BƯỚC 3: Truy vấn Collection RevenueTarget
     * Để lấy ra các mục tiêu kế hoạch của năm đang xét.
     */
    const targets = await RevenueTarget.find({ type: filter, year: queryYear });

    /**
     * BƯỚC 4: Hợp nhất dữ liệu
     */
    const chartData = [];

    if (filter === 'month') {
      for (let i = 1; i <= 12; i++) {
        const actualVal = mergedActuals[i] || 0;
        const plan = targets.find(item => item.month === i);

        chartData.push({
          name: `Tháng ${i}`,
          thucTe: actualVal,
          keHoach: plan ? plan.targetAmount : 0
        });
      }
    } else if (filter === 'quarter') {
      for (let i = 1; i <= 4; i++) {
        const actualVal = mergedActuals[i] || 0;
        const plan = targets.find(item => item.quarter === i);

        chartData.push({
          name: `Quý ${i}`,
          thucTe: actualVal,
          keHoach: plan ? plan.targetAmount : 0
        });
      }
    } else if (filter === 'year') {
      const actualVal = mergedActuals[queryYear] || 0;
      const plan = targets.find(item => item.year === queryYear);

      chartData.push({
        name: `Năm ${queryYear}`,
        thucTe: actualVal,
        keHoach: plan ? plan.targetAmount : 0
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: chartData 
    });
  } catch (error) {
    console.error('Lỗi API getRevenueChartData:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ trong quá trình tổng hợp dữ liệu.' 
    });
  }
};

/**
 * [POST] /api/reports/targets/production
 * @desc Thiết lập mục tiêu sản lượng (Kế hoạch)
 */
exports.setProductionTarget = async (req, res) => {
  try {
    const { type, year, month, quarter, targetAmount } = req.body;

    // Validate dữ liệu cơ bản
    if (!['month', 'quarter', 'year'].includes(type) || !year || targetAmount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại tham số type, year và targetAmount.' 
      });
    }

    const filter = { type, year, month: month || null, quarter: quarter || null };
    const update = { targetAmount };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const target = await ProductionTarget.findOneAndUpdate(filter, update, options);

    return res.status(200).json({ success: true, data: target, message: 'Cập nhật mục tiêu kế hoạch thành công.' });
  } catch (error) {
    console.error('Lỗi API setProductionTarget:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ. Không thể cài đặt mục tiêu.' });
  }
};

/**
 * [GET] /api/reports/production
 * @desc Lấy dữ liệu Biểu đồ Sản lượng (Thực tế vs Kế hoạch)
 */
exports.getProductionChartData = async (req, res) => {
  try {
    const { year, filter } = req.query; // filter: 'month' | 'quarter' | 'year'

    if (!year || !['month', 'quarter', 'year'].includes(filter)) {
      return res.status(400).json({ success: false, message: 'Thiếu hoặc sai tham số year / filter.' });
    }

    const queryYear = parseInt(year, 10);
    const startDate = new Date(`${queryYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${queryYear}-12-31T23:59:59.999Z`);

    const orderAgg = await DonHang.aggregate([
      {
        $match: {
          TrangThai: { $ne: 'DA_HUY' },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          volume: { $sum: '$Items.SoLuong' },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        }
      },
      {
        $addFields: {
          quarter: { $ceil: { $divide: ["$month", 3] } }
        }
      },
      {
        $group: {
          _id: filter === 'month' ? "$month" : (filter === 'quarter' ? "$quarter" : "$year"),
          totalProduction: { $sum: "$volume" }
        }
      }
    ]);

    const targets = await ProductionTarget.find({ type: filter, year: queryYear });
    const chartData = [];

    if (filter === 'month') {
      for (let i = 1; i <= 12; i++) {
        const actualItem = orderAgg.find(item => item._id === i);
        const actualVal = actualItem ? actualItem.totalProduction : 0;
        const plan = targets.find(item => item.month === i);

        chartData.push({
          name: `Tháng ${i}`,
          prodActual: actualVal,
          prodPlan: plan ? plan.targetAmount : 0
        });
      }
    } else if (filter === 'quarter') {
      for (let i = 1; i <= 4; i++) {
        const actualItem = orderAgg.find(item => item._id === i);
        const actualVal = actualItem ? actualItem.totalProduction : 0;
        const plan = targets.find(item => item.quarter === i);

        chartData.push({
          name: `Quý ${i}`,
          prodActual: actualVal,
          prodPlan: plan ? plan.targetAmount : 0
        });
      }
    } else if (filter === 'year') {
      const actualItem = orderAgg.find(item => item._id === queryYear);
      const actualVal = actualItem ? actualItem.totalProduction : 0;
      const plan = targets.find(item => item.year === queryYear);

      chartData.push({
        name: `Năm ${queryYear}`,
        prodActual: actualVal,
        prodPlan: plan ? plan.targetAmount : 0
      });
    }

    return res.status(200).json({ success: true, data: chartData });
  } catch (error) {
    console.error('Lỗi API getProductionChartData:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ trong quá trình tổng hợp dữ liệu.' });
  }
};
