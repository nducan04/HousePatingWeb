const SalesTarget = require('../models/SalesTarget');
const AlertLog = require('../models/AlertLog');

// @desc    Get all sales targets
// @route   GET /api/targets
// @access  Public
exports.getTargets = async (req, res) => {
  try {
    const targets = await SalesTarget.find().populate('customer', 'name code segment highRisk');
    res.status(200).json({ success: true, count: targets.length, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new sales target
// @route   POST /api/targets
// @access  Public
exports.createTarget = async (req, res) => {
  try {
    const target = await SalesTarget.create(req.body);
    res.status(201).json({ success: true, data: target });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Target for this period already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get alerts log
// @route   GET /api/targets/alerts
// @access  Public
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await AlertLog.find().sort({ sentAt: -1 }).populate('customer', 'name code assignedSale');
    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
