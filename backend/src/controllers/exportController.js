const exceljs = require('exceljs');
const KhachHang = require('../models/KhachHang');
const SalesTarget = require('../models/SalesTarget');

const exportCustomersExcel = async (req, res) => {
  try {
    const path = require('path');

    let query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ TenKhachHang: searchRegex }, { MaKH: searchRegex }];
    }
    if (req.query.filter && req.query.filter !== 'all') {
      query.PhanLoai = req.query.filter;
    }

    const customers = await KhachHang.find(query).lean();
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Danh Sach Khach Hang');



    // Add Top Rows
    sheet.addRow([]); // Row 1
    sheet.addRow([]); // Row 2

    // Row 3
    const row3 = sheet.addRow([null, null, 'Công ty Cổ phần Thương mại và Dịch vụ VOSCO']);
    row3.getCell(3).font = { color: { argb: 'FF0070C0' }, bold: true, size: 22 }; // Xanh nước biển

    sheet.addRow([]); // Row 4
    sheet.addRow([]); // Row 5

    // Row 6: Tiêu đề
    const row6 = sheet.addRow(['BÁO CÁO THỐNG KÊ KHÁCH HÀNG']);
    sheet.mergeCells('A6:F6');
    const titleCell = sheet.getCell('A6');
    titleCell.font = { size: 24, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]); // Row 7

    // Row 8: Header
    const headerRow = sheet.addRow(['Mã KH', 'Tên Khách Hàng', 'Phân Loại', 'SĐT', 'Email', 'Địa Chỉ']);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }; // Xanh nước biển
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add Data
    customers.forEach(c => {
      const dataRow = sheet.addRow([
        c.MaKH || '',
        c.TenKhachHang || '',
        c.PhanLoai || '',
        c.SDT || '',
        c.Email || '',
        c.DiaChi || ''
      ]);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto-fit columns
    for (let i = 1; i <= 6; i++) {
      let maxLength = 0;
      // loop from header row (8) to end
      for (let r = 8; r <= sheet.rowCount; r++) {
        const val = sheet.getRow(r).getCell(i).value;
        const len = val ? val.toString().length : 10;
        if (len > maxLength) maxLength = len;
      }
      sheet.getColumn(i).width = maxLength < 15 ? 15 : maxLength + 2;
    }

    // Add Logo
    try {
      const logoPath = path.join(__dirname, '../../../frontend/public/vtsc.png');
      const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
      });
      // A1 position (col: 0, row: 0)
      sheet.addImage(logoId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 220, height: 170 }
      });
    } catch (err) {
      console.error('Không tìm thấy logo:', err);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=KhachHang_VTSC.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Lỗi xuất Excel' });
  }
};

const exportTargetsExcel = async (req, res) => {
  try {
    const targets = await SalesTarget.find().populate('customer').lean();
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Muc Tieu San Luong');

    sheet.columns = [
      { header: 'Tháng', key: 'month', width: 10 },
      { header: 'Năm', key: 'year', width: 10 },
      { header: 'Mã KH', key: 'MaKH', width: 15 },
      { header: 'Tên KH', key: 'TenKhachHang', width: 35 },
      { header: 'Target (Thùng)', key: 'targetKg', width: 15 },
      { header: 'Thực tế (Thùng)', key: 'actualKg', width: 15 },
    ];

    const rows = targets.map(t => ({
      month: t.period?.month,
      year: t.period?.year,
      MaKH: t.customer?.MaKH || 'N/A',
      TenKhachHang: t.customer?.TenKhachHang || 'N/A',
      targetKg: t.targetKg,
      actualKg: t.actualKg
    }));

    sheet.addRows(rows);
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9900' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Target_VTSC.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi xuất Excel' });
  }
};

// Hàm sinh PDF đã được chuyển qua ContractController, đặt rỗng ở đây để tránh lỗi gọi hàm
const generateContractPDF = async (req, res) => {
  res.status(400).json({ error: 'Vui lòng sử dụng route /api/contracts/:id/preview' });
}

module.exports = { exportCustomersExcel, exportTargetsExcel, generateContractPDF };
