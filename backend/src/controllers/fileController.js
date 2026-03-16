const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SalesTarget = require('../models/SalesTarget');

const importFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file để upload.' });
    }

    const { collection } = req.body;
    if (!['customers', 'products', 'targets'].includes(collection)) {
       // Cleanup uploaded file
       if (req.file) fs.unlinkSync(req.file.path);
       return res.status(400).json({ success: false, error: 'Collection không hợp lệ. Chỉ hỗ trợ customers, products, targets.' });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    let rawData = [];

    // Parse data based on file type
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    } else if (fileExt === 'csv') {
      rawData = await new Promise((resolve, reject) => {
         const results = [];
         fs.createReadStream(filePath)
           .pipe(csv())
           .on('data', (data) => results.push(data))
           .on('end', () => resolve(results))
           .on('error', (err) => reject(err));
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, error: 'Chỉ hỗ trợ file .xlsx, .xls, và .csv' });
    }

    // Process data based on collection type
    let insertedCount = 0;
    let errors = [];

    if (collection === 'customers') {
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        try {
          // Map excel columns to Mongoose schema
          // Expecting: companyName, code, type, contactPerson, email, phone, address
          const customerData = {
             code: row.code || row['Mã KH'] || `CUST-${Date.now()}-${i}`,
             companyName: row.companyName || row['Tên Công Ty'],
             type: row.type || row['Loại KH'] === 'B2B (Project)' ? 'B2B (Project)' : 'B2B (MOQ 200kg)',
             contactPerson: row.contactPerson || row['Người Đại Diện'] || '',
             email: row.email || row['Email'] || '',
             phone: row.phone || row['Số Điện Thoại'] || '',
             address: row.address || row['Địa Chỉ'] || '',
          };
          if (!customerData.companyName) {
            errors.push(`Dòng ${i+2}: Thiếu Tên Công Ty`);
            continue;
          }
          await Customer.findOneAndUpdate(
            { code: customerData.code }, 
            customerData, 
            { upsert: true, runValidators: true }
          );
          insertedCount++;
        } catch (err) {
          errors.push(`Dòng ${i+2}: ${err.message}`);
        }
      }
    } 
    else if (collection === 'products') {
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            try {
              // Map excel columns to Product schema
              // Expecting: sku, name, series, colorCode, price, category
              const productData = {
                 sku: row.sku || row['Mã Hàng'],
                 name: row.name || row['Tên Sản Phẩm'],
                 series: row.series || row['Dòng Sản Phẩm'] || 'Khác',
                 colorCode: row.colorCode || row['Mã Màu'] || '',
                 price: parseFloat(row.price || row['Giá (VNĐ)']) || 0,
                 category: row.category || row['Danh Mục'] || 'Bột tĩnh điện',
              };
              if (!productData.sku || !productData.name) {
                errors.push(`Dòng ${i+2}: Thiếu Mã Hàng hoặc Tên Sản Phẩm`);
                continue;
              }
              await Product.findOneAndUpdate(
                { sku: productData.sku }, 
                productData, 
                { upsert: true }
              );
              insertedCount++;
            } catch (err) {
              errors.push(`Dòng ${i+2}: ${err.message}`);
            }
          }
    }
    else if (collection === 'targets') {
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            try {
              // Map excel columns to Sales Target schema
              // Expecting: customerCode, year, month, targetAmount, actualAmount, isKeyAccount
              const targetData = {
                 customer: null, // Will attempt to resolve via code
                 year: parseInt(row.year || row['Năm']) || new Date().getFullYear(),
                 month: parseInt(row.month || row['Tháng']) || new Date().getMonth() + 1,
                 targetAmount: parseFloat(row.targetAmount || row['Mục Tiêu (kg)']) || 0,
                 actualAmount: parseFloat(row.actualAmount || row['Thực Tế (kg)']) || 0,
                 isKeyAccount: (row.isKeyAccount || row['Khách Hàng Lớn']) === 'Yes' ? true : false,
              };
              
              const code = row.customerCode || row['Mã KH'];
              if (!code) {
                  errors.push(`Dòng ${i+2}: Thiếu Mã KH`);
                  continue;
              }
              
              const customer = await Customer.findOne({ code });
              if (!customer) {
                  errors.push(`Dòng ${i+2}: Không tìm thấy khách hàng mã ${code}`);
                  continue;
              }
              
              targetData.customer = customer._id;

              await SalesTarget.findOneAndUpdate(
                { customer: customer._id, year: targetData.year, month: targetData.month }, 
                targetData, 
                { upsert: true }
              );
              insertedCount++;
            } catch (err) {
              errors.push(`Dòng ${i+2}: ${err.message}`);
            }
          }
    }

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: rawData.length,
        insertedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Limit error messages to front end
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('File Import Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi server khi upload/xử lý file.' });
  }
};

module.exports = {
  importFile
};
