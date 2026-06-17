const PhieuDongGoi = require('../models/PhieuDongGoi');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const HopDong = require('../models/HopDong');
const SanPhamSon = require('../models/SanPhamSon');
const NguyenVatLieu = require('../models/NguyenVatLieu');
const CongThuc = require('../models/CongThuc');
const NhanVien = require('../models/NhanVien');
const DonHang = require('../models/DonHang');
const PhieuNhapXuatKho = require('../models/PhieuNhapXuatKho');

// @desc    Get all packaging slips
// @route   GET /api/packaging
exports.getPackagingSlips = async (req, res) => {
  try {
    const slips = await PhieuDongGoi.find()
      .populate('RDLogID', 'MaNhatKy MaMauYeuCau')
      .populate('ContractID', 'MaHopDong title')
      .populate('OrderID', 'MaDonHang')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: slips.length, data: slips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get approved R&D logs ready for packaging
// @route   GET /api/packaging/pending-rd
exports.getPendingRDLogs = async (req, res) => {
  try {
    // Approved R&D logs
    const approvedLogs = await NhatKyTestMau.find({ TrangThai: 'approved' })
      .populate('ContractID', 'MaHopDong title ChiTietHopDong');
    
    // Alreading packaged logs
    const packagedLogIDs = await PhieuDongGoi.find().distinct('RDLogID');
    
    // Filter out alreading packaged
    const pending = approvedLogs.filter(log => !packagedLogIDs.includes(log._id.toString()));
    
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new packaging slip and update inventory
// @route   POST /api/packaging
exports.createPackagingSlip = async (req, res) => {
  try {
    const { RDLogID, ContractID, OrderID, PackagingSpecs, PackagingMaterial, Notes } = req.body;
    
    // 1. Validate RD Log
    const rdLog = await NhatKyTestMau.findById(RDLogID);
    if (!rdLog || !['approved', 'complete', 'completed'].includes(rdLog.TrangThai)) {
      return res.status(400).json({ success: false, message: 'Log R&D chưa được KCS phê duyệt hoặc không tồn tại.' });
    }

    // 2. Generate unique ID
    const count = await PhieuDongGoi.countDocuments();
    const MaPhieuDongGoi = `PDG-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(2, '0')}`;

    // 3. Calculate total net weight
    const totalWeight = PackagingSpecs.reduce((acc, spec) => acc + spec.totalWeight, 0);

    // 4. Record Employee
    let employeeName = 'System';
    if (req.user) {
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) employeeName = nv.HoTen;
    }

    // 5. Create the Slip
    const slip = await PhieuDongGoi.create({
      MaPhieuDongGoi,
      RDLogID,
      ContractID,
      OrderID,
      PackagingSpecs,
      PackagingMaterial,
      NetWeightTotal: totalWeight,
      CreatedBy: employeeName,
      Notes,
      TrangThai: 'packed'
    });

    // 6. INVENTORY & VOUCHER LOGIC
    // A. Deduct Raw Materials based on Formula
    const formula = await CongThuc.findOne({ MaMau: rdLog.MaMauYeuCau, TrangThai: 'Active' });
    if (formula && formula.ThanhPhan) {
      const voucherDetails = [];
      
      for (const item of formula.ThanhPhan) {
        const amountToDeduct = (item.TiLe / 100) * totalWeight;
        const nvl = await NguyenVatLieu.findByIdAndUpdate(item.NguyenVatLieu, {
          $inc: { TonKho: -amountToDeduct }
        }, { new: true });
        
        if (nvl) {
          voucherDetails.push({
            MaItem: nvl.MaNVL,
            TenItem: nvl.TenNguyenVatLieu,
            SoLuong: amountToDeduct,
            ItemId: nvl._id
          });
        }
      }

      // Create Warehouse Exit Voucher (PhieuXuatKho) for Audit
      if (voucherDetails.length > 0) {
        const vCount = await PhieuNhapXuatKho.countDocuments();
        await PhieuNhapXuatKho.create({
          MaPhieu: `XK-${new Date().getTime()}-${vCount + 1}`,
          LoaiPhieu: 'XUAT',
          LoaiHang: 'NGUYEN_VAT_LIEU',
          ChiTiet: voucherDetails,
          MoTa: `Khấu trừ nguyên liệu cho phiếu đóng gói ${MaPhieuDongGoi}`,
          MaNhanVienPhuTrach: employeeName
        });
      }
    }

    // B. Add Finished Product Inventory
    let product = null;
    if (rdLog.MaMauYeuCau) {
       product = await SanPhamSon.findOneAndUpdate(
         { "DanhSachMaMau.MaMau": rdLog.MaMauYeuCau },
         { $inc: { TonKho: totalWeight } },
         { new: true }
       );

       // Create Warehouse Entry Voucher (PhieuNhap) for Finished Goods
       if (product) {
         const vCount = await PhieuNhapXuatKho.countDocuments();
         await PhieuNhapXuatKho.create({
           MaPhieu: `NK-${new Date().getTime()}-${vCount + 1}`,
           LoaiPhieu: 'NHAP',
           LoaiHang: 'SAN_PHAM',
           ChiTiet: [{
             MaItem: product.MaSanPham,
             TenItem: `${product.TenDongSon} (${rdLog.MaMauYeuCau})`,
             SoLuong: totalWeight, // Thùng
             ItemId: product._id
           }],
           MoTa: `Nhập kho thành phẩm từ phiếu đóng gói ${MaPhieuDongGoi}`,
           MaNhanVienPhuTrach: employeeName
         });
       }
    }

    // 7. Update Statuses
    if (ContractID && !OrderID) {
      await HopDong.findByIdAndUpdate(ContractID, { TrangThai: 'signed' }); 
      
      // Auto-generate Order (DonHang) for Delivery Management
      const hopDong = await HopDong.findById(ContractID).populate('CustomerID');
      if (hopDong && product) {
        const orderItems = PackagingSpecs.filter(s => s.quantity > 0).map(s => ({
          SanPham: product._id,
          TenSanPham: `${product.TenDongSon} (${s.containerType})`,
          MaMau: rdLog.MaMauYeuCau,
          SoLuong: s.quantity,
          DonGia: 0, 
          ThanhTien: 0
        }));

        const newOrder = await DonHang.create({
          MaDonHang: `#HD${Math.floor(100000 + Math.random() * 900000)}`,
          KhachHang: hopDong.CustomerID._id,
          NhanVienPhuTrach: hopDong.EmployeeID,
          Items: orderItems,
          TongTien: hopDong.TongGiaTri || 0,
          TrangThai: 'DA_XU_LY_XONG',
          PhuongThucThanhToan: 'CHUYEN_KHOAN',
          DiaChiGiaoHang: hopDong.partyBAddress || hopDong.CustomerID.DiaChi || 'Địa chỉ công trình',
          TenNguoiNhan: hopDong.partyBRepresentative || hopDong.CustomerID.TenKhachHang || 'Đại diện',
          SDTNguoiNhan: hopDong.CustomerID.SDT || 'Chưa cập nhật',
          GhiChu: `Đơn xuất từ Hợp đồng ${hopDong.MaHopDong} - Phiếu đóng gói ${MaPhieuDongGoi}`
        });

        // Link slip to new order
        slip.OrderID = newOrder._id;
        await slip.save();
      }
    } else if (ContractID) {
      await HopDong.findByIdAndUpdate(ContractID, { TrangThai: 'signed' }); 
    }
    
    if (OrderID) {
      await DonHang.findByIdAndUpdate(OrderID, { TrangThai: 'DA_XU_LY_XONG' });
    }

    res.status(201).json({ success: true, data: slip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single slip by ID
// @route   GET /api/packaging/:id
exports.getPackagingSlipById = async (req, res) => {
  try {
    const slip = await PhieuDongGoi.findById(req.params.id)
      .populate('RDLogID')
      .populate('ContractID');
    
    if (!slip) {
      return res.status(404).json({ success: false, message: 'Packing slip not found' });
    }
    
    res.status(200).json({ success: true, data: slip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
