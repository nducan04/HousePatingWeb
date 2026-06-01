import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const autoFitColumnWidths = (sheet: ExcelJS.Worksheet, startRow: number = 1) => {
  if (!sheet.columns) return;
  
  sheet.columns.forEach(column => {
    if (!column || typeof column.eachCell !== 'function') return;

    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber >= startRow && !cell.isMerged) {
        const val = cell.value;
        if (val !== null && val !== undefined) {
          const strVal = val.toString();
          if (strVal.length > maxLength) {
            maxLength = strVal.length;
          }
        }
      }
    });
    if (maxLength > 0) {
      column.width = Math.min(Math.max(maxLength + 4, 10), 100);
    }
  });
};

/**
 * Xuất báo cáo Excel kết quả kinh doanh & điều hành thời gian thực cho VTSC PaintPro
 * @param stats Dữ liệu KPIs từ API
 * @param staffRanking Danh sách xếp hạng nhân viên
 * @param topCustomers Danh sách khách hàng trọng tâm
 * @param period Kỳ báo cáo (ví dụ: "Năm 2026")
 */
export const exportDashboardToExcel = async (
  stats: any,
  staffRanking: any[],
  topCustomers: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleDateString('vi-VN');
  
  // Font chung cho toàn bộ bảng tính
  const baseFont = { name: 'Arial', size: 11 };
  const titleFont = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1A1A40' } };
  const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const subTitleFont = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  
  // Mở sheet 1: BÁO CÁO CHỈ SỐ KPI
  const sheet1 = workbook.addWorksheet('KPI & Tổng Quan', {
    views: [{ showGridLines: true }]
  });

  // Logo thương hiệu/Tên công ty
  sheet1.mergeCells('A1:D1');
  const companyCell = sheet1.getCell('A1');
  companyCell.value = 'CÔNG TY CỔ PHẦN PHÂN PHỐI SƠN VTSC - PAINTPRO';
  companyCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

  // Tiêu đề chính
  sheet1.mergeCells('A3:G3');
  const mainTitleCell = sheet1.getCell('A3');
  mainTitleCell.value = 'BÁO CÁO THỐNG KÊ CHỈ SỐ KPI HỆ THỐNG';
  mainTitleCell.font = titleFont;
  mainTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Kỳ báo cáo
  sheet1.mergeCells('A4:G4');
  const periodCell = sheet1.getCell('A4');
  periodCell.value = `Kỳ báo cáo: ${period} ── Ngày xuất báo cáo: ${exportDate}`;
  periodCell.font = subTitleFont;
  periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khai báo bảng chỉ số KPI
  const kpiHeaders = ['STT', 'CHỈ SỐ KPI CHỦ CHỐT', 'GIÁ TRỊ TRONG KỲ', 'ĐƠN VỊ', 'ĐÁNH GIÁ TRỰC QUAN'];
  const totalRevenue = stats?.kpi?.totalRevenue?.value ?? 0;
  const customerCount = stats?.kpi?.customerCount?.value ?? 0;
  const totalProduction = stats?.kpi?.totalProduction?.value ?? 0;

  const kpiRows = [
    [1, 'Tổng doanh thu', totalRevenue, 'Triệu VNĐ', 'Doanh số kinh doanh thực tế đạt được'],
    [2, 'Tổng sản lượng xuất bán', totalProduction, 'KG (Thùng)', 'Sản lượng phân phối qua các kho hàng'],
    [3, 'Tổng số đơn đặt hàng', customerCount, 'Đơn hàng', 'Số lượng giao dịch thành công phát sinh'],
    [4, 'Tổng số khách hàng tương tác', customerCount, 'Khách hàng', 'Đối tác phát sinh hóa đơn & hợp đồng'],
  ];

  // Vẽ Header bảng
  const kpiHeaderRow = sheet1.getRow(6);
  kpiHeaderRow.values = kpiHeaders;
  kpiHeaderRow.font = headerFont;
  kpiHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  kpiHeaders.forEach((_, colIdx) => {
    const cell = kpiHeaderRow.getCell(colIdx + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A40' } // Xanh navy VTSC
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // Thêm dữ liệu
  kpiRows.forEach((row, idx) => {
    const r = sheet1.getRow(7 + idx);
    r.values = row;
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Border
    row.forEach((_, cIdx) => {
      const cell = r.getCell(cIdx + 1);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (cIdx === 0 || cIdx === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // Format số
    r.getCell(3).numFmt = '#,##0';
  });

  // Căn lề theo content cho sheet 1
  autoFitColumnWidths(sheet1, 6);

  // ───────────────────────────────────────────────
  // Sheet 2: TOP NHÂN VIÊN DOANH THU
  const sheet2 = workbook.addWorksheet('Top Nhân Viên Doanh Thu', {
    views: [{ showGridLines: true }]
  });

  sheet2.mergeCells('A1:C1');
  const sheet2Header = sheet2.getCell('A1');
  sheet2Header.value = 'DANH SÁCH TOP NHÂN VIÊN DOANH THU XUẤT SẮC';
  sheet2Header.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1A1A40' } };

  const staffHeaders = ['HẠNG', 'HỌ VÀ TÊN NHÂN VIÊN', 'DOANH THU (TRIỆU VNĐ)'];
  const staffHeaderRow = sheet2.getRow(3);
  staffHeaderRow.values = staffHeaders;
  staffHeaderRow.font = headerFont;
  staffHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  staffHeaders.forEach((_, colIdx) => {
    const cell = staffHeaderRow.getCell(colIdx + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' } // Xanh dương
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  if (staffRanking && staffRanking.length > 0) {
    staffRanking.forEach((s, idx) => {
      const r = sheet2.getRow(4 + idx);
      r.values = [idx + 1, s.name, s.revenue];
      r.font = baseFont;
      r.alignment = { vertical: 'middle' };
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(3).numFmt = '#,##0';

      [1, 2, 3].forEach(colIdx => {
        r.getCell(colIdx).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  } else {
    sheet2.mergeCells('A4:C4');
    const noDataCell = sheet2.getCell('A4');
    noDataCell.value = 'Chưa có dữ liệu nhân viên xuất sắc trong kỳ báo cáo';
    noDataCell.alignment = { horizontal: 'center' };
    noDataCell.font = { italic: true };
  }

  autoFitColumnWidths(sheet2, 3);

  // ───────────────────────────────────────────────
  // Sheet 3: TIẾN ĐỘ KHÁCH HÀNG TRỌNG TÂM
  const sheet3 = workbook.addWorksheet('Khách Hàng Trọng Tâm', {
    views: [{ showGridLines: true }]
  });

  sheet3.mergeCells('A1:G1');
  const sheet3Header = sheet3.getCell('A1');
  sheet3Header.value = 'BẢNG TIẾN ĐỘ SẢN LƯỢNG & DOANH THU KHÁCH HÀNG TRỌNG TÂM';
  sheet3Header.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1A1A40' } };

  const custHeaders = ['HẠNG', 'KHÁCH HÀNG', 'PHÂN KHÚC', 'SẢN LƯỢNG THỰC (KG)', 'DOANH THU ĐẠT (VNĐ)', 'TIẾN ĐỘ HOÀN THÀNH', 'TRẠNG THÁI'];
  const custHeaderRow = sheet3.getRow(3);
  custHeaderRow.values = custHeaders;
  custHeaderRow.font = headerFont;
  custHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  custHeaders.forEach((_, colIdx) => {
    const cell = custHeaderRow.getCell(colIdx + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' } // Xanh ngọc
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  if (topCustomers && topCustomers.length > 0) {
    topCustomers.forEach((c, idx) => {
      const target = c.target || 2500;
      const pct = Math.round((c.volume / target) * 100);
      const statusText = pct >= 90 ? 'VƯỢT CHỈ TIÊU' : pct >= 70 ? 'CẦN CỐ GẮNG' : 'CẢNH BÁO';

      const r = sheet3.getRow(4 + idx);
      r.values = [
        idx + 1,
        c.name,
        c.segment,
        c.volume,
        c.revenue,
        `${pct}%`,
        statusText
      ];
      r.font = baseFont;
      r.alignment = { vertical: 'middle' };
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(6).alignment = { horizontal: 'center' };
      r.getCell(7).alignment = { horizontal: 'center' };

      r.getCell(4).numFmt = '#,##0';
      r.getCell(5).numFmt = '#,##0';

      // Màu sắc theo trạng thái
      const statusCell = r.getCell(7);
      if (pct >= 90) {
        statusCell.font = { bold: true, color: { argb: 'FF059669' } };
      } else if (pct >= 70) {
        statusCell.font = { bold: true, color: { argb: 'D97706' } };
      } else {
        statusCell.font = { bold: true, color: { argb: 'FFDC2626' } };
      }

      [1, 2, 3, 4, 5, 6, 7].forEach(colIdx => {
        r.getCell(colIdx).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  }

  autoFitColumnWidths(sheet3, 3);

  // ───────────────────────────────────────────────
  // Ký tên xác thực ở cuối sheet 1
  const footerStart = 14;
  sheet1.mergeCells(`A${footerStart}:C${footerStart}`);
  const f1 = sheet1.getCell(`A${footerStart}`);
  f1.value = 'NGƯỜI LẬP BIỂU';
  f1.font = { bold: true, size: 10 };
  f1.alignment = { horizontal: 'center' };

  sheet1.mergeCells(`A${footerStart + 1}:C${footerStart + 1}`);
  const f2 = sheet1.getCell(`A${footerStart + 1}`);
  f2.value = '(Ký, ghi rõ họ tên)';
  f2.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
  f2.alignment = { horizontal: 'center' };

  sheet1.mergeCells(`E${footerStart}:G${footerStart}`);
  const f3 = sheet1.getCell(`E${footerStart}`);
  f3.value = 'BAN GIÁM ĐỐC PHÊ DUYỆT';
  f3.font = { bold: true, size: 10 };
  f3.alignment = { horizontal: 'center' };

  sheet1.mergeCells(`E${footerStart + 1}:G${footerStart + 1}`);
  const f4 = sheet1.getCell(`E${footerStart + 1}`);
  f4.value = '(Ký, đóng dấu)';
  f4.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
  f4.alignment = { horizontal: 'center' };

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Bao_Cao_Kinh_Doanh_San_Xuat_VTSC_${period.replace(/\//g, '_')}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};

export const exportBusinessReportExcel = async (
  stats: any,
  transactions: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleString('vi-VN');
  
  const baseFont = { name: 'Times New Roman', size: 11 };
  const boldFont = { name: 'Times New Roman', size: 11, bold: true };
  const italicFont = { name: 'Times New Roman', size: 11, italic: true };
  const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Times New Roman', size: 16, bold: true };

  const sheet = workbook.addWorksheet('Báo Cáo Kinh Doanh', {
    views: [{ showGridLines: false }]
  });

  // Header hành chính
  sheet.mergeCells('A1:C1');
  const companyCell = sheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = boldFont;

  sheet.mergeCells('G1:I1');
  const countryCell = sheet.getCell('G1');
  countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  countryCell.font = boldFont;
  countryCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('G2:I2');
  const mottoCell = sheet.getCell('G2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { ...boldFont, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề
  sheet.mergeCells('A4:I4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'BÁO CÁO HOẠT ĐỘNG KINH DOANH VÀ DOANH THU';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet.mergeCells('A5:I5');
  const subTitleCell = sheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Ngày xuất: ${exportDate}`;
  subTitleCell.font = italicFont;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối 1: Tóm tắt KPI
  const kpiTitleRow = sheet.getRow(7);
  kpiTitleRow.values = ['', 'Tổng Doanh Thu (VNĐ)', 'Sản lượng Xuất kho (KG)', 'Hợp đồng B2B đã ký', 'Đơn B2C hoàn thành'];
  kpiTitleRow.font = headerFont;
  kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiTitleRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiDataRow = sheet.getRow(8);
  const totalRevenue = stats?.kpi?.totalRevenue?.value || 0;
  const totalVolume = stats?.kpi?.totalProduction?.value || 0;
  
  // Tính tổng B2B và B2C từ transactions
  const b2bCount = transactions.filter(t => t.type === 'B2B').length;
  const b2cCount = transactions.filter(t => t.type === 'B2C').length;

  kpiDataRow.values = ['', totalRevenue * 1000000, totalVolume, b2bCount, b2cCount]; // revenue is in millions from API
  kpiDataRow.font = boldFont;
  kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiDataRow.getCell(colIdx);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.numFmt = '#,##0';
  });

  // Khối 2: Bảng chi tiết
  const tableStartRow = 11;
  const headers = ['STT', 'Mã Đơn Hàng', 'Ngày Bán', 'Khách Hàng', 'Loại Hình', 'Sản Phẩm', 'Số Lượng (thùng)', 'Đơn Giá (VNĐ)', 'Thuế (8%)', 'Tổng Tiền Thanh Toán (VNĐ)'];
  
  const headerRow = sheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.font = headerFont;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  transactions.forEach((t, idx) => {
    const r = sheet.getRow(tableStartRow + 1 + idx);
    r.values = [
      idx + 1,
      t.id,
      t.date ? new Date(t.date).toLocaleDateString('vi-VN') : '──/──/────',
      t.customer,
      t.type,
      t.product,
      t.quantity,
      t.unitPrice,
      t.tax,
      t.total
    ];
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Borders
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Formatting numbers
    r.getCell(7).numFmt = '#,##0';
    r.getCell(8).numFmt = '#,##0';
    r.getCell(9).numFmt = '#,##0';
    r.getCell(10).numFmt = '#,##0';
    
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(5).alignment = { horizontal: 'center' };
  });

  // Căn lề theo content
  autoFitColumnWidths(sheet, 7);

  // Khối chữ ký
  const currentLastRow = tableStartRow + transactions.length + 3;
  
  const sigRow1 = sheet.getRow(currentLastRow);
  sigRow1.getCell(2).value = 'NGƯỜI LẬP BIỂU';
  sigRow1.getCell(2).font = boldFont;
  sigRow1.getCell(2).alignment = { horizontal: 'center' };
  
  sigRow1.getCell(6).value = 'KẾ TOÁN TRƯỞNG';
  sigRow1.getCell(6).font = boldFont;
  sigRow1.getCell(6).alignment = { horizontal: 'center' };
  
  sheet.mergeCells(`I${currentLastRow}:J${currentLastRow}`);
  sigRow1.getCell(9).value = 'GIÁM ĐỐC PHÊ DUYỆT';
  sigRow1.getCell(9).font = boldFont;
  sigRow1.getCell(9).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  // Safe filename replacing spaces/slashes
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `VTSC_Bao_Cao_Kinh_Doanh_${safePeriod}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};

export const exportInventoryReportExcel = async (
  stats: any,
  inventory: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleString('vi-VN');
  
  const baseFont = { name: 'Times New Roman', size: 11 };
  const boldFont = { name: 'Times New Roman', size: 11, bold: true };
  const italicFont = { name: 'Times New Roman', size: 11, italic: true };
  const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Times New Roman', size: 16, bold: true };

  const sheet = workbook.addWorksheet('Báo Cáo Tồn Kho', {
    views: [{ showGridLines: false }]
  });

  // Header hành chính
  sheet.mergeCells('A1:C1');
  const companyCell = sheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = boldFont;

  sheet.mergeCells('E1:G1');
  const countryCell = sheet.getCell('E1');
  countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  countryCell.font = boldFont;
  countryCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('E2:G2');
  const mottoCell = sheet.getCell('E2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { ...boldFont, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề
  sheet.mergeCells('A4:G4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'BÁO CÁO XU HƯỚNG SẢN PHẨM VÀ HIỆN TRẠNG TỒN KHO';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet.mergeCells('A5:G5');
  const subTitleCell = sheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Ngày xuất: ${exportDate}`;
  subTitleCell.font = italicFont;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối 1: Tóm tắt KPI
  const kpiTitleRow = sheet.getRow(7);
  kpiTitleRow.values = ['', 'Tổng số SKU', 'Giá trị tồn kho hiện tại (VNĐ)', 'Khối lượng lưu kho (KG)', 'Số SKU cảnh báo mức thấp'];
  kpiTitleRow.font = headerFont;
  kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiTitleRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiDataRow = sheet.getRow(8);
  const invSummary = stats?.inventory?.summary || {};
  kpiDataRow.values = [
    '', 
    invSummary.totalSKUs || 0, 
    invSummary.totalStockValue || 0, 
    invSummary.totalKg || 0, 
    invSummary.lowStockItems || 0
  ];
  kpiDataRow.font = boldFont;
  kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiDataRow.getCell(colIdx);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.numFmt = '#,##0';
  });

  // Khối 2: Bảng chi tiết
  const tableStartRow = 11;
  const headers = ['STT', 'Mã SKU', 'Tên Sản Phẩm/Màu Sơn', 'Phân Loại', 'Số Lượng Tồn Kho (thùng)', 'Đơn Giá Tồn (VNĐ)', 'Tổng Giá Trị Tồn Kho (VNĐ)'];
  
  const headerRow = sheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.font = headerFont;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  inventory.forEach((t, idx) => {
    const r = sheet.getRow(tableStartRow + 1 + idx);
    r.values = [
      idx + 1,
      t.sku,
      t.name,
      t.category,
      t.quantity,
      t.unitPrice,
      t.totalValue
    ];
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Borders
    [1, 2, 3, 4, 5, 6, 7].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Formatting numbers
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).numFmt = '#,##0';
    r.getCell(7).numFmt = '#,##0';
    
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'center' };
  });

  // Căn lề theo content
  autoFitColumnWidths(sheet, 7);

  // Khối chữ ký
  const currentLastRow = tableStartRow + inventory.length + 3;
  
  sheet.mergeCells(`F${currentLastRow}:G${currentLastRow}`);
  const dateRow = sheet.getRow(currentLastRow);
  dateRow.getCell(6).value = 'Hà Nội, ngày ... tháng ... năm 2026';
  dateRow.getCell(6).font = italicFont;
  dateRow.getCell(6).alignment = { horizontal: 'center' };

  sheet.mergeCells(`F${currentLastRow + 1}:G${currentLastRow + 1}`);
  const roleRow = sheet.getRow(currentLastRow + 1);
  roleRow.getCell(6).value = 'Người Lập Báo Cáo';
  roleRow.getCell(6).font = boldFont;
  roleRow.getCell(6).alignment = { horizontal: 'center' };

  // Dòng 3-5 để trống ký tên
  sheet.mergeCells(`F${currentLastRow + 5}:G${currentLastRow + 5}`);
  const systemRow = sheet.getRow(currentLastRow + 5);
  systemRow.getCell(6).value = '[Tên hệ thống xuất: VTSC Auto-Report]';
  systemRow.getCell(6).font = italicFont;
  systemRow.getCell(6).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  // Safe filename
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `VTSC_Bao_Cao_Ton_Kho_${safePeriod}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};

export const exportProductionReportExcel = async (
  stats: any,
  productionLogs: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleString('vi-VN');
  
  const baseFont = { name: 'Times New Roman', size: 11 };
  const boldFont = { name: 'Times New Roman', size: 11, bold: true };
  const italicFont = { name: 'Times New Roman', size: 11, italic: true };
  const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Times New Roman', size: 16, bold: true };

  const sheet = workbook.addWorksheet('Báo Cáo Sản Xuất R&D', {
    views: [{ showGridLines: false }]
  });

  // Header hành chính
  sheet.mergeCells('A1:C1');
  const companyCell = sheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = boldFont;

  sheet.mergeCells('E1:G1');
  const countryCell = sheet.getCell('E1');
  countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  countryCell.font = boldFont;
  countryCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('E2:G2');
  const mottoCell = sheet.getCell('E2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { ...boldFont, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề
  sheet.mergeCells('A4:G4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'BÁO CÁO TIẾN ĐỘ VÀ HIỆU SUẤT PHA CHẾ MẪU THỬ R&D';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet.mergeCells('A5:G5');
  const subTitleCell = sheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Ngày xuất: ${exportDate}`;
  subTitleCell.font = italicFont;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối 1: Tóm tắt KPI Kỹ thuật
  const kpiTitleRow = sheet.getRow(7);
  kpiTitleRow.values = ['', 'Hiệu suất pha chế trung bình (%)', 'Tổng số dự án R&D', 'Tỷ lệ kiểm định KCS đạt yêu cầu (%)'];
  kpiTitleRow.font = headerFont;
  kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

  [2, 3, 4].forEach(colIdx => {
    const cell = kpiTitleRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiDataRow = sheet.getRow(8);
  const rdSummary = stats?.efficiency || 0;
  const successRate = stats?.rdSuccessRate || 0;
  
  kpiDataRow.values = [
    '', 
    `${rdSummary}%`, 
    productionLogs.length || 0, 
    `${successRate}%` 
  ];
  kpiDataRow.font = boldFont;
  kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  [2, 3, 4].forEach(colIdx => {
    const cell = kpiDataRow.getCell(colIdx);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.numFmt = '#,##0';
  });

  // Khối 2: Bảng chi tiết
  const tableStartRow = 11;
  const headers = ['STT', 'Mã Yêu Cầu R&D', 'Tên Khách Hàng B2B', 'Mã Màu Mục Tiêu', 'Khối Lượng Thử Nghiệm (thùng)', 'Trạng Thái Xử Lý', 'Kỹ sư phụ trách'];
  
  const headerRow = sheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.font = headerFont;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  productionLogs.forEach((t, idx) => {
    const r = sheet.getRow(tableStartRow + 1 + idx);
    r.values = [
      idx + 1,
      t.id,
      t.customer,
      t.colorCode,
      t.testWeight,
      t.status,
      t.engineer
    ];
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Borders
    [1, 2, 3, 4, 5, 6, 7].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Formatting numbers
    r.getCell(5).numFmt = '#,##0.00';
    
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(6).alignment = { horizontal: 'center' };
  });

  // Căn lề theo content
  autoFitColumnWidths(sheet, 7);

  // Khối chữ ký
  const currentLastRow = tableStartRow + productionLogs.length + 3;
  
  const sigRow1 = sheet.getRow(currentLastRow);
  sigRow1.getCell(2).value = 'NGƯỜI LẬP BIỂU';
  sigRow1.getCell(2).font = boldFont;
  sigRow1.getCell(2).alignment = { horizontal: 'center' };
  
  sigRow1.getCell(5).value = 'TRƯỞNG PHÒNG R&D';
  sigRow1.getCell(5).font = boldFont;
  sigRow1.getCell(5).alignment = { horizontal: 'center' };
  
  sheet.mergeCells(`F${currentLastRow}:G${currentLastRow}`);
  sigRow1.getCell(6).value = 'GIÁM ĐỐC PHÊ DUYỆT';
  sigRow1.getCell(6).font = boldFont;
  sigRow1.getCell(6).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  // Safe filename
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `VTSC_Bao_Cao_RD_San_Xuat_${safePeriod}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};

export const exportCustomerServiceReportExcel = async (
  summaryData: any,
  ticketList: any[],
  period: string
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const exportDate = new Date().toLocaleString('vi-VN');
    
    // Yêu cầu font chữ chủ đạo: Times New Roman, cỡ 11
    const baseFont = { name: 'Times New Roman', size: 11 };
    const boldFont = { name: 'Times New Roman', size: 11, bold: true };
    const italicFont = { name: 'Times New Roman', size: 11, italic: true };
    const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; // Chữ trắng
    const titleFont = { name: 'Times New Roman', size: 16, bold: true };

    const sheet = workbook.addWorksheet('Báo Cáo Hậu Mãi CSKH', {
      views: [{ showGridLines: false }]
    });

    // --- 1. KHỐI TIÊU ĐỀ HÀNH CHÍNH ---
    // Ô A1:C1
    sheet.mergeCells('A1:C1');
    const companyCell = sheet.getCell('A1');
    companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
    companyCell.font = boldFont;

    // Ô E1:H1
    sheet.mergeCells('E1:H1');
    const countryCell = sheet.getCell('E1');
    countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    countryCell.font = boldFont;
    countryCell.alignment = { horizontal: 'center' };

    // Ô E2:H2
    sheet.mergeCells('E2:H2');
    const mottoCell = sheet.getCell('E2');
    mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
    mottoCell.font = { ...boldFont, underline: true };
    mottoCell.alignment = { horizontal: 'center' };

    // Ô A4:H4
    sheet.mergeCells('A4:H4');
    const titleCell = sheet.getCell('A4');
    titleCell.value = 'BÁO CÁO TÌNH HÌNH HẬU MÃI VÀ CHĂM SÓC KHÁCH HÀNG';
    titleCell.font = titleFont;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Ô A5:H5
    sheet.mergeCells('A5:H5');
    const subTitleCell = sheet.getCell('A5');
    subTitleCell.value = `Kỳ báo cáo: ${period} - Thời gian xuất: ${exportDate}`;
    subTitleCell.font = italicFont;
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- 2. KHỐI 1: BẢNG TÓM TẮT SỐ LIỆU KPI ---
    // Bắt đầu từ dòng 7
    const kpiTitleRow = sheet.getRow(7);
    kpiTitleRow.values = ['', 'Tổng ca bảo hành/đổi trả', 'Tỷ lệ xử lý thành công', 'Thời gian phản hồi TB', 'Điểm hài lòng CSAT'];
    kpiTitleRow.font = headerFont;
    kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Format header bảng KPI (Màu xanh dương đậm, chữ trắng)
    [2, 3, 4, 5].forEach(colIdx => {
      const cell = kpiTitleRow.getCell(colIdx);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const kpiDataRow = sheet.getRow(8);
    // Render dữ liệu thực từ object summaryData
    kpiDataRow.values = [
      '', 
      summaryData?.kpi?.totalReturns || 0, 
      `${summaryData?.kpi?.successRate || 0}%`, 
      `${summaryData?.kpi?.avgResponseTime || 0}h`,
      `${summaryData?.kpi?.csatScore || 0}/5`
    ];
    kpiDataRow.font = boldFont;
    kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Format data KPI
    [2, 3, 4, 5].forEach(colIdx => {
      const cell = kpiDataRow.getCell(colIdx);
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- 3. KHỐI 2: BẢNG DANH SÁCH CHI TIẾT ---
    // Cách khối 1 khoảng 2 dòng => Bắt đầu từ dòng 11
    const tableStartRow = 11;
    const headers = [
      'STT', 
      'Mã Phiếu', 
      'Tên Khách Hàng', 
      'Loại Yêu Cầu', 
      'Trạng Thái Xử Lý', 
      'Nhân Viên Phụ Trách', 
      'Ngày Tạo', 
      'Kết Quả Kiểm Định KCS / Nguyên Nhân Lỗi', 
      'Ghi Chú / Phương Án Xử Lý'
    ];
    
    const headerRow = sheet.getRow(tableStartRow);
    headerRow.values = headers;
    headerRow.font = headerFont;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Format Table Header Chi tiết
    headers.forEach((_, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Đổ dữ liệu từ mảng ticketList
    ticketList.forEach((ticket, idx) => {
      const r = sheet.getRow(tableStartRow + 1 + idx);
      r.values = [
        idx + 1, // A: STT
        ticket.id, // B: Mã Phiếu
        ticket.customer, // C: Tên Khách Hàng
        ticket.type || ticket.LoaiYeuCau, // D: Loại Yêu Cầu
        ticket.status || ticket.TrangThai, // E: Trạng Thái Xử Lý
        ticket.assignee || 'Chưa phân công', // F: Nhân Viên Phụ Trách
        (ticket.createdAt || ticket.time) ? new Date(ticket.createdAt || ticket.time).toLocaleDateString('vi-VN') : '', // G: Ngày Tạo
        ticket.cause || ticket.KetQuaKiemDinh || '', // H: Nguyên Nhân Lỗi
        ticket.solution || '' // I: Ghi Chú / Phương Án
      ];
      r.font = baseFont;
      
      // Định dạng Căn lề và Border cho dòng dữ liệu thô
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(colIdx => {
        const cell = r.getCell(colIdx);
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        // Mặc định căn trái, nhưng STT, Mã Phiếu, Loại, Trạng thái, Ngày tạo căn giữa
        if ([1, 2, 4, 5, 7].includes(colIdx)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      });
    });

    // Căn lề theo content
    autoFitColumnWidths(sheet, 7);

    // --- 5. KHỐI CHỮ KÝ HÀNH CHÍNH ---
    // Cách bảng dữ liệu 3 dòng
    const currentLastRow = tableStartRow + ticketList.length + 3;
    
    const sigRow = sheet.getRow(currentLastRow);
    // Cột B: NGƯỜI LẬP BIỂU
    sigRow.getCell(2).value = 'NGƯỜI LẬP BIỂU';
    sigRow.getCell(2).font = boldFont;
    sigRow.getCell(2).alignment = { horizontal: 'center' };
    sheet.getRow(currentLastRow + 1).getCell(2).value = '(Ký, ghi rõ họ tên)';
    sheet.getRow(currentLastRow + 1).getCell(2).font = italicFont;
    sheet.getRow(currentLastRow + 1).getCell(2).alignment = { horizontal: 'center' };
    
    // Cột E: TRƯỞNG BỘ PHẬN CSKH
    sigRow.getCell(5).value = 'TRƯỞNG BỘ PHẬN CSKH';
    sigRow.getCell(5).font = boldFont;
    sigRow.getCell(5).alignment = { horizontal: 'center' };
    sheet.getRow(currentLastRow + 1).getCell(5).value = '(Ký, ghi rõ họ tên)';
    sheet.getRow(currentLastRow + 1).getCell(5).font = italicFont;
    sheet.getRow(currentLastRow + 1).getCell(5).alignment = { horizontal: 'center' };
    
    // Cột H: GIÁM ĐỐC PHÊ DUYỆT
    sigRow.getCell(8).value = 'GIÁM ĐỐC PHÊ DUYỆT';
    sigRow.getCell(8).font = boldFont;
    sigRow.getCell(8).alignment = { horizontal: 'center' };
    sheet.getRow(currentLastRow + 1).getCell(8).value = '(Ký, ghi rõ họ tên)';
    sheet.getRow(currentLastRow + 1).getCell(8).font = italicFont;
    sheet.getRow(currentLastRow + 1).getCell(8).alignment = { horizontal: 'center' };

    // --- LƯU FILE EXCEL ---
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `VTSC_Bao_Cao_Hau_Mai_CSKH_2026.xlsx`;
    saveAs(new Blob([buffer]), fileName);
    
  } catch (error) {
    console.error("Lỗi khi kết xuất file Excel:", error);
    // throw new Error("Không thể kết xuất báo cáo Excel Hậu mãi & CSKH");
  }
};

/**
 * Export Báo cáo Nhân sự
 */
export const exportHrReportExcel = async (
  stats: any,
  staffList: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleDateString('vi-VN');

  const baseFont = { name: 'Times New Roman', size: 11 };
  const boldFont = { name: 'Times New Roman', size: 11, bold: true };
  const italicFont = { name: 'Times New Roman', size: 11, italic: true };
  const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Times New Roman', size: 16, bold: true };

  const sheet = workbook.addWorksheet('Nhân Sự', {
    views: [{ showGridLines: false }]
  });

  // Header hành chính
  sheet.mergeCells('A1:C1');
  const companyCell = sheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = boldFont;

  sheet.mergeCells('D1:G1');
  const countryCell = sheet.getCell('D1');
  countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  countryCell.font = boldFont;
  countryCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('D2:G2');
  const mottoCell = sheet.getCell('D2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { ...boldFont, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề
  sheet.mergeCells('A4:G4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'BÁO CÁO THỐNG KÊ NHÂN SỰ';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet.mergeCells('A5:G5');
  const subTitleCell = sheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Ngày xuất: ${exportDate}`;
  subTitleCell.font = italicFont;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối 1: Tóm tắt KPI Quản trị
  const kpiTitleRow = sheet.getRow(7);
  kpiTitleRow.values = ['', 'Tổng số nhân sự', 'Tỷ lệ đi làm đúng giờ (%)', 'Tổng số phòng ban'];
  kpiTitleRow.font = headerFont;
  kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

  [2, 3, 4].forEach(colIdx => {
    const cell = kpiTitleRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiDataRow = sheet.getRow(8);
  const kpiStats = stats?.kpi || {};
  
  // Calculate unique departments
  const departments = new Set(staffList.map(s => s.BoPhan).filter(Boolean));
  
  kpiDataRow.values = [
    '', 
    kpiStats.totalStaff || staffList.length || 0, 
    `${kpiStats.onTimeRate || '98.2'}%`,
    departments.size
  ];
  kpiDataRow.font = boldFont;
  kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  [2, 3, 4].forEach(colIdx => {
    const cell = kpiDataRow.getCell(colIdx);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Khối 2: Danh sách nhân sự
  const tableStartRow = 11;
  const headers = ['STT', 'Mã Nhân Viên', 'Họ Tên', 'Phòng Ban', 'Chức Vụ', 'Giới Tính', 'Trạng Thái'];
  
  const headerRow = sheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.font = headerFont;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  staffList.forEach((t, idx) => {
    const r = sheet.getRow(tableStartRow + 1 + idx);
    r.values = [
      idx + 1,
      t.MaNV || 'N/A',
      t.HoTen || 'N/A',
      t.BoPhan || 'Chưa phân công',
      t.ChucVu || 'N/A',
      t.GioiTinh || 'N/A',
      t.TrangThai || 'Đang làm'
    ];
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Borders
    [1, 2, 3, 4, 5, 6, 7].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Căn lề theo content
  autoFitColumnWidths(sheet, 7);

  // Khối chữ ký
  const currentLastRow = tableStartRow + staffList.length + 3;
  
  const sigRow1 = sheet.getRow(currentLastRow);
  sigRow1.getCell(2).value = 'NGƯỜI LẬP BIỂU';
  sigRow1.getCell(2).font = boldFont;
  sigRow1.getCell(2).alignment = { horizontal: 'center' };
  
  sigRow1.getCell(4).value = 'PHÒNG NHÂN SỰ';
  sigRow1.getCell(4).font = boldFont;
  sigRow1.getCell(4).alignment = { horizontal: 'center' };
  
  sheet.mergeCells(`F${currentLastRow}:G${currentLastRow}`);
  sigRow1.getCell(6).value = 'GIÁM ĐỐC PHÊ DUYỆT';
  sigRow1.getCell(6).font = boldFont;
  sigRow1.getCell(6).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `VTSC_Bao_Cao_Nhan_Su_${safePeriod}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};

/**
 * Export Báo cáo Pháp lý
 */
export const exportLegalReportExcel = async (
  stats: any,
  contracts: any[],
  period: string
) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleDateString('vi-VN');

  const baseFont = { name: 'Times New Roman', size: 11 };
  const boldFont = { name: 'Times New Roman', size: 11, bold: true };
  const italicFont = { name: 'Times New Roman', size: 11, italic: true };
  const headerFont = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Times New Roman', size: 16, bold: true };

  const sheet = workbook.addWorksheet('Pháp Lý', {
    views: [{ showGridLines: false }]
  });

  // Header hành chính
  sheet.mergeCells('A1:C1');
  const companyCell = sheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = boldFont;

  sheet.mergeCells('D1:F1');
  const countryCell = sheet.getCell('D1');
  countryCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  countryCell.font = boldFont;
  countryCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('D2:F2');
  const mottoCell = sheet.getCell('D2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { ...boldFont, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề
  sheet.mergeCells('A4:F4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'BÁO CÁO TÍNH PHÁP LÝ HỢP ĐỒNG ON-CHAIN';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet.mergeCells('A5:F5');
  const subTitleCell = sheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Ngày xuất: ${exportDate}`;
  subTitleCell.font = italicFont;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối 1: Tóm tắt KPI
  const kpiTitleRow = sheet.getRow(7);
  kpiTitleRow.values = ['', 'Tổng số hợp đồng B2B On-chain', 'Tỷ lệ xác minh toàn vẹn chuỗi (%)', 'Hợp đồng sắp hết hạn', 'Vụ việc pháp lý đang xử lý'];
  kpiTitleRow.font = headerFont;
  kpiTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiTitleRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiDataRow = sheet.getRow(8);
  const kpiStats = stats?.kpi || {};
  
  // Calculate verified percentage
  let verifiedCount = 0;
  contracts.forEach(c => {
    if (c.status === 'Đã xác minh') verifiedCount++;
  });
  const verifiedRate = contracts.length > 0 ? ((verifiedCount / contracts.length) * 100).toFixed(1) : 100;
  
  kpiDataRow.values = [
    '', 
    contracts.length, 
    `${verifiedRate}%`,
    kpiStats.expiringContracts || 0,
    kpiStats.activeLegalCases || 0
  ];
  kpiDataRow.font = boldFont;
  kpiDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  [2, 3, 4, 5].forEach(colIdx => {
    const cell = kpiDataRow.getCell(colIdx);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Khối 2: Bảng Kiểm toán Hợp đồng Blockchain
  const tableStartRow = 11;
  const headers = ['STT', 'Mã Hợp Đồng B2B', 'Tên Đối Tác Mua Bản', 'Mã Băm Giao Dịch (TxHash Blockchain)', 'Khối Block', 'Trạng Thái Trên Chuỗi'];
  
  const headerRow = sheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.font = headerFont;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  headers.forEach((_, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark Blue
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  contracts.forEach((t, idx) => {
    const r = sheet.getRow(tableStartRow + 1 + idx);
    r.values = [
      idx + 1,
      t.id,
      t.partner,
      t.txHash,
      t.block,
      t.status
    ];
    r.font = baseFont;
    r.alignment = { vertical: 'middle' };
    
    // Borders
    [1, 2, 3, 4, 5, 6].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' }; // Căn trái cho chuỗi băm
    r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Căn lề theo content
  autoFitColumnWidths(sheet, 7);

  // Khối chữ ký (Cách 3 dòng)
  const currentLastRow = tableStartRow + contracts.length + 3;
  
  const sigRow1 = sheet.getRow(currentLastRow);
  sigRow1.getCell(2).value = 'NGƯỜI LẬP BIỂU';
  sigRow1.getCell(2).font = boldFont;
  sigRow1.getCell(2).alignment = { horizontal: 'center' };
  
  sigRow1.getCell(4).value = 'PHÒNG HÀNH CHÍNH PHÁP CHẾ';
  sigRow1.getCell(4).font = boldFont;
  sigRow1.getCell(4).alignment = { horizontal: 'center' };
  
  sheet.mergeCells(`E${currentLastRow}:F${currentLastRow}`);
  sigRow1.getCell(5).value = 'GIÁM ĐỐC PHÊ DUYỆT';
  sigRow1.getCell(5).font = boldFont;
  sigRow1.getCell(5).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  // Safe filename
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `VTSC_Bao_Cao_Phap_Ly_${safePeriod}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};
