const exceljs = require('exceljs');
const KhachHang = require('../models/KhachHang');
const SalesTarget = require('../models/SalesTarget');

const exportCustomersExcel = async (req, res) => {
  try {
    const customers = await KhachHang.find().lean();
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('Danh Sach Khach Hang');

    sheet.columns = [
      { header: 'Mã KH', key: 'MaKH', width: 15 },
      { header: 'Tên Khách Hàng', key: 'TenKhachHang', width: 35 },
      { header: 'Phân Loại', key: 'PhanLoai', width: 15 },
      { header: 'SĐT', key: 'SDT', width: 15 },
      { header: 'Email', key: 'Email', width: 25 },
      { header: 'Địa Chỉ', key: 'DiaChi', width: 40 },
      { header: 'Ví Web3', key: 'WalletAddress', width: 45 },
    ];

    sheet.addRows(customers);
    
    // Styling headers
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=KhachHang_VTSC.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
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
      { header: 'Target (Kg)', key: 'targetKg', width: 15 },
      { header: 'Thực tế (Kg)', key: 'actualKg', width: 15 },
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
