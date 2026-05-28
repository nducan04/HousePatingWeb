const HopDong = require('../models/HopDong');
const { getContractStatus, createContractOnChain } = require('../utils/blockchain');
const { uploadToIPFS } = require('../utils/ipfs');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function autoCreateDownstreamData(contract) {
  try {
    const DonHang = require('../models/DonHang');
    const VanChuyen = require('../models/VanChuyen');
    const NhanVien = require('../models/NhanVien');
    const SanPhamSon = require('../models/SanPhamSon');
    const NhatKyTestMau = require('../models/NhatKyTestMau');
    
    // Check if DonHang already exists to avoid duplicates by checking GhiChu for the contract ID
    let order = await DonHang.findOne({ GhiChu: { $regex: contract.MaHopDong, $options: 'i' } });
    
    if (!order) {
      const sampleSP = await SanPhamSon.findOne();
      const defaultSpId = sampleSP ? sampleSP._id : null;
      
      const sampleNV = await NhanVien.findOne();
      const defaultNvId = contract.EmployeeID || (sampleNV ? sampleNV._id : null);

      const subtotalForTaxCalculation = contract.ChiTietHopDong.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      const randomHDCode = `HD${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-2)}`;
      order = await DonHang.create({
        MaDonHang: randomHDCode,
        KhachHang: contract.CustomerID,
        NhanVienPhuTrach: defaultNvId,
        Items: contract.ChiTietHopDong.map(item => ({
          SanPham: defaultSpId, 
          TenSanPham: item.productName,
          MaMau: item.colorCode,
          SoLuong: item.quantity,
          DonGia: item.unitPrice,
          ThanhTien: item.quantity * item.unitPrice
        })),
        TienThue: contract.TongGiaTri > subtotalForTaxCalculation ? contract.TongGiaTri - subtotalForTaxCalculation : 0,
        TongTien: contract.TongGiaTri,
        TrangThai: contract.TrangThai === 'signed' ? 'DANG_XU_LY' : 'CHO_XAC_NHAN',
        PhuongThucThanhToan: 'CHUYEN_KHOAN',
        TrangThaiThanhToan: 'CHUA_THANH_TOAN',
        DiaChiGiaoHang: contract.partyBAddress || 'Kho khách hàng',
        GhiChu: `Người nhận: ${contract.partyBRepresentative || 'Khách hàng'} - SĐT: ${contract.partyBPhoneNumber || '0987654321'}. Đơn hàng tự động từ Hợp đồng R&D ${contract.MaHopDong}`
      });
    }

    if (contract.TrangThai === 'signed') {
      if (order.TrangThai === 'CHO_XAC_NHAN') {
        order.TrangThai = 'DANG_XU_LY';
        await order.save();
      }

      const existingVC = await VanChuyen.findOne({ DonHang: order._id });
      if (!existingVC) {
        await VanChuyen.create({
          MaVanChuyen: `VC-${order.MaDonHang}`,
          DonHang: order._id,
          LoHang: {
            SoKien: 1,
            KhoiLuong: contract.ChiTietHopDong.reduce((sum, i) => sum + i.quantity, 0),
            MauSon: contract.ChiTietHopDong[0]?.colorCode || 'Mixed'
          },
          VanChuyenInfo: {
            DonVi: 'VTSC Logistics',
            NhanVien: order.NhanVienPhuTrach
          },
          LoTrinh: [{
            ThoiGian: new Date(),
            NoiDung: 'Tiếp nhận đơn hàng R&D từ Hợp đồng',
            Status: 'COMPLETE',
            Icon: 'Package'
          }],
          TrangThaiTongQuat: 'Chờ sản xuất R&D'
        });
      }

      const existingRD = await NhatKyTestMau.findOne({ ContractID: contract._id });
      if (!existingRD) {
        for (let i = 0; i < contract.ChiTietHopDong.length; i++) {
          const item = contract.ChiTietHopDong[i];
          const count = await NhatKyTestMau.countDocuments();
          const MaNhatKy = `RD-${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + i + 1).padStart(2, '0')}`;
          await NhatKyTestMau.create({
            MaNhatKy,
            ContractID: contract._id,
            MaMauYeuCau: item.colorCode || 'CustomColor',
            TrangThai: 'testing',
            LichSuPhienBan: []
          });
        }
      }
    }
  } catch (error) {
    console.error('Error auto-creating downstream data:', error);
  }
}

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private (Admin, NhanVien, KhachHangB2B)
exports.getContracts = async (req, res) => {
  try {
    let filter = {};
    if (req.query.customer) {
      filter.CustomerID = req.query.customer;
    }

    // RBAC: Khách hàng chỉ thấy hợp đồng của mình
    if (req.user && (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (kh) filter.CustomerID = kh._id;
      else return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const contracts = await HopDong.find(filter)
      .populate('CustomerID', 'MaKH TenKhachHang PhanLoai')
      .populate('EmployeeID', 'MaNV HoTen ChucVu')
      .sort({ createdAt: -1 });

    // Map to API-compatible format for frontend
    const data = contracts.map(c => ({
      _id: c._id,
      contractId: c.MaHopDong,
      title: c.title,
      customer: c.CustomerID ? {
        _id: c.CustomerID._id,
        name: c.CustomerID.TenKhachHang,
        code: c.CustomerID.MaKH,
        segment: c.CustomerID.PhanLoai
      } : null,
      employee: c.EmployeeID ? {
        _id: c.EmployeeID._id,
        name: c.EmployeeID.HoTen,
        code: c.EmployeeID.MaNV,
      } : null,
      value: c.TongGiaTri,
      daThanhToan: c.DaThanhToan || 0,
      smartContractAddress: c.SmartContractAddress,
      documentHash: c.DocumentHash,
      ipfsCid: c.IPFSCID,
      txHash: c.TransactionHash,
      status: c.TrangThai,
      vtscAddress: c.vtscAddress,
      clientAddress: c.clientAddress,
      partyBAddress: c.partyBAddress,
      partyBTaxCode: c.partyBTaxCode,
      partyBBankAccount: c.partyBBankAccount,
      partyBBankName: c.partyBBankName,
      partyBRepresentative: c.partyBRepresentative,
      partyBPosition: c.partyBPosition,
      articles: c.articles,
      slaDeadline: c.slaDeadline,
      terms: c.terms,
      chiTietHopDong: c.ChiTietHopDong,
      vtscSignature: c.vtscSignature,
      clientSignature: c.clientSignature,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getContracts error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single contract by ID
// @route   GET /api/contracts/:id
// @access  Private
exports.getContractById = async (req, res) => {
  try {
    const contract = await HopDong.findById(req.params.id)
      .populate('CustomerID', 'MaKH TenKhachHang PhanLoai SDT Email DiaChi')
      .populate('EmployeeID', 'MaNV HoTen ChucVu');

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    // RBAC: Khách hàng chỉ xem hợp đồng của mình
    if (req.user && (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C')) {
      const KhachHang = require('../models/KhachHang');
      const kh = await KhachHang.findOne({ AccountID: req.user._id });
      if (!kh || String(contract.CustomerID?._id) !== String(kh._id)) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xem hợp đồng này' });
      }
    }

    const data = {
      _id: contract._id,
      contractId: contract.MaHopDong,
      title: contract.title,
      customer: contract.CustomerID ? {
        _id: contract.CustomerID._id,
        name: contract.CustomerID.TenKhachHang,
        code: contract.CustomerID.MaKH,
        segment: contract.CustomerID.PhanLoai
      } : null,
      employee: contract.EmployeeID ? {
        _id: contract.EmployeeID._id,
        name: contract.EmployeeID.HoTen,
        code: contract.EmployeeID.MaNV,
      } : null,
      value: contract.TongGiaTri,
      daThanhToan: contract.DaThanhToan || 0,
      smartContractAddress: contract.SmartContractAddress,
      documentHash: contract.DocumentHash,
      ipfsCid: contract.IPFSCID,
      txHash: contract.TransactionHash,
      status: contract.TrangThai,
      vtscAddress: contract.vtscAddress,
      clientAddress: contract.clientAddress,
      partyBAddress: contract.partyBAddress,
      partyBTaxCode: contract.partyBTaxCode,
      partyBBankAccount: contract.partyBBankAccount,
      partyBBankName: contract.partyBBankName,
      partyBRepresentative: contract.partyBRepresentative,
      partyBPosition: contract.partyBPosition,
      articles: contract.articles,
      slaDeadline: contract.slaDeadline,
      terms: contract.terms,
      chiTietHopDong: contract.ChiTietHopDong,
      vtscSignature: contract.vtscSignature,
      clientSignature: contract.clientSignature,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getContractById error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new contract
// @route   POST /api/contracts
// @access  Private (Admin, NhanVien)
exports.createContract = async (req, res) => {
  try {
    const { 
      contractId, title, customer, clientAddress,
      chiTietHopDong, slaDeadline, terms,
      partyBAddress, partyBTaxCode, partyBBankAccount, partyBBankName,
      partyBRepresentative, partyBPosition, articles
    } = req.body;

    // Validate Ethereum address format (Optional)
    const trimmedClientAddress = typeof clientAddress === 'string' ? clientAddress.trim() : '';
    if (trimmedClientAddress && !/^0x[a-fA-F0-9]{40}$/.test(trimmedClientAddress)) {
      return res.status(400).json({ success: false, error: 'Địa chỉ ví MetaMask không hợp lệ (phải bắt đầu bằng 0x và có 42 ký tự)' });
    }

    // Parse chiTietHopDong nếu gửi dưới dạng JSON string
    let details = chiTietHopDong;
    if (typeof chiTietHopDong === 'string') {
      details = JSON.parse(chiTietHopDong);
    }

    // Auto-tính tổng giá trị từ chi tiết (có thêm thuế 8% nếu >= 5,000,000đ)
    const subtotal = Array.isArray(details)
      ? details.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      : 0;
    const value = subtotal >= 5000000 ? subtotal * 1.08 : subtotal;

    // Parse terms nếu cần
    let parsedTerms = terms;
    if (typeof terms === 'string') {
      parsedTerms = JSON.parse(terms);
    }

    // Tìm NhanVien hoặc KhachHang từ JWT user
    let employeeId = undefined;
    let actualCustomerId = customer;
    
    if (req.user) {
      const NhanVien = require('../models/NhanVien');
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) {
        employeeId = nv._id;
      } else {
        // Nếu không phải nhân viên, có thể là khách hàng tự tạo
        const KhachHang = require('../models/KhachHang');
        const kh = await KhachHang.findOne({ AccountID: req.user._id });
        if (kh) actualCustomerId = kh._id;
      }
    }

    const contractData = {
      MaHopDong: contractId,
      title,
      CustomerID: actualCustomerId,
      EmployeeID: employeeId,
      TongGiaTri: value,
      vtscAddress: process.env.VTSC_WALLET || '0x0000000000000000000000000000000000000000',
      clientAddress: trimmedClientAddress || '',
      slaDeadline: slaDeadline ? new Date(slaDeadline) : undefined,
      terms: parsedTerms || {},
      ChiTietHopDong: details || [],
      TrangThai: 'draft',
      SmartContractAddress: process.env.CONTRACT_ADDRESS || '',
      partyBAddress,
      partyBTaxCode,
      partyBBankAccount,
      partyBBankName,
      partyBRepresentative,
      partyBPosition,
      articles: articles || {}
    };

    const contract = await HopDong.create(contractData);
    
    // Auto-create order as CHO_XAC_NHAN
    await autoCreateDownstreamData(contract);

    // Return API-compatible format
    res.status(201).json({
      success: true,
      data: {
        _id: contract._id,
        contractId: contract.MaHopDong,
        title: contract.title,
        value: contract.TongGiaTri,
        status: contract.TrangThai,
        chiTietHopDong: contract.ChiTietHopDong,
        vtscAddress: contract.vtscAddress,
        clientAddress: contract.clientAddress,
        smartContractAddress: contract.SmartContractAddress,
        documentHash: contract.DocumentHash,
        ipfsCid: contract.IPFSCID,
        txHash: contract.TransactionHash,
        terms: contract.terms,
        slaDeadline: contract.slaDeadline,
        createdAt: contract.createdAt,
      }
    });
  } catch (error) {
    console.error('createContract error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã hợp đồng đã tồn tại' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Generate PDF preview, compute hash, upload to IPFS
// @route   POST /api/contracts/:id/preview
// @access  Private (Admin, NhanVien)
exports.generatePreviewPDF = async (req, res) => {
  try {
    const contract = await HopDong.findById(req.params.id)
      .populate('CustomerID', 'MaKH TenKhachHang PhanLoai')
      .populate('EmployeeID', 'MaNV HoTen ChucVu');

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    // === 1. Sinh PDF bằng PDFKit (server-side deterministic) ===
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const pdfPath = path.join(uploadsDir, `contract_${contract.MaHopDong}.pdf`);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Register Vietnamese-compatible font (Roboto supports full Unicode)
      const fontPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
      const fontBoldPath = path.join(__dirname, '../../fonts/Roboto-Bold.ttf');
      const hasCustomFont = fs.existsSync(fontPath);

      if (hasCustomFont) {
        doc.registerFont('VNFont', fontPath);
        doc.registerFont('VNFontBold', fontBoldPath);
      }
      const font = hasCustomFont ? 'VNFont' : 'Helvetica';
      const fontBold = hasCustomFont ? 'VNFontBold' : 'Helvetica-Bold';

      const customerName = contract.CustomerID?.TenKhachHang || 'N/A';
      const customerCode = contract.CustomerID?.MaKH || 'N/A';

      // ========== HEADER ==========
      doc.font(fontBold).fontSize(13).fillColor('#333333')
        .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.font(fontBold).fontSize(13)
        .text('Độc lập — Tự do — Hạnh phúc', { align: 'center' });
      doc.moveDown(0.3);
      doc.font(font).fontSize(11)
        .text('--- o0o ---', { align: 'center' });
      doc.moveDown(1.5);

      // ========== TITLE ==========
      doc.font(fontBold).fontSize(20).fillColor('#003399')
        .text('HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN', { align: 'center' });
      doc.moveDown(0.3);
      doc.font(font).fontSize(11).fillColor('#666666')
        .text(`Mã số (Smart Contract ID): ${contract.MaHopDong}`, { align: 'center' });
      doc.moveDown(1.5);

      // ========== NGÀY THÁNG ==========
      const createdAt = new Date(contract.createdAt || Date.now());
      doc.font(font).fontSize(11).fillColor('#000000')
        .text(`Hôm nay, ngày ${createdAt.getDate()} tháng ${createdAt.getMonth() + 1} năm ${createdAt.getFullYear()}, chúng tôi gồm có:`);
      doc.moveDown(1);

      // ========== BÊN A (VTSC) ==========
      doc.font(fontBold).fontSize(15).fillColor('#003399').text('BÊN BÁN / BÊN CUNG CẤP (BÊN A)');
      doc.moveTo(doc.x, doc.y - 2).lineTo(doc.x + 250, doc.y - 2).strokeColor('#003399').lineWidth(1).stroke();
      doc.moveDown(0.5);

      doc.font(font).fontSize(11).fillColor('#000000');
      doc.text('Tên tổ chức: ', { continued: true }).font(fontBold).text('CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)');
      doc.font(font).text('Địa chỉ: ', { continued: true }).font(fontBold).text('Số 215 phố Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng');
      doc.font(font).text('Mã số thuế: ', { continued: true }).font(fontBold).text('0201137068');
      doc.font(font).text('Người đại diện: ', { continued: true }).font(fontBold).text('Ông Phí Bình Minh ', { continued: true }).font(font).text('— ', { continued: true }).font(fontBold).text('Chức vụ: ', { continued: true }).font(font).text('Trưởng phòng kinh doanh sơn');
      doc.font(font).fontSize(10).fillColor('#444444').text('Ví Blockchain xác thực: ', { continued: true }).font(fontBold).text(contract.vtscAddress || '0x0201020304050607080910111213141516171819');
      doc.moveDown(1.2);

      // ========== BÊN B (Khách hàng) ==========
      const repName = contract.partyBRepresentative || customerName;
      doc.font(fontBold).fontSize(15).fillColor('#003399').text('BÊN MUA (BÊN B)');
      doc.moveTo(doc.x, doc.y - 2).lineTo(doc.x + 130, doc.y - 2).strokeColor('#003399').lineWidth(1).stroke();
      doc.moveDown(0.5);

      doc.font(font).fontSize(11).fillColor('#000000');
      doc.text('Tên khách hàng: ', { continued: true }).font(fontBold).text(repName || '...................................................');
      doc.font(font).text('Địa chỉ: ', { continued: true }).font(fontBold).text(contract.partyBAddress || '......................................................................................');
      doc.font(font).text('Mã số thuế: ', { continued: true }).font(fontBold).text(contract.CustomerID?.MaKH || '................................');
      doc.font(font).text('Điện thoại: ', { continued: true }).font(fontBold).text(contract.partyBPhoneNumber || '................................');
      doc.font(font).text('Người đại diện: ', { continued: true }).font(fontBold).text(repName || '................................', { continued: true }).font(font).text(' — ', { continued: true }).font(fontBold).text('Chức vụ: ', { continued: true }).font(font).text(contract.partyBPosition || '................................');
      if (contract.partyBBankAccount || contract.partyBBankName) {
        doc.font(font).text('Tài khoản: ', { continued: true }).font(fontBold).text(contract.partyBBankAccount || '................', { continued: true }).font(font).text(' tại ', { continued: true }).font(fontBold).text(contract.partyBBankName || '................');
      }
      doc.moveDown(1.2);

      doc.font(fontBold).fontSize(11).fillColor('#000000').text('Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên dưới:');
      doc.moveDown(1);

      // ========== ĐIỀU 1: Hàng hóa và Giá cả ==========
      doc.font(fontBold).fontSize(12).fillColor('#003399').text('Điều 1: Hàng hóa và Giá cả');
      doc.moveDown(0.3);
      doc.font(font).fontSize(11).fillColor('#000000');
      if (contract.articles && contract.articles.article1) {
        doc.text(contract.articles.article1);
        doc.moveDown(0.8);
      }

      if (contract.ChiTietHopDong && contract.ChiTietHopDong.length > 0) {
        // Table parameters
        const tableTop = doc.y;
        const col1 = 50, col2 = 180, col3 = 260, col4 = 340, col5 = 440;
        const rowHeight = 25;

        // Draw Table Header Background
        doc.rect(50, tableTop, 495, rowHeight).fill('#f8faff');

        doc.font(fontBold).fontSize(10).fillColor('#000000');
        doc.text('Sản phẩm / Dòng sơn', col1 + 5, tableTop + 7);
        doc.text('Mã màu', col2 + 5, tableTop + 7);
        doc.text('Số lượng', col3 + 5, tableTop + 7);
        doc.text('Đơn giá', col4 + 5, tableTop + 7);
        doc.text('Thành tiền', col5 + 5, tableTop + 7);

        // Draw Table Header Borders
        doc.rect(50, tableTop, 495, rowHeight).strokeColor('#003399').lineWidth(1.5).stroke();
        doc.lineWidth(1);
        doc.moveTo(col2, tableTop).lineTo(col2, tableTop + rowHeight).strokeColor('#003399').stroke();
        doc.moveTo(col3, tableTop).lineTo(col3, tableTop + rowHeight).strokeColor('#003399').stroke();
        doc.moveTo(col4, tableTop).lineTo(col4, tableTop + rowHeight).strokeColor('#003399').stroke();
        doc.moveTo(col5, tableTop).lineTo(col5, tableTop + rowHeight).strokeColor('#003399').stroke();

        let y = tableTop + rowHeight;
        
        contract.ChiTietHopDong.forEach((item) => {
          const lineTotal = item.quantity * item.unitPrice;
          const nameHeight = doc.heightOfString(item.productName || '', { width: 120 });
          const itemHeight = Math.max(nameHeight + 10, rowHeight);

          // Draw row borders
          doc.rect(50, y, 495, itemHeight).strokeColor('#003399').stroke();
          doc.moveTo(col2, y).lineTo(col2, y + itemHeight).strokeColor('#003399').stroke();
          doc.moveTo(col3, y).lineTo(col3, y + itemHeight).strokeColor('#003399').stroke();
          doc.moveTo(col4, y).lineTo(col4, y + itemHeight).strokeColor('#003399').stroke();
          doc.moveTo(col5, y).lineTo(col5, y + itemHeight).strokeColor('#003399').stroke();

          doc.font(font).fontSize(10).fillColor('#000000');
          doc.text(item.productName, col1 + 5, y + 7, { width: 120 });
          doc.font(fontBold).text(item.colorCode || '—', col2, y + 7, { width: 70, align: 'center' });
          doc.font(font).text(item.quantity.toLocaleString('vi-VN') + ' Kg', col3, y + 7, { width: 70, align: 'center' });
          doc.text(item.unitPrice.toLocaleString('vi-VN') + 'đ', col4 - 5, y + 7, { width: 95, align: 'right' });
          doc.font(fontBold).text(lineTotal.toLocaleString('vi-VN') + 'đ', col5 - 5, y + 7, { width: 95, align: 'right' });
          
          y += itemHeight;
        });

        // Draw Table Footer
        doc.rect(50, y, 495, rowHeight).fillAndStroke('#f8faff', '#003399');
        doc.rect(50, y, 495, rowHeight).strokeColor('#003399').stroke();
        doc.moveTo(col5, y).lineTo(col5, y + rowHeight).strokeColor('#003399').stroke();
        
        doc.font(fontBold).fontSize(10).fillColor('#000000');
        doc.text('Tổng giá trị:', col4 - 50, y + 7, { width: 140, align: 'right' });
        doc.fillColor('#003399').text(contract.TongGiaTri.toLocaleString('vi-VN') + 'đ', col5 - 5, y + 7, { width: 95, align: 'right' });
        
        doc.x = 50;
        doc.y = y + rowHeight + 20;
        doc.fillColor('#000000'); // Reset color
      }

      // ========== Các Điều khoản khác (2 - 11) ==========
      if (contract.articles) {
        for (let num = 2; num <= 11; num++) {
          if (contract.articles[`article${num}`]) {
            doc.font(fontBold).fontSize(12).fillColor('#003399').text(`Điều ${num}:`);
            doc.moveDown(0.3);
            doc.font(font).fontSize(11).fillColor('#000000').text(contract.articles[`article${num}`]);
            doc.moveDown(1);
          }
        }
      }

      // ========== CHỮ KÝ ==========
      doc.moveDown(1);
      const sigY = doc.y;
      
      doc.font(fontBold).fontSize(12).fillColor('#003399');
      doc.text('ĐẠI DIỆN BÊN A', 50, sigY, { width: 240, align: 'center' });
      doc.text('ĐẠI DIỆN BÊN B', 300, sigY, { width: 240, align: 'center' });
      
      doc.font(font).fontSize(10).fillColor('#666666');
      doc.text('(Đã xác nhận on-chain)', 50, sigY + 15, { width: 240, align: 'center' });
      doc.text('(Ký trực tiếp)', 300, sigY + 15, { width: 240, align: 'center' });
      
      doc.font(fontBold).fontSize(14).fillColor('#003399');
      doc.text('Phí Bình Minh', 50, sigY + 90, { width: 240, align: 'center' });
      doc.text(repName || '................................', 300, sigY + 90, { width: 240, align: 'center' });

      // ========== FOOTER ==========
      doc.moveDown(4);
      doc.fontSize(8).fillColor('#666')
        .text(
          'Hợp đồng này được số hóa và lưu trữ bất biến trên mạng lưới Blockchain Ethereum (Sepolia Testnet) và hệ thống lưu trữ phân tán IPFS.',
          50, doc.y, { align: 'center' }
        );
      doc.text(
        'Mọi thay đổi sau khi ký số sẽ bị phát hiện thông qua cơ chế đối chiếu mã băm SHA-256.',
        50, doc.y, { align: 'center' }
      );

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // === 2. Tính Hash SHA-256 của file PDF ===
    const pdfBuffer = fs.readFileSync(pdfPath);
    const documentHash = '0x' + crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // === 3. Upload lên IPFS via Pinata ===
    const ipfsResult = await uploadToIPFS(pdfPath, `${contract.MaHopDong}.pdf`);

    // === 4. Cập nhật MongoDB ===
    contract.DocumentHash = documentHash;
    contract.IPFSCID = ipfsResult.ipfsCid;
    await contract.save();

    // Nếu Pinata chưa được cấu hình (mock upload), ta giữ lại file ở folder /uploads 
    // và trả về URL local để frontend vẫn xem được PDF.
    let finalPdfUrl = ipfsResult.url;
    if (ipfsResult.mock) {
      const hostUrl = req.protocol + '://' + req.get('host');
      finalPdfUrl = `${hostUrl}/uploads/contract_${contract.MaHopDong}.pdf`;
    } else {
      // Nếu đã upload IPFS thật, xóa file temp local
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    res.status(200).json({
      success: true,
      data: {
        documentHash,
        ipfsCid: ipfsResult.ipfsCid,
        pdfUrl: finalPdfUrl,
        mock: ipfsResult.mock || false
      }
    });
  } catch (error) {
    console.error('generatePreviewPDF error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi sinh PDF: ' + error.message });
  }
};

// @desc    Register contract on-chain (VTSC Admin calls after PDF preview)
// @route   POST /api/contracts/:id/deploy
// @access  Private (Admin)
exports.deployOnChain = async (req, res) => {
  try {
    const contract = await HopDong.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    if (!contract.clientAddress) {
      if (req.body.clientAddress) {
        contract.clientAddress = req.body.clientAddress;
        if (!/^0x[a-fA-F0-9]{40}$/.test(contract.clientAddress)) {
          return res.status(400).json({ success: false, error: 'Địa chỉ ví MetaMask không hợp lệ' });
        }
      } else {
        return res.status(400).json({ success: false, error: 'Hợp đồng chưa có địa chỉ ví khách hàng B2B' });
      }
    }

    if (contract.TrangThai !== 'draft') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể deploy hợp đồng ở trạng thái Bản nháp' });
    }

    if (!contract.IPFSCID || !contract.DocumentHash) {
      return res.status(400).json({ success: false, error: 'Vui lòng sinh PDF và upload IPFS trước khi deploy (Bước 1)' });
    }

    const slaTimestamp = contract.slaDeadline
      ? Math.floor(new Date(contract.slaDeadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // Default 1 year

    const result = await createContractOnChain(
      contract.MaHopDong,
      contract.clientAddress,
      contract.TongGiaTri,
      slaTimestamp,
      contract.DocumentHash || ''
    );

    contract.TransactionHash = result.txHash;
    contract.SmartContractAddress = result.contractAddress;
    contract.TrangThai = 'created'; // On-chain = Created, chờ client ký
    await contract.save();

    res.status(200).json({
      success: true,
      data: {
        txHash: result.txHash,
        smartContractAddress: result.contractAddress,
        status: contract.TrangThai,
        mock: result.mock || false
      }
    });
  } catch (error) {
    console.error('deployOnChain error:', error);
    res.status(500).json({ success: false, error: 'Lỗi ghi Blockchain: ' + error.message });
  }
};

// @desc    Client signs contract — receives txHash from MetaMask signDocument()
// @route   PATCH /api/contracts/:id/sign
// @access  Private (Admin, KhachHangB2B)
exports.signContract = async (req, res) => {
  try {
    const contract = await HopDong.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    // Validate: chỉ cho phép ký khi status = 'created'
    if (contract.TrangThai !== 'created') {
      return res.status(400).json({ success: false, error: 'Hợp đồng phải ở trạng thái "Chờ ký" để thực hiện ký số' });
    }

    const { party, signature, txHash } = req.body;

    // Validate txHash format
    if (txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ success: false, error: 'Transaction Hash không hợp lệ' });
    }

    if (party === 'vtsc') {
      contract.vtscSignature = signature;
    } else if (party === 'client') {
      contract.clientSignature = signature;
    }

    if (txHash) {
      contract.TransactionHash = txHash;
      contract.TrangThai = 'signed'; // Khớp với status on-chain sau signDocument()
    }

    await contract.save();
    
    if (contract.TrangThai === 'signed') {
      await autoCreateDownstreamData(contract);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: contract._id,
        contractId: contract.MaHopDong,
        status: contract.TrangThai,
        txHash: contract.TransactionHash,
        vtscSignature: contract.vtscSignature,
        clientSignature: contract.clientSignature,
      }
    });
  } catch (error) {
    console.error('signContract error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update contract status
// @route   PATCH /api/contracts/:id/status
// @access  Private (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'created', 'signed', 'delivering', 'completed', 'disputed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
    }

    const contract = await HopDong.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    contract.TrangThai = status;
    await contract.save();

    // Auto-create DonHang, VanChuyen & R&D if signed
    if (status === 'signed') {
      await autoCreateDownstreamData(contract);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: contract._id,
        contractId: contract.MaHopDong,
        status: contract.TrangThai,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Verify contract on-chain
// @route   GET /api/contracts/:id/onchain
// @access  Private
exports.verifyOnChain = async (req, res) => {
  try {
    const contract = await HopDong.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    const onChainData = await getContractStatus(contract.MaHopDong);

    res.status(200).json({
      success: true,
      data: {
        mongoId: contract._id,
        contractId: contract.MaHopDong,
        mongoStatus: contract.TrangThai,
        onChain: onChainData
      }
    });
  } catch (error) {
    console.error('On-chain verification error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to verify on-chain status' });
  }
};

// @desc    Client signs contract via Server (Backend dùng ví hệ thống ký)
// @route   POST /api/contracts/:id/sign-by-server
// @access  Private (Admin, KhachHangB2B)
exports.signContractByServer = async (req, res) => {
  try {
    // Bước 1: Tìm thông tin hợp đồng trong MongoDB theo ID.
    const contractDoc = await HopDong.findById(req.params.id);
    if (!contractDoc) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    // if (contractDoc.TrangThai !== 'created') {
    //   return res.status(400).json({ success: false, error: 'Hợp đồng phải ở trạng thái "Chờ ký" để thực hiện ký số' });
    // }

    if (!contractDoc.DocumentHash || !contractDoc.IPFSCID) {
      return res.status(400).json({ success: false, error: 'Hợp đồng thiếu DocumentHash hoặc IPFSCID' });
    }

    // Bước 2: Sử dụng instance của Smart Contract đã được liên kết với systemWallet ở file blockchain.js
    const { contract } = require('../utils/blockchain');
    if (!contract) {
       return res.status(500).json({ success: false, error: 'Chưa kết nối Blockchain' });
    }

    // Gọi hàm thực thi trên chuỗi: Hàm signDocument()
    // Do contract đã connect(systemWallet) nên giao dịch sẽ được ký ngầm bằng ví hệ thống.
    const tx = await contract.signDocument(
      contractDoc.MaHopDong, 
      contractDoc.DocumentHash, 
      contractDoc.IPFSCID
    );

    // Bước 3: Chờ giao dịch hoàn tất trên mạng lưới
    const receipt = await tx.wait();

    // Bước 4: Lấy mã giao dịch tx.hash, cập nhật trạng thái hợp đồng thành "signed"
    contractDoc.TransactionHash = receipt.hash;
    contractDoc.TrangThai = 'signed';
    contractDoc.clientSignature = receipt.hash; // Đánh dấu Client đã ký bằng Server

    await contractDoc.save();
    
    await autoCreateDownstreamData(contractDoc);

    // Bước 5: Trả về phản hồi JSON thành công cho Frontend kèm theo mã txHash
    res.status(200).json({
      success: true,
      data: {
        _id: contractDoc._id,
        contractId: contractDoc.MaHopDong,
        status: contractDoc.TrangThai,
        txHash: receipt.hash,
        clientSignature: contractDoc.clientSignature
      }
    });
  } catch (error) {
    console.error('signContractByServer error:', error);
    res.status(500).json({ success: false, error: 'Lỗi ký hợp đồng: ' + error.message });
  }
};
