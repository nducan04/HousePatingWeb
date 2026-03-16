const exceljs = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SalesTarget = require('../models/SalesTarget');
const Contract = require('../models/Contract');

const exportCustomersExcel = async (req, res) => {
  try {
    const customers = await Customer.find().lean();
    
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Danh Sach Khach Hang');

    sheet.columns = [
      { header: 'Mã KH', key: 'code', width: 15 },
      { header: 'Tên Công Ty', key: 'companyName', width: 35 },
      { header: 'Loại KH', key: 'type', width: 20 },
      { header: 'Người Đại Diện', key: 'contactPerson', width: 25 },
      { header: 'Số Điện Thoại', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Địa Chỉ', key: 'address', width: 40 },
    ];

    sheet.addRows(customers);
    
    // Styling headers
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vtsc_customers.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi xuất file Excel' });
  }
};

const exportTargetsExcel = async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = {};
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const targets = await SalesTarget.find(query).populate('customer', 'code companyName').lean();
    
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Doanh So vs Muc Tieu');

    sheet.columns = [
      { header: 'Tháng/Năm', key: 'period', width: 15 },
      { header: 'Mã KH', key: 'customerCode', width: 15 },
      { header: 'Tên Công Ty', key: 'companyName', width: 35 },
      { header: 'Mục Tiêu (kg)', key: 'targetAmount', width: 15 },
      { header: 'Thực Tế (kg)', key: 'actualAmount', width: 15 },
      { header: 'Tỷ Lệ Đạt (%)', key: 'achievementRatio', width: 15 },
      { header: 'Khách Hàng Lớn', key: 'isKeyAccount', width: 15 },
    ];

    targets.forEach(t => {
      const achievementRatio = t.targetAmount > 0 ? ((t.actualAmount / t.targetAmount) * 100).toFixed(2) + '%' : '0%';
      sheet.addRow({
         period: `${t.month}/${t.year}`,
         customerCode: t.customer?.code || 'N/A',
         companyName: t.customer?.companyName || 'N/A',
         targetAmount: t.targetAmount,
         actualAmount: t.actualAmount,
         achievementRatio,
         isKeyAccount: t.isKeyAccount ? 'Yes' : 'No'
      });
    });

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=vtsc_targets_${year || 'all'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Targets Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi xuất file Excel' });
  }
};

const generateContractPDF = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Find contract and populate related data
    const contract = await Contract.findById(contractId)
       .populate('customer', 'companyName code address phone contactPerson')
       .populate('products.product', 'name sku colorCode price');
       
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hợp đồng' });
    }

    // Initialize Document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `hop_dong_${contract.contractNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
    doc.fontSize(12).text('Độc lập - Tự do - Hạnh phúc', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(18).text('HỢP ĐỒNG NGUYÊN TẮC MUA BÁN', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Số: ${contract.contractNumber}/HĐNT-VTSC`, { align: 'center' });
    doc.moveDown(2);

    // Date
    const date = new Date(contract.createdAt);
    doc.text(`Hôm nay, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}, chúng tôi gồm:`, { align: 'left' });
    doc.moveDown();

    // Party A (VTSC)
    doc.font('Helvetica-Bold').text('BÊN A: CÔNG TY CP THƯƠNG MẠI & DỊCH VỤ VOSCO (VTSC)');
    doc.font('Helvetica').text('Địa chỉ: 2D Đường Dịch Vọng, Cầu Giấy, Hà Nội');
    doc.text('Điện thoại: 024.3833.6822');
    doc.text('Đại diện bởi: Phí Bình Minh - Chức vụ: Trưởng phòng KD');
    doc.moveDown();

    // Party B (Customer)
    doc.font('Helvetica-Bold').text(`BÊN B: ${contract.customer?.companyName?.toUpperCase() || '...'}`);
    doc.font('Helvetica').text(`Địa chỉ: ${contract.customer?.address || '...'}`);
    doc.text(`Điện thoại: ${contract.customer?.phone || '...'}`);
    doc.text(`Điện diện bởi: ${contract.customer?.contactPerson || '...'}`);
    doc.moveDown(2);

    doc.font('Helvetica-Bold').text('ĐIỀU 1: HÀNG HÓA VÀ GIÁ TRỊ HỢP ĐỒNG');
    doc.font('Helvetica').text('Bên A đồng ý bán và Bên B đồng ý mua hệ sơn bột tĩnh điện hãng AkzoNobel với chi tiết như sau:');
    doc.moveDown();
    
    // Total Value
    doc.text(`Tổng giá trị ước tính: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.totalValue)}`);
    doc.moveDown(2);

    doc.font('Helvetica-Bold').text('ĐIỀU 2: ĐIỀU KHOẢN THANH TOÁN VÀ GIAO HÀNG');
    doc.font('Helvetica').text('- Điều khoản thanh toán: ');
    doc.text(`   ${contract.paymentTerms}`);
    doc.text('- Điều khoản giao hàng: ');
    doc.text(`   ${contract.deliveryTerms}`);
    doc.moveDown(2);
    
    // Blockchain details
    if (contract.blockchainTxHash) {
       doc.font('Helvetica-Bold').text('ĐIỀU 3: BẢO MẬT & SMART CONTRACT');
       doc.font('Helvetica').text('Hợp đồng này được ghi nhận giao dịch bằng Smart Contract trên nền tảng Blockchain:');
       doc.text(`TxHash: ${contract.blockchainTxHash}`);
       doc.moveDown(2);
    }

    // Signatures
    doc.font('Helvetica-Bold').text('ĐẠI DIỆN BÊN A', 100, doc.y, { continued: true });
    doc.text('ĐẠI DIỆN BÊN B', 350, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica').text('(Ký, đóng dấu)', 100, doc.y, { continued: true });
    doc.text('(Ký, đóng dấu)', 350, doc.y);

    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Lỗi khi tạo file PDF' });
    }
  }
};

module.exports = {
  exportCustomersExcel,
  exportTargetsExcel,
  generateContractPDF
};
