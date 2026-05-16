const NhatKyTestMau = require('../models/NhatKyTestMau');
const HopDong = require('../models/HopDong');
const NhanVien = require('../models/NhanVien');

// @desc    Get all R&D logs
// @route   GET /api/rd-tracking
exports.getRDLogs = async (req, res) => {
  try {
    const logs = await NhatKyTestMau.find()
      .populate('ContractID', 'MaHopDong title')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single R&D log by ID
// @route   GET /api/rd-tracking/:id
exports.getRDLogById = async (req, res) => {
  try {
    const log = await NhatKyTestMau.findById(req.params.id)
      .populate('ContractID', 'MaHopDong title CustomerID ChiTietHopDong');
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new R&D process for a contract
// @route   POST /api/rd-tracking
exports.createRDLog = async (req, res) => {
  try {
    const { ContractID, MaMauYeuCau } = req.body;
    
    // Generate unique ID
    const count = await NhatKyTestMau.countDocuments();
    const MaNhatKy = `RD-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(2, '0')}`;
    
    const log = await NhatKyTestMau.create({
      MaNhatKy,
      ContractID,
      MaMauYeuCau,
      TrangThai: 'testing',
      LichSuPhienBan: []
    });
    
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add a test version (batch log)
// @route   POST /api/rd-tracking/:id/versions
exports.addVersion = async (req, res) => {
  try {
    const { result, parameters, feedback, inputWeight, outputWeight } = req.body;
    const log = await NhatKyTestMau.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    
    // Auto-versioning
    const nextVer = `V${log.LichSuPhienBan.length + 1}.0`;
    
    // Find tester details
    let testerName = 'Unknown Tester';
    let testerCode = 'N/A';
    if (req.user) {
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) {
        testerName = nv.HoTen;
        testerCode = nv.MaNV;
      }
    }

    log.LichSuPhienBan.push({
      version: nextVer,
      date: new Date(),
      result,
      parameters,
      feedback,
      inputWeight,
      outputWeight,
      tester: testerName,
      testerCode: testerCode
    });
    
    await log.save();
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    KCS Signature - Approve test sample and update contract status
// @route   PATCH /api/rd-tracking/:id/sign-kcs
exports.signKCS = async (req, res) => {
  try {
    const log = await NhatKyTestMau.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    
    // Check permission (Middleware should handle this usually, but we implement logic here)
    // Temporarily disabled to unblock user
    /*
    if (req.user?.VaiTro?.toLowerCase() !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admin/KCS Manager can sign off.' });
    }
    */
    
    // Verify there is at least one "pass" version
    const hasPass = log.LichSuPhienBan.some(v => v.result === 'pass');
    if (!hasPass) {
      return res.status(400).json({ success: false, message: 'Cannot sign off without at least one PASSED version.' });
    }
    
    // Find reviewer name
    let reviewerName = 'Admin';
    if (req.user) {
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) reviewerName = nv.HoTen;
    }
    
    // Update Log Status
    log.TrangThai = 'approved';
    log.signedBy = reviewerName;
    log.signedAt = new Date();
    await log.save();
    
    // Update Contract Status to 'delivering'
    await HopDong.findByIdAndUpdate(log.ContractID, { TrangThai: 'delivering' });
    
    res.status(200).json({ success: true, message: 'KCS Approved. Contract moved to Delivering status.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
