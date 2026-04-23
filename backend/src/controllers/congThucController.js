const CongThuc = require('../models/CongThuc');
const NguyenVatLieu = require('../models/NguyenVatLieu');

// @desc    Get all formulas
// @route   GET /api/formulas
exports.getFormulas = async (req, res) => {
  try {
    const formulas = await CongThuc.find()
      .populate('SanPham', 'TenDongSon MaSanPham')
      .populate('ThanhPhan.NguyenVatLieu', 'TenNguyenVatLieu MaNVL TonKho');
    res.status(200).json({ success: true, count: formulas.length, data: formulas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create formula
// @route   POST /api/formulas
exports.createFormula = async (req, res) => {
  try {
    const formula = await CongThuc.create(req.body);
    res.status(201).json({ success: true, data: formula });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Calculate material requirements for a target weight
// @route   POST /api/formulas/:id/calculate
exports.calculateRequirement = async (req, res) => {
  try {
    const { targetKg } = req.body;
    const formula = await CongThuc.findById(req.params.id)
      .populate('ThanhPhan.NguyenVatLieu', 'TenNguyenVatLieu MaNVL TonKho DonViTinh');

    if (!formula) {
      return res.status(404).json({ success: false, message: 'Formula not found' });
    }

    const requirements = formula.ThanhPhan.map(tp => {
      const requiredAmount = (tp.TiLe / 100) * (targetKg || 0);
      const isShortage = tp.NguyenVatLieu.TonKho < requiredAmount;
      return {
        material: tp.NguyenVatLieu.TenNguyenVatLieu,
        maNVL: tp.NguyenVatLieu.MaNVL,
        required: requiredAmount,
        inStock: tp.NguyenVatLieu.TonKho,
        unit: tp.NguyenVatLieu.DonViTinh,
        shortage: isShortage ? requiredAmount - tp.NguyenVatLieu.TonKho : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        formulaName: formula.TenCongThuc,
        targetKg,
        requirements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
