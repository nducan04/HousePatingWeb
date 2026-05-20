import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
    [2, 'Tổng sản lượng xuất bán', totalProduction, 'KG (Kilogram)', 'Sản lượng phân phối qua các kho hàng'],
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

  // Thiết lập độ rộng cột cho sheet 1
  sheet1.getColumn(1).width = 8;
  sheet1.getColumn(2).width = 30;
  sheet1.getColumn(3).width = 20;
  sheet1.getColumn(4).width = 15;
  sheet1.getColumn(5).width = 40;

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

  sheet2.getColumn(1).width = 10;
  sheet2.getColumn(2).width = 35;
  sheet2.getColumn(3).width = 25;

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

  sheet3.getColumn(1).width = 10;
  sheet3.getColumn(2).width = 35;
  sheet3.getColumn(3).width = 15;
  sheet3.getColumn(4).width = 25;
  sheet3.getColumn(5).width = 25;
  sheet3.getColumn(6).width = 22;
  sheet3.getColumn(7).width = 20;

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
