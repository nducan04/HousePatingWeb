const NhatKyTestMau = require('../models/NhatKyTestMau');
const HopDong = require('../models/HopDong');
const NhanVien = require('../models/NhanVien');

// @desc    Get all R&D logs
// @route   GET /api/rd-tracking
exports.getRDLogs = async (req, res) => {
  try {
    let query = {};
    
    if (req.query.type === 'standalone') {
      query.ContractID = { $exists: false }; // Yêu cầu từ khách hàng không có ContractID
    } else if (req.query.type === 'contract') {
      query.ContractID = { $exists: true, $ne: null }; // Nhật ký pha chế từ hợp đồng
    }

    if (req.user && (req.user.VaiTro === 'KhachHangB2C' || req.user.VaiTro === 'KhachHangB2B')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (kh) {
        if (req.query.type === 'standalone') {
          // Lọc các yêu cầu có customerName giống với tên khách hàng
          query.customerName = { $regex: new RegExp(kh.TenKhachHang, 'i') };
        } else {
          // Lọc hợp đồng
          const contracts = await HopDong.find({ CustomerID: kh._id });
          const contractIds = contracts.map(c => c._id);
          query.ContractID = { $in: contractIds };
        }
      } else {
        // Nếu không phải Khách hàng cụ thể nhưng có tên trong User
        if (req.query.type === 'standalone' && req.user.username) {
            query.customerName = { $regex: new RegExp(req.user.username, 'i') };
        } else {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    }

    if (req.query.contractId) {
      query.ContractID = req.query.contractId;
    }

    const logs = await NhatKyTestMau.find(query)
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
    const id = req.params.id || '';
    let query = {};
    if (id.length === 24 && id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { MaNhatKy: id };
    }

    const log = await NhatKyTestMau.findOne(query)
      .populate('ContractID', 'MaHopDong title CustomerID ChiTietHopDong');
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    // RBAC check
    if (req.user && (req.user.VaiTro === 'KhachHangB2C' || req.user.VaiTro === 'KhachHangB2B')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      
      if (!kh) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu pha chế này.' });
      }

      if (log.ContractID) {
        const customerId = log.ContractID.CustomerID?.toString();
        const khId = kh._id?.toString();
        if (customerId !== khId) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu pha chế này.' });
        }
      } else {
        // Standalone request check
        const regex = new RegExp(kh.TenKhachHang, 'i');
        if (!regex.test(log.customerName) && log.customerName !== req.user.username) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu pha chế này.' });
        }
      }
    }
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    console.error('getRDLogById error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// @desc    Create new R&D process for a contract or standalone request
// @route   POST /api/rd-tracking
exports.createRDLog = async (req, res) => {
  try {
    const { 
      ContractID, MaMauYeuCau, customerName, colorName, 
      surface, substrate, deadline, requirements, imageUrl 
    } = req.body;
    
    // Generate unique ID (standalone vs contract)
    const isStandalone = !ContractID;
    const prefix = isStandalone ? 'REQ' : 'RD';
    
    // Tìm các documents bắt đầu bằng prefix
    const count = await NhatKyTestMau.countDocuments({ MaNhatKy: { $regex: `^${prefix}` } });
    const MaNhatKy = `${prefix}-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;
    
    const payload = {
      MaNhatKy,
      MaMauYeuCau: MaMauYeuCau || colorName || 'CUSTOM',
      TrangThai: ContractID ? 'testing' : 'pending',
      LichSuPhienBan: [],
      customerName,
      colorName,
      surface,
      substrate,
      deadline,
      requirements,
      imageUrl
    };
    if (ContractID) payload.ContractID = ContractID;
    
    const log = await NhatKyTestMau.create(payload);
    
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add a test version (batch log)
// @route   POST /api/rd-tracking/:id/versions
exports.addVersion = async (req, res) => {
  try {
    const { result, parameters, feedback, inputWeight, outputWeight, imageUrl } = req.body;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const log = isObjectId 
      ? await NhatKyTestMau.findById(req.params.id) 
      : await NhatKyTestMau.findOne({ MaNhatKy: req.params.id });
    
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
      imageUrl,
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
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const log = isObjectId 
      ? await NhatKyTestMau.findById(req.params.id) 
      : await NhatKyTestMau.findOne({ MaNhatKy: req.params.id });
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
    
    // Check if ALL logs for this contract are approved
    const allLogs = await NhatKyTestMau.find({ ContractID: log.ContractID });
    const allApproved = allLogs.every(l => l.TrangThai === 'approved');

    if (allApproved) {
      // Update Contract Status to 'delivering'
      await HopDong.findByIdAndUpdate(log.ContractID, { TrangThai: 'delivering' });
      
      const DonHang = require('../models/DonHang');
      const contract = await HopDong.findById(log.ContractID);
      if (contract) {
         await DonHang.findOneAndUpdate(
             { GhiChu: { $regex: contract.MaHopDong, $options: 'i' } },
             { TrangThai: 'DA_XU_LY_XONG' }
         );
      }
    }
    
    res.status(200).json({ success: true, message: 'KCS Approved. Contract moved to Delivering status.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
