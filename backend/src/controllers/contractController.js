const HopDong = require('../models/HopDong');
const { getContractStatus, createContractOnChain } = require('../utils/blockchain');
const { uploadToIPFS } = require('../utils/ipfs');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private (Admin, NhanVien, KhachHangB2B)
exports.getContracts = async (req, res) => {
  try {
    let filter = {};

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
      doc.font(fontBold).fontSize(14)
        .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.font(fontBold).fontSize(12)
        .text('Độc lập — Tự do — Hạnh phúc', { align: 'center' });
      doc.moveDown(0.3);
      doc.font(font).fontSize(9)
        .text('————————————————', { align: 'center' });
      doc.moveDown(1.2);

      // ========== COMPANY INFO ==========
      doc.font(fontBold).fontSize(13)
        .text('CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)', { align: 'center' });
      doc.moveDown(0.2);
      doc.font(font).fontSize(9)
        .text('Đại lý cấp 1 Sơn bột tĩnh điện AkzoNobel (Thương hiệu Interpon)', { align: 'center' });
      doc.moveDown(1.5);

      // ========== TITLE ==========
      doc.font(fontBold).fontSize(18)
        .text('HỢP ĐỒNG NGUYÊN TẮC MUA BÁN', { align: 'center' });
      doc.moveDown(0.3);
      doc.font(font).fontSize(11)
        .text(`Số: ${contract.MaHopDong}`, { align: 'center' });
      doc.font(font).fontSize(9)
        .text(`Ngày lập: ${new Date(contract.NgayLap || contract.createdAt).toLocaleDateString('vi-VN')}`, { align: 'center' });
      doc.moveDown(1.5);

      // ========== BÊN A (VTSC) ==========
      doc.font(fontBold).fontSize(12).text('BÊN A (Bên bán): CÔNG TY VTSC');
      doc.font(font).fontSize(10)
        .text(`Đại diện: Phí Bình Minh — Trưởng phòng Kinh doanh Sơn`)
        .text(`Địa chỉ ví Blockchain: ${contract.vtscAddress || 'Chưa cập nhật'}`);
      doc.moveDown(0.8);

      // ========== BÊN B (Khách hàng) ==========
      doc.font(fontBold).fontSize(12)
        .text(`BÊN B (Bên mua): ${customerName}`);
      doc.font(font).fontSize(10)
        .text(`Mã khách hàng: ${customerCode}`)
        .text(`Địa chỉ ví Blockchain: ${contract.clientAddress || 'Chưa liên kết'}`);
      doc.moveDown(1.2);

      // ========== ĐIỀU 1: NỘI DUNG HỢP ĐỒNG ==========
      doc.font(fontBold).fontSize(12).text('ĐIỀU 1: NỘI DUNG HỢP ĐỒNG');
      doc.moveDown(0.5);

      if (contract.ChiTietHopDong && contract.ChiTietHopDong.length > 0) {
        // Table header
        const tableTop = doc.y;
        const col1 = 50, col2 = 180, col3 = 280, col4 = 370, col5 = 460;

        doc.font(fontBold).fontSize(9);
        doc.text('Sản phẩm', col1, tableTop);
        doc.text('Mã màu', col2, tableTop);
        doc.text('Khối lượng (Kg)', col3, tableTop);
        doc.text('Đơn giá (VNĐ)', col4, tableTop);
        doc.text('Thành tiền', col5, tableTop);

        doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke();

        let y = tableTop + 20;
        doc.font(font).fontSize(9);

        contract.ChiTietHopDong.forEach((item) => {
          const lineTotal = item.quantity * item.unitPrice;
          doc.text(item.productName, col1, y, { width: 125 });
          doc.text(item.colorCode || '—', col2, y);
          doc.text(item.quantity.toLocaleString('vi-VN'), col3, y);
          doc.text(item.unitPrice.toLocaleString('vi-VN'), col4, y);
          doc.text(lineTotal.toLocaleString('vi-VN'), col5, y);
          y += 18;
        });

        doc.moveTo(50, y).lineTo(545, y).stroke();
        y += 5;
        doc.font(fontBold).fontSize(10);
        doc.text(`TỔNG GIÁ TRỊ HỢP ĐỒNG: ${contract.TongGiaTri.toLocaleString('vi-VN')} VNĐ`, col3, y);
        doc.moveDown(2);
      }

      // ========== ĐIỀU 2: ĐIỀU KHOẢN ==========
      doc.font(fontBold).fontSize(12).text('ĐIỀU 2: ĐIỀU KHOẢN THỎA THUẬN');
      doc.moveDown(0.3);
      doc.font(font).fontSize(10);
      if (contract.terms) {
        if (contract.terms.sla) doc.text(`— Điều khoản SLA giao hàng: ${contract.terms.sla}`);
        if (contract.terms.penalty) doc.text(`— Phạt vi phạm hợp đồng: ${contract.terms.penalty}`);
        if (contract.terms.duration) doc.text(`— Thời hạn hiệu lực: ${contract.terms.duration}`);
      }
      if (contract.slaDeadline) {
        doc.text(`— Hạn SLA giao hàng: ${new Date(contract.slaDeadline).toLocaleDateString('vi-VN')}`);
      }
      doc.moveDown(1.5);

      // ========== ĐIỀU 3: PHƯƠNG THỨC THANH TOÁN ==========
      doc.font(fontBold).fontSize(12).text('ĐIỀU 3: PHƯƠNG THỨC THANH TOÁN');
      doc.moveDown(0.3);
      doc.font(font).fontSize(10)
        .text('Hai bên thỏa thuận thanh toán bằng phương thức chuyển khoản ngân hàng theo cơ chế công nợ truyền thống.')
        .text('Hệ thống Blockchain chỉ ghi nhận bằng chứng ký kết, KHÔNG xử lý chuyển tiền điện tử.');
      doc.moveDown(1.5);

      // ========== CHỮ KÝ ==========
      doc.font(fontBold).fontSize(11);
      const sigY = doc.y;
      doc.text('ĐẠI DIỆN BÊN A (VTSC)', 80, sigY);
      doc.text('ĐẠI DIỆN BÊN B', 360, sigY);
      doc.moveDown(3);
      doc.font(font).fontSize(9);
      const sigNoteY = doc.y;
      doc.text('(Ký số qua ví MetaMask)', 80, sigNoteY);
      doc.text('(Ký số qua ví MetaMask)', 360, sigNoteY);

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

    // Cleanup temp file
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    res.status(200).json({
      success: true,
      data: {
        documentHash,
        ipfsCid: ipfsResult.ipfsCid,
        pdfUrl: ipfsResult.url,
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
      return res.status(400).json({ success: false, error: 'Hợp đồng chưa có địa chỉ ví khách hàng B2B' });
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

    // Auto-create DonHang & VanChuyen if signed
    if (status === 'signed') {
      const DonHang = require('../models/DonHang');
      const VanChuyen = require('../models/VanChuyen');
      const NhanVien = require('../models/NhanVien');
      const SanPhamSon = require('../models/SanPhamSon');
      
      // Tìm 1 sản phẩm bất kỳ làm tham chiếu (vì mongoose yêu cầu ObjectId)
      const sampleSP = await SanPhamSon.findOne();
      const defaultSpId = sampleSP ? sampleSP._id : null;
      
      // Tìm 1 nhân viên bất kỳ làm người phụ trách vận chuyển mặc định
      const sampleNV = await NhanVien.findOne();
      const defaultNvId = contract.EmployeeID || (sampleNV ? sampleNV._id : null);

      // Auto-tính subtotal để ghi nhận thuế
      const subtotalForTaxCalculation = contract.ChiTietHopDong.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      // Tạo đơn hàng
      const newOrder = await DonHang.create({
        MaDonHang: `DH-${contract.MaHopDong}`,
        KhachHang: contract.CustomerID,
        NhanVienPhuTrach: defaultNvId,
        Items: contract.ChiTietHopDong.map(item => ({
          SanPham: defaultSpId, // ID tạm
          TenSanPham: item.productName,
          MaMau: item.colorCode,
          SoLuong: item.quantity,
          DonGia: item.unitPrice,
          ThanhTien: item.quantity * item.unitPrice
        })),
        TienThue: contract.TongGiaTri > subtotalForTaxCalculation ? contract.TongGiaTri - subtotalForTaxCalculation : 0,
        TongTien: contract.TongGiaTri,
        TrangThai: 'DANG_XU_LY',
        PhuongThucThanhToan: 'CHUYEN_KHOAN',
        TrangThaiThanhToan: 'CHUA_THANH_TOAN',
        DiaChiGiaoHang: contract.partyBAddress || 'Kho khách hàng',
        GhiChu: `Người nhận: ${contract.partyBRepresentative || 'Khách hàng'} - SĐT: ${contract.partyBPhoneNumber || '0987654321'}. Đơn hàng tự động từ Hợp đồng R&D`
      });

      // Tạo vận chuyển
      await VanChuyen.create({
        MaVanChuyen: `VC-${contract.MaHopDong}`,
        DonHang: newOrder._id,
        LoHang: {
          SoKien: 1,
          KhoiLuong: contract.ChiTietHopDong.reduce((sum, i) => sum + i.quantity, 0),
          MauSon: contract.ChiTietHopDong[0]?.colorCode || 'Mixed'
        },
        VanChuyenInfo: {
          DonVi: 'VTSC Logistics',
          NhanVien: defaultNvId // Tạm lấy Employee Hợp đồng làm NV giao hàng
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
