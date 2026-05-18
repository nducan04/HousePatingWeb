import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Hàm xuất báo cáo Excel chuẩn quản trị cho VTSC
 * @param data Dữ liệu từ dashboard (sales, inventory, production)
 * @param period Kỳ báo cáo (ví dụ: "Tháng 5/2026")
 */
export const exportDashboardToExcel = async (data: any, period: string) => {
  const workbook = new ExcelJS.Workbook();
  const exportDate = new Date().toLocaleDateString('vi-VN');
  
  // --- SHEET 1: BÁO CÁO TỔNG HỢP ---
  const mainSheet = workbook.addWorksheet('BÁO CÁO TỔNG HỢP', {
    views: [{ showGridLines: false }],
    pageSetup: { 
      paperSize: 9, 
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  // 1. Cấu trúc Header
  // Góc trái: Tên công ty
  mainSheet.mergeCells('A1:C1');
  const companyCell = mainSheet.getCell('A1');
  companyCell.value = 'CÔNG TY CP TMDV VOSCO (VTSC)';
  companyCell.font = { name: 'Arial', size: 11, bold: true };

  // Góc phải: Quốc hiệu
  mainSheet.mergeCells('E1:H1');
  const nationCell = mainSheet.getCell('E1');
  nationCell.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  nationCell.font = { name: 'Arial', size: 11, bold: true };
  nationCell.alignment = { horizontal: 'center' };

  mainSheet.mergeCells('E2:H2');
  const mottoCell = mainSheet.getCell('E2');
  mottoCell.value = 'Độc lập - Tự do - Hạnh phúc';
  mottoCell.font = { name: 'Arial', size: 11, bold: true, underline: true };
  mottoCell.alignment = { horizontal: 'center' };

  // Tiêu đề chính
  mainSheet.mergeCells('A4:H4');
  const titleCell = mainSheet.getCell('A4');
  titleCell.value = 'BÁO CÁO TỔNG HỢP KẾT QUẢ ĐIỀU HÀNH SỐ';
  titleCell.font = { name: 'Arial', size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Kỳ báo cáo
  mainSheet.mergeCells('A5:H5');
  const subTitleCell = mainSheet.getCell('A5');
  subTitleCell.value = `Kỳ báo cáo: ${period} - Xuất ngày: ${exportDate}`;
  subTitleCell.font = { name: 'Arial', size: 11, italic: true };
  subTitleCell.alignment = { horizontal: 'center' };

  // 2. Bảng Tóm tắt KPI (Dòng 7 - 15)
  const kpiHeader = ['STT', 'CHỈ SỐ KPI QUAN TRỌNG', 'ĐƠN VỊ', 'GIÁ TRỊ THỰC TẾ', 'KẾ HOẠCH', 'TỶ LỆ ĐẠT', 'TRẠNG THÁI'];
  const kpiRows = [
    [1, 'Tổng doanh thu (VNĐ)', 'VNĐ', data.sales?.revenue || 0, 500000000, 0, ''],
    [2, 'Tổng sản lượng xuất bán', 'Kg', data.sales?.volume || 0, 2000, 0, ''],
    [3, 'Tổng SKU đang kinh doanh', 'SKU', data.inventory?.summary?.totalSKUs || 0, '-', '-', ''],
    [4, 'Giá trị tồn kho hiện tại', 'VNĐ', data.inventory?.summary?.totalStockValue || 0, '-', '-', ''],
    [5, 'Số lượng dự án R&D', 'Dự án', data.production?.rdPerformance?.reduce((s:any, c:any)=>s+c.count, 0) || 0, 10, 0, ''],
    [6, 'Tỷ lệ đạt mẫu R&D', '%', data.production?.rdSuccessRate || 0, 80, 0, ''],
  ];

  // Tính toán tỷ lệ và trạng thái
  kpiRows.forEach(row => {
    if (typeof row[4] === 'number' && row[4] > 0) {
      const rate = Math.round((Number(row[3]) / row[4]) * 100);
      row[5] = `${rate}%`;
      row[6] = rate >= 100 ? 'HOÀN THÀNH' : 'THEO DÕI';
    }
  });

  // Vẽ Header bảng
  const startRow = 7;
  const headerRow = mainSheet.getRow(startRow);
  headerRow.values = kpiHeader;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Styling Header
  kpiHeader.forEach((_, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' } // Blue
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Thêm dữ liệu vào bảng
  kpiRows.forEach((rowData, idx) => {
    const row = mainSheet.getRow(startRow + 1 + idx);
    row.values = rowData;
    row.alignment = { vertical: 'middle' };
    
    // Format số cho cột Giá trị & Kế hoạch
    [4, 5].forEach(colIdx => {
      const cell = row.getCell(colIdx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });

    // Border cho từng cell
    rowData.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (i === 0 || i === 2) cell.alignment = { horizontal: 'center' };
    });
  });

  // Set độ rộng cột
  mainSheet.getColumn(1).width = 8;
  mainSheet.getColumn(2).width = 30;
  mainSheet.getColumn(3).width = 12;
  mainSheet.getColumn(4).width = 18;
  mainSheet.getColumn(5).width = 18;
  mainSheet.getColumn(6).width = 15;
  mainSheet.getColumn(7).width = 15;
  mainSheet.getColumn(8).width = 15;

  // 3. Footer Chữ ký
  const footerRowIdx = startRow + kpiRows.length + 5;
  
  // Khối: Người lập biểu (Merge A-B)
  mainSheet.mergeCells(`A${footerRowIdx}:B${footerRowIdx}`);
  const creatorCell = mainSheet.getCell(`A${footerRowIdx}`);
  creatorCell.value = 'NGƯỜI LẬP BIỂU';
  creatorCell.font = { bold: true };
  creatorCell.alignment = { horizontal: 'center' };

  mainSheet.mergeCells(`A${footerRowIdx + 1}:B${footerRowIdx + 1}`);
  const creatorSign = mainSheet.getCell(`A${footerRowIdx + 1}`);
  creatorSign.value = '(Ký, ghi rõ họ tên)';
  creatorSign.font = { italic: true };
  creatorSign.alignment = { horizontal: 'center' };

  // Khối: Kế toán trưởng (Merge D-F)
  mainSheet.mergeCells(`D${footerRowIdx}:F${footerRowIdx}`);
  const accountantCell = mainSheet.getCell(`D${footerRowIdx}`);
  accountantCell.value = 'KẾ TOÁN TRƯỞNG / TRƯỞNG BỘ PHẬN';
  accountantCell.font = { bold: true };
  accountantCell.alignment = { horizontal: 'center' };

  mainSheet.mergeCells(`D${footerRowIdx + 1}:F${footerRowIdx + 1}`);
  const accountantSign = mainSheet.getCell(`D${footerRowIdx + 1}`);
  accountantSign.value = '(Ký, ghi rõ họ tên)';
  accountantSign.font = { italic: true };
  accountantSign.alignment = { horizontal: 'center' };

  // Khối: Giám đốc (Merge G-H)
  mainSheet.mergeCells(`G${footerRowIdx}:H${footerRowIdx}`);
  const directorCell = mainSheet.getCell(`G${footerRowIdx}`);
  directorCell.value = 'GIÁM ĐỐC';
  directorCell.font = { bold: true };
  directorCell.alignment = { horizontal: 'center' };

  mainSheet.mergeCells(`G${footerRowIdx + 1}:H${footerRowIdx + 1}`);
  const directorSign = mainSheet.getCell(`G${footerRowIdx + 1}`);
  directorSign.value = '(Ký, ghi rõ họ tên)';
  directorSign.font = { italic: true };
  directorSign.alignment = { horizontal: 'center' };

  // --- CÁC SHEET CHI TIẾT (Data Grid) ---
  
  // Chi tiết Kinh doanh
  const salesSheet = workbook.addWorksheet('Chi tiết Kinh doanh');
  salesSheet.columns = [
    { header: 'NGÀY', key: 'date', width: 15 },
    { header: 'MÃ ĐƠN/HĐ', key: 'id', width: 20 },
    { header: 'KHÁCH HÀNG', key: 'customer', width: 30 },
    { header: 'LOẠI', key: 'type', width: 10 },
    { header: 'GIÁ TRỊ (VNĐ)', key: 'amount', width: 20 },
    { header: 'TRẠNG THÁI', key: 'status', width: 15 }
  ];
  // Thêm dữ liệu giả lập mẫu
  salesSheet.addRow(['12/05/2026', 'HĐ-VTSC-2026-001', 'CÔNG TY XD HÀ NỘI', 'B2B', 150000000, 'Đã ký']);
  salesSheet.addRow(['14/05/2026', 'ĐH-88219', 'Nguyễn Văn An', 'B2C', 12500000, 'Hoàn tất']);
  salesSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Chi tiết Kho vận
  const invSheet = workbook.addWorksheet('Chi tiết Kho vận');
  invSheet.columns = [
    { header: 'MÃ SKU', key: 'sku', width: 15 },
    { header: 'TÊN SẢN PHẨM', key: 'name', width: 40 },
    { header: 'PHÂN LOẠI', key: 'cat', width: 20 },
    { header: 'TỒN KHO (KG)', key: 'stock', width: 15 },
    { header: 'ĐƠN GIÁ', key: 'price', width: 15 }
  ];
  invSheet.addRow(['VTSC-SNT-01', 'Sơn nội thất cao cấp - Trắng nhám', 'Sơn nội thất', 872, 1250000]);
  invSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Chi tiết R&D
  const rdSheet = workbook.addWorksheet('Chi tiết R&D');
  rdSheet.columns = [
    { header: 'MÃ DỰ ÁN', key: 'id', width: 15 },
    { header: 'TÊN MẪU TEST', key: 'name', width: 35 },
    { header: 'TRẠNG THÁI', key: 'status', width: 15 },
    { header: 'NGÀY BẮT ĐẦU', key: 'start', width: 15 },
    { header: 'KẾT QUẢ', key: 'result', width: 15 }
  ];
  rdSheet.addRow(['RD-2026-005', 'Sơn chịu nhiệt công nghiệp v2', 'completed', '05/05/2026', 'ĐẠT']);
  rdSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // --- FINALIZING ---
  // Format tất cả các sheet: Font Arial
  workbook.eachSheet(sheet => {
    sheet.getRows(1, sheet.rowCount)?.forEach(row => {
      row.font = { name: 'Arial', size: 11 };
    });
    // Format currency cho các cột tiền
    sheet.columns.forEach(col => {
      if (col.header?.toString().includes('VNĐ')) {
        col.numFmt = '#,##0';
      }
    });
  });

  // Tải file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Bao_Cao_Dieu_Hanh_VTSC_${period.replace(/\//g, '_')}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};
