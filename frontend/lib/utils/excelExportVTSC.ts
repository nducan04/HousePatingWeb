import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface SummaryData {
  label: string;
  value: string | number;
}

interface ExportExcelOptions {
  filename: string;
  title: string;
  headers: string[];
  data: any[][];
  summaryData?: SummaryData[];
  totals?: any[];
}

export const exportToExcelVTSC = async ({
  filename,
  title,
  headers,
  data,
  summaryData,
  totals,
}: ExportExcelOptions) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Báo cáo", {
    views: [{ showGridLines: false }],
  });

  // Try to load VTSC logo from public folder
  let logoId: number | null = null;
  try {
    const res = await fetch("/vtsc.png");
    if (res.ok) {
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      logoId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });
    }
  } catch (e) {
    console.warn("Could not load logo for Excel export", e);
  }

  // Add VTSC Logo (top left)
  if (logoId !== null) {
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 80 },
    });
  }

  // Add Company info (top right)
  worksheet.mergeCells("E1", "H1");
  worksheet.getCell("E1").value = "Công ty Cổ phần Thương mại và Dịch vụ VOSCO";
  worksheet.getCell("E1").font = { bold: true, size: 12 };

  worksheet.mergeCells("E2", "H2");
  worksheet.getCell("E2").value = "Vosco Trading And Service Joint Stock Company (VTSC)";
  worksheet.getCell("E2").font = { bold: true, size: 11 };

  worksheet.mergeCells("E3", "H3");
  worksheet.getCell("E3").value = "Địa chỉ: 215 Lạch Tray, P. Gia Viên, Tp. Hải Phòng";
  
  worksheet.mergeCells("E4", "H4");
  worksheet.getCell("E4").value = "ĐT: 0225 3747226";

  worksheet.mergeCells("E5", "H5");
  worksheet.getCell("E5").value = "Email: vtsc@vtschp.vn";

  // Report Title
  const titleRowOffset = 7;
  const lastColLetter = String.fromCharCode(65 + Math.max(5, headers.length - 1)); // Assuming headers won't exceed Z
  
  worksheet.mergeCells(`A${titleRowOffset}`, `${lastColLetter}${titleRowOffset}`);
  const titleCell = worksheet.getCell(`A${titleRowOffset}`);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: "Times New Roman", size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Subtitle (Date)
  const now = new Date();
  const kyBaoCao = `${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
  const ngayXuat = now.toLocaleString("vi-VN");
  
  worksheet.mergeCells(`A${titleRowOffset + 1}`, `${lastColLetter}${titleRowOffset + 1}`);
  const subtitleCell = worksheet.getCell(`A${titleRowOffset + 1}`);
  subtitleCell.value = `Kỳ báo cáo: Tháng ${kyBaoCao} - Ngày xuất: ${ngayXuat}`;
  subtitleCell.font = { name: "Times New Roman", size: 11, italic: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  let currentRow = titleRowOffset + 4;

  // Summary Table
  if (summaryData && summaryData.length > 0) {
    const summaryHeaderRow = worksheet.getRow(currentRow);
    const summaryValueRow = worksheet.getRow(currentRow + 1);

    summaryData.forEach((item, index) => {
      const colIndex = index + 1; // 1-based
      // Header
      const hCell = summaryHeaderRow.getCell(colIndex);
      hCell.value = item.label;
      hCell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Times New Roman" };
      hCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002060" } };
      hCell.alignment = { horizontal: "center", vertical: "middle" };
      hCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // Value
      const vCell = summaryValueRow.getCell(colIndex);
      vCell.value = item.value;
      vCell.font = { bold: true, name: "Times New Roman" };
      vCell.alignment = { horizontal: "center", vertical: "middle" };
      vCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      
      // Auto width for summary
      worksheet.getColumn(colIndex).width = Math.max(20, item.label.length + 5);
    });

    currentRow += 4;
  }

  // Data Table Headers
  const headerRow = worksheet.getRow(currentRow);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Times New Roman" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002060" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  
  // Set row height for headers
  headerRow.height = 25;
  currentRow++;

  // Data Rows
  data.forEach((rowData) => {
    const row = worksheet.getRow(currentRow);
    rowData.forEach((value, index) => {
      const cell = row.getCell(index + 1);
      cell.value = value;
      cell.font = { name: "Times New Roman" };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      
      // Format numbers
      if (typeof value === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
    currentRow++;
  });

  // Totals Row
  if (totals && totals.length > 0) {
    const totalRow = worksheet.getRow(currentRow);
    totals.forEach((value, index) => {
      const cell = totalRow.getCell(index + 1);
      cell.value = value;
      cell.font = { bold: true, name: "Times New Roman" };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      
      if (typeof value === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (value !== "") {
        cell.alignment = { horizontal: 'center' };
      }
    });
    currentRow++;
  }

  // Auto-fit columns for data table based on headers, data length, and totals
  headers.forEach((header, i) => {
    let maxLength = header.length;
    
    // Check data rows
    data.forEach((row) => {
      const val = row[i];
      if (val !== null && val !== undefined) {
        // format number with commas to measure correct length
        const valStr = typeof val === 'number' ? val.toLocaleString('en-US') : val.toString();
        if (valStr.length > maxLength) {
          maxLength = valStr.length;
        }
      }
    });

    // Check totals row
    if (totals && totals[i] !== null && totals[i] !== undefined) {
      const valStr = typeof totals[i] === 'number' ? totals[i].toLocaleString('en-US') : totals[i].toString();
      if (valStr.length > maxLength) {
        maxLength = valStr.length;
      }
    }
    
    // Add generous padding to account for Vietnamese characters and make columns spacious as requested
    let colWidth = Math.min(Math.max(maxLength * 1.6 + 10, 25), 80); 
    
    // For specific columns like STT, make it smaller but still reasonably wide
    if (header.toUpperCase() === "STT") {
      colWidth = 12;
    } else if (header.toLowerCase().includes("mã")) {
      colWidth = Math.max(colWidth, 25);
    } else if (header.toLowerCase().includes("tên")) {
      colWidth = Math.max(colWidth, 45);
    }

    worksheet.getColumn(i + 1).width = colWidth;
  });
  
  // Set page setup to autofit to window/page
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5, right: 0.5,
      top: 0.5, bottom: 0.5,
      header: 0.3, footer: 0.3
    }
  };
  
  // Signatures
  currentRow += 3;
  const sigCol1 = 2; // Col B
  const sigCol2 = Math.max(3, Math.floor(headers.length / 2)); // Middle
  const sigCol3 = Math.max(4, headers.length - 1); // End

  worksheet.getCell(currentRow, sigCol1).value = "NGƯỜI LẬP BIỂU";
  worksheet.getCell(currentRow, sigCol1).font = { bold: true, name: "Times New Roman" };
  worksheet.getCell(currentRow, sigCol1).alignment = { horizontal: "center" };

  worksheet.getCell(currentRow, sigCol2).value = "KẾ TOÁN TRƯỞNG";
  worksheet.getCell(currentRow, sigCol2).font = { bold: true, name: "Times New Roman" };
  worksheet.getCell(currentRow, sigCol2).alignment = { horizontal: "center" };

  worksheet.getCell(currentRow, sigCol3).value = "GIÁM ĐỐC PHÊ DUYỆT";
  worksheet.getCell(currentRow, sigCol3).font = { bold: true, name: "Times New Roman" };
  worksheet.getCell(currentRow, sigCol3).alignment = { horizontal: "center" };

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const dataBlob = new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(dataBlob, `${filename}.xlsx`);
};
