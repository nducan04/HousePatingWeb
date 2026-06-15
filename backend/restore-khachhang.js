const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KhachHang = require('./src/models/KhachHang');
const TaiKhoan = require('./src/models/TaiKhoan'); // Ensure this exists

dotenv.config({ path: './.env' });

const restoreCustomersFromAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find all TaiKhoan with customer roles
    const accounts = await TaiKhoan.find({
      Role: { $in: ['B2C', 'B2B', 'Đại lý'] }
    });

    console.log(`Found ${accounts.length} customer accounts.`);

    let restoredCount = 0;

    for (let acc of accounts) {
      // Check if KhachHang already exists
      const existing = await KhachHang.findOne({ AccountID: acc._id });
      if (!existing) {
        // Create KhachHang profile
        const newKh = new KhachHang({
          AccountID: acc._id,
          MaKH: `KH-${acc._id.toString().slice(-6).toUpperCase()}`,
          PhanLoai: acc.Role, // 'B2C', 'B2B', 'Đại lý'
          TenKhachHang: acc.Username || acc.Email.split('@')[0] || "Khách hàng",
          Email: acc.Email,
          SDT: "0900000000",
          DiaChi: "Chưa cập nhật",
          // Give B2B required fields
          MaSoThue: acc.Role === 'B2B' ? "0123456789" : undefined,
        });

        await newKh.save();
        restoredCount++;
      }
    }

    console.log(`Successfully restored ${restoredCount} KhachHang profiles from TaiKhoan.`);
    process.exit(0);
  } catch (error) {
    console.error('Error restoring:', error);
    process.exit(1);
  }
};

restoreCustomersFromAccounts();
