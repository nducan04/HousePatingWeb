const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const KhachHang = require('../models/KhachHang');
const SanPhamSon = require('../models/SanPhamSon');
const SalesTarget = require('../models/SalesTarget');

const importFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file để upload.' });
    }

    const { collection } = req.body;
    if (!['customers', 'products', 'targets'].includes(collection)) {
       if (req.file) fs.unlinkSync(req.file.path);
       return res.status(400).json({ success: false, error: 'Collection không hợp lệ.' });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    let rawData = [];

    // Đọc file
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    } else if (fileExt === 'csv') {
      rawData = await new Promise((resolve, reject) => {
         const results = [];
         fs.createReadStream(filePath)
           .pipe(csv())
           .on('data', (data) => results.push(data))
           .on('end', () => resolve(results))
           .on('error', reject);
      });
    }

    let insertedCount = 0;
    let errors = [];

    // Xử lý Import Khách Hàng
    if (collection === 'customers') {
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const maKH = row['Mã KH'] || row.MaKH;
          if (!maKH) { errors.push(`Dòng ${i+2}: Thiếu Mã KH`); continue; }
          
          const khData = {
            MaKH: maKH,
            PhanLoai: row['Phân loại'] || row.PhanLoai || 'B2C',
            TenKhachHang: row['Tên KH'] || row.TenKhachHang || 'Chưa cập nhật',
            Email: row['Email'] || '',
            SDT: row['SĐT'] || row.SDT || '',
            DiaChi: row['Địa chỉ'] || row.DiaChi || ''
          };

          await KhachHang.findOneAndUpdate({ MaKH: maKH }, khData, { upsert: true });
          insertedCount++;
        } catch (err) { errors.push(`Dòng ${i+2}: ${err.message}`); }
      }
    } 
    // Xử lý Import Sản Phẩm Sơn
    else if (collection === 'products') {
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const maSP = row['Mã SP'] || row.MaSanPham;
          if (!maSP) { errors.push(`Dòng ${i+2}: Thiếu Mã Sản Phẩm`); continue; }

          const spData = {
            MaSanPham: maSP,
            TenDongSon: row['Tên Dòng Sơn'] || row.TenDongSon || 'Chưa cập nhật',
            ThuongHieu: row['Thương Hiệu'] || row.ThuongHieu || 'AkzoNobel',
            PhanLoai: row['Phân Loại'] || row.PhanLoai || 'Sơn tĩnh điện',
            DonGiaCoSo: Number(row['Đơn Giá'] || row.DonGiaCoSo) || 0
          };

          await SanPhamSon.findOneAndUpdate({ MaSanPham: maSP }, spData, { upsert: true });
          insertedCount++;
        } catch (err) { errors.push(`Dòng ${i+2}: ${err.message}`); }
      }
    }
    // Xử lý Import Target
    else if (collection === 'targets') {
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const maKH = row['Mã KH'] || row.MaKH;
          if (!maKH) { errors.push(`Dòng ${i+2}: Thiếu Mã KH`); continue; }

          const khachHang = await KhachHang.findOne({ MaKH: maKH });
          if (!khachHang) { errors.push(`Dòng ${i+2}: Không tìm thấy Khách hàng ${maKH} trong DB`); continue; }

          const targetData = {
            customer: khachHang._id,
            period: { month: Number(row['Tháng'] || row.month), year: Number(row['Năm'] || row.year) },
            targetKg: Number(row['Target (Kg)'] || row.targetKg) || 0,
            targetRevenue: Number(row['Target Doanh Thu'] || row.targetRevenue) || 0
          };

          await SalesTarget.findOneAndUpdate(
            { customer: khachHang._id, 'period.month': targetData.period.month, 'period.year': targetData.period.year },
            targetData,
            { upsert: true }
          );
          insertedCount++;
        } catch (err) { errors.push(`Dòng ${i+2}: ${err.message}`); }
      }
    }

    fs.unlinkSync(filePath);
    res.status(200).json({
      success: true,
      data: { totalProcessed: rawData.length, insertedCount, errorCount: errors.length, errors: errors.slice(0, 10) }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('File Import Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi server khi xử lý file.' });
  }
};

module.exports = { importFile };
