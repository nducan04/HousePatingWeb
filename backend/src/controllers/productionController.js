const LenhSanXuat = require('../models/LenhSanXuat');
const HopDong = require('../models/HopDong');
const CongThuc = require('../models/CongThuc');
const NhanVien = require('../models/NhanVien');
const NguyenVatLieu = require('../models/NguyenVatLieu');

// @desc    Get all production orders
// @route   GET /api/production
exports.getProductionOrders = async (req, res) => {
  try {
    const orders = await LenhSanXuat.find()
      .populate('ContractID', 'MaHopDong title')
      .populate('CongThucID', 'MaCongThuc TenCongThuc')
      .populate('Assignee', 'HoTen MaNV')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get data for creating new production order (approved contracts & formulas)
// @route   GET /api/production/pre-create
exports.getPreCreateData = async (req, res) => {
  try {
    // Only signed/delivering B2B contracts
    const contracts = await HopDong.find({ 
      TrangThai: { $in: ['signed', 'delivering'] },
      LoaiHopDong: 'B2B'
    }).select('MaHopDong title ChiTietHopDong');

    // All active formulas
    const formulas = await CongThuc.find({ TrangThai: 'Active' })
      .select('MaCongThuc TenCongThuc MaMau ThanhPhan');

    // All technical personnel
    const technicians = await NhanVien.find({ 
      BoPhan: { $in: ['Phòng Kỹ thuật', 'Sản xuất', 'KCS'] },
      TrangThai: 'Đang làm'
    }).select('HoTen MaNV');

    res.status(200).json({ 
      success: true, 
      data: { contracts, formulas, technicians } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new production order with MRP calculation
// @route   POST /api/production
exports.createProductionOrder = async (req, res) => {
  try {
    const { ContractID, CongThucID, TargetWeight, Assignee, ProductionLine, GhiChu } = req.body;

    // 1. Fetch Formula to calculate requirements
    const formula = await CongThuc.findById(CongThucID).populate('ThanhPhan.NguyenVatLieu');
    if (!formula) {
      return res.status(404).json({ success: false, message: 'Công thức không tồn tại hoặc đã bị vô hiệu hóa.' });
    }

    // 2. MRP Calculation
    const materialRequirements = formula.ThanhPhan.map(item => {
      const nvl = item.NguyenVatLieu;
      const weight = (item.TiLe / 100) * TargetWeight;
      return {
        NguyenVatLieu: nvl._id,
        MaNVL: nvl.MaNVL,
        TenNVL: nvl.TenNguyenVatLieu,
        TiLe: item.TiLe,
        KhoiLuongDuToan: weight
      };
    });

    // 3. Generate MaLenh
    const count = await LenhSanXuat.countDocuments();
    const MaLenhSanXuat = `MO-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(2, '0')}`;

    // 4. Create Order
    const order = await LenhSanXuat.create({
      MaLenhSanXuat,
      ContractID,
      CongThucID,
      TargetWeight,
      Assignee,
      ProductionLine,
      GhiChu,
      MaterialRequirements: materialRequirements,
      TrangThai: 'in_progress'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single production order by ID
// @route   GET /api/production/:id
exports.getProductionOrderById = async (req, res) => {
  try {
    const order = await LenhSanXuat.findById(req.params.id)
      .populate('ContractID')
      .populate('CongThucID')
      .populate('Assignee');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Production order not found' });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
