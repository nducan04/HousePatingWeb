const exceljs = require('exceljs');

async function run() {
  const workbook = new exceljs.Workbook();
  const sheet = workbook.addWorksheet('Danh Sach');

  const logoId = workbook.addImage({
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    extension: 'png',
  });
  sheet.addImage(logoId, {
    tl: { col: 0.1, row: 0.1 },
    ext: { width: 220, height: 170 }
  });

  sheet.addRow([]); // Row 1
  sheet.addRow([]); // Row 2
  const row3 = sheet.addRow([null, null, 'Công ty']); // Row 3
  sheet.addRow([]); // Row 4
  sheet.addRow([]); // Row 5
  
  const row6 = sheet.addRow(['BÁO CÁO THỐNG KÊ KHÁCH HÀNG']); // Row 6
  sheet.mergeCells('A6:F6');
  
  console.log('Row 6 cell A6 value:', sheet.getCell('A6').value);
  console.log('Row 7 cell A7 value:', sheet.getCell('A7').value);
  console.log('Total rows:', sheet.rowCount);
  await workbook.xlsx.writeFile('test.xlsx');
}

run();
