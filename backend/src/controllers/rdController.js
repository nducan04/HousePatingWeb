const NhatKyTestMau = require('../models/NhatKyTestMau');
const RDTracking = require('../models/RdTracking');
const HopDong = require('../models/HopDong');
const NhanVien = require('../models/NhanVien');
const NguyenVatLieu = require('../models/NguyenVatLieu');

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
          query.customerName = { $regex: new RegExp(kh.TenKhachHang, 'i') };
        } else {
          const contracts = await HopDong.find({ CustomerID: kh._id });
          const contractIds = contracts.map(c => c._id);
          query.ContractID = { $in: contractIds };
        }
      } else {
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

    const trackings = await RDTracking.find(query)
      .populate('ContractID', 'MaHopDong title')
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch associated NhatKyTestMau for LichSuPhienBan
    for (let t of trackings) {
      const testMau = await NhatKyTestMau.findOne({ RDTrackingID: t._id }).lean();
      t.LichSuPhienBan = testMau ? testMau.LichSuPhienBan : [];
      t.signedBy = testMau ? testMau.signedBy : null;
      t.signedAt = testMau ? testMau.signedAt : null;
    }

    res.status(200).json({ success: true, count: trackings.length, data: trackings });
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

    const log = await RDTracking.findOne(query)
      .populate('ContractID', 'MaHopDong title CustomerID ChiTietHopDong')
      .lean();
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    const testMau = await NhatKyTestMau.findOne({ RDTrackingID: log._id }).lean();
    log.LichSuPhienBan = testMau ? testMau.LichSuPhienBan : [];
    log.signedBy = testMau ? testMau.signedBy : null;
    log.signedAt = testMau ? testMau.signedAt : null;
    log.testMauId = testMau ? testMau._id : null;

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
      surface, substrate, deadline, requirements, imageUrl,
      environmentType
    } = req.body;
    
    const isStandalone = !ContractID;
    const prefix = isStandalone ? 'REQ' : 'RD';
    
    const count = await RDTracking.countDocuments({ MaNhatKy: { $regex: `^${prefix}` } });
    const MaNhatKy = `${prefix}-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;
    
    const payload = {
      MaNhatKy,
      MaMauYeuCau: MaMauYeuCau || colorName || 'CUSTOM',
      TrangThai: ContractID ? 'testing' : 'pending',
      customerName,
      colorName,
      surface,
      substrate,
      deadline,
      requirements,
      imageUrl,
      environmentType
    };
    if (ContractID) payload.ContractID = ContractID;
    
    const log = await RDTracking.create(payload);
    
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add a test version (batch log)
// @route   POST /api/rd-tracking/:id/versions
exports.addVersion = async (req, res) => {
  try {
    const { result, parameters, feedback, inputWeight, outputWeight, imageUrl, nhietDo, curingTime, maxHumidity, deltaE, hieuSuat, components } = req.body;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    
    const rdTracking = isObjectId 
      ? await RDTracking.findById(req.params.id) 
      : await RDTracking.findOne({ MaNhatKy: req.params.id });
    
    if (!rdTracking) {
      return res.status(404).json({ success: false, message: 'RD Tracking Request not found' });
    }

    let testMau = await NhatKyTestMau.findOne({ RDTrackingID: rdTracking._id });
    if (!testMau) {
      const count = await NhatKyTestMau.countDocuments();
      testMau = await NhatKyTestMau.create({
        MaNhatKy: `TEST-${Date.now()}-${count}`,
        RDTrackingID: rdTracking._id,
        MaMauYeuCau: rdTracking.MaMauYeuCau,
        ContractID: rdTracking.ContractID,
        TrangThai: 'testing',
        LichSuPhienBan: []
      });
    }

    // Validate all stock levels first
    if (components && Array.isArray(components)) {
      // Group quantities by materialId
      const grouped = {};
      for (const comp of components) {
        if (!comp.materialId) continue;
        const qty = parseFloat(comp.quantity) || 0;
        if (qty <= 0) continue;
        grouped[comp.materialId] = (grouped[comp.materialId] || 0) + qty;
      }

      const materialsToUpdate = [];
      for (const [materialId, qty] of Object.entries(grouped)) {
        const isObjId = /^[0-9a-fA-F]{24}$/.test(materialId);
        const material = isObjId 
          ? await NguyenVatLieu.findById(materialId)
          : await NguyenVatLieu.findOne({ MaNVL: materialId });
        if (!material) {
          return res.status(404).json({ success: false, message: `Nguyên vật liệu ${materialId} không tồn tại trong hệ thống.` });
        }
        if (material.TonKho < qty) {
          return res.status(400).json({ success: false, message: `Nguyên vật liệu "${material.TenNguyenVatLieu}" không đủ tồn kho (Còn: ${material.TonKho} ${material.DonViTinh}, yêu cầu: ${qty}).` });
        }
        materialsToUpdate.push({ material, qty });
      }

      // Perform deduction after all validations pass
      for (const item of materialsToUpdate) {
        item.material.TonKho = Math.max(0, item.material.TonKho - item.qty);
        await item.material.save();
      }
    }
    
    // Auto-versioning
    const nextVer = `V${testMau.LichSuPhienBan.length + 1}.0`;
    
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

    testMau.LichSuPhienBan.push({
      version: nextVer,
      date: new Date(),
      result,
      parameters,
      feedback,
      inputWeight: parseFloat(inputWeight) || 0,
      outputWeight: parseFloat(outputWeight) || 0,
      imageUrl,
      nhietDo: parseFloat(nhietDo) || 195,
      curingTime: parseFloat(curingTime) || 15,
      maxHumidity: parseFloat(maxHumidity) || 80,
      deltaE: parseFloat(deltaE) || 0,
      hieuSuat: parseFloat(hieuSuat) || 98,
      components: components || [],
      tester: testerName,
      testerCode: testerCode
    });
    
    await testMau.save();

    // Update RD Tracking status if needed
    if (rdTracking.TrangThai === 'pending') {
      rdTracking.TrangThai = 'testing';
      await rdTracking.save();
    }

    const rdData = rdTracking.toObject();
    rdData.LichSuPhienBan = testMau.LichSuPhienBan;

    res.status(200).json({ success: true, data: rdData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    KCS Signature - Approve test sample and update contract status
// @route   PATCH /api/rd-tracking/:id/sign-kcs
exports.signKCS = async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const rdTracking = isObjectId 
      ? await RDTracking.findById(req.params.id) 
      : await RDTracking.findOne({ MaNhatKy: req.params.id });
      
    if (!rdTracking) {
      return res.status(404).json({ success: false, message: 'RD Tracking not found' });
    }

    const log = await NhatKyTestMau.findOne({ RDTrackingID: rdTracking._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'NhatKyTestMau not found for this request' });
    }
    
    const hasPass = log.LichSuPhienBan.some(v => v.result === 'pass');
    if (!hasPass) {
      return res.status(400).json({ success: false, message: 'Cannot sign off without at least one PASSED version.' });
    }
    
    let reviewerName = 'Admin';
    if (req.user) {
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) reviewerName = nv.HoTen;
    }
    
    log.TrangThai = 'approved';
    log.signedBy = reviewerName;
    log.signedAt = new Date();
    await log.save();

    rdTracking.TrangThai = 'approved';
    await rdTracking.save();
    
    if (log.ContractID) {
      const allLogs = await NhatKyTestMau.find({ ContractID: log.ContractID });
      const allApproved = allLogs.every(l => l.TrangThai === 'approved');

      if (allApproved) {
        await HopDong.findByIdAndUpdate(log.ContractID, { TrangThai: 'delivering' });
        
        const DonHang = require('../models/DonHang');
        const contract = await HopDong.findById(log.ContractID);
        if (contract) {
           await DonHang.findOneAndUpdate(
               { GhiChu: { $regex: contract.MaHopDong, $options: 'i' } },
               { TrangThai: 'DANG_XU_LY' }
           );
        }
      }
    }
    
    res.status(200).json({ success: true, message: 'KCS Approved. Contract moved to Delivering status.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add customer feedback to a test version
// @route   PATCH /api/rd-tracking/:id/versions/:version/feedback
exports.addCustomerFeedback = async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    
    const rdTracking = isObjectId 
      ? await RDTracking.findById(req.params.id) 
      : await RDTracking.findOne({ MaNhatKy: req.params.id });
      
    if (!rdTracking) {
      return res.status(404).json({ success: false, message: 'RD Tracking Request not found' });
    }

    const testMau = await NhatKyTestMau.findOne({ RDTrackingID: rdTracking._id });
    if (!testMau) {
      return res.status(404).json({ success: false, message: 'Test log not found' });
    }

    const versionIndex = testMau.LichSuPhienBan.findIndex(v => v.version === req.params.version);
    if (versionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    testMau.LichSuPhienBan[versionIndex].customerFeedback = feedback;
    testMau.LichSuPhienBan[versionIndex].customerRating = rating;
    testMau.LichSuPhienBan[versionIndex].customerFeedbackDate = new Date();
    
    await testMau.save();

    const rdData = rdTracking.toObject();
    rdData.LichSuPhienBan = testMau.LichSuPhienBan;

    res.status(200).json({ success: true, data: rdData, message: 'Cảm ơn bạn đã gửi phản hồi!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
