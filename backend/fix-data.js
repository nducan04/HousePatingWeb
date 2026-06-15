const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KhachHang = require('./src/models/KhachHang');
const TaiKhoan = require('./src/models/TaiKhoan');
const DonHang = require('./src/models/DonHang');
const HopDong = require('./src/models/HopDong');

dotenv.config({ path: './.env' });

const fixData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Clear the messed up KhachHang collection
    await KhachHang.deleteMany({});
    console.log('Cleared KhachHang collection.');

    // 2. Fetch customer accounts
    const accounts = await TaiKhoan.find({
      VaiTro: { $in: ['KhachHangB2B', 'KhachHangB2C'] }
    });
    console.log(`Found ${accounts.length} customer accounts.`);

    let khachHangs = [];

    // 3. Recreate KhachHang documents correctly linked to AccountID
    for (let acc of accounts) {
      const isB2B = acc.VaiTro === 'KhachHangB2B';
      const kh = new KhachHang({
        AccountID: acc._id,
        MaKH: `KH-${acc._id.toString().slice(-6).toUpperCase()}`,
        PhanLoai: isB2B ? 'B2B' : 'B2C',
        TenKhachHang: acc.TenDangNhap || acc.Email.split('@')[0],
        Email: acc.Email,
        SDT: "0900000000",
        DiaChi: "Việt Nam",
        MaSoThue: isB2B ? "0123456789" : undefined,
      });

      await kh.save();
      khachHangs.push(kh);
    }
    console.log(`Recreated ${khachHangs.length} KhachHang documents.`);

    // 4. Fix orphaned DonHang and HopDong
    if (khachHangs.length > 0) {
      const b2cCustomer = khachHangs.find(k => k.PhanLoai === 'B2C') || khachHangs[0];
      const b2bCustomer = khachHangs.find(k => k.PhanLoai === 'B2B') || khachHangs[0];

      // Assign all orphaned DonHangs to the first B2C customer (or B2B if B2C not found)
      const donHangResult = await DonHang.updateMany(
        {},
        { $set: { KhachHang: b2cCustomer._id } }
      );
      console.log(`Fixed ${donHangResult.modifiedCount} DonHang documents to point to ${b2cCustomer.TenKhachHang}`);

      // Assign all orphaned HopDongs to the first B2B customer
      const hopDongResult = await HopDong.updateMany(
        {},
        { $set: { KhachHang: b2bCustomer._id } }
      );
      console.log(`Fixed ${hopDongResult.modifiedCount} HopDong documents to point to ${b2bCustomer.TenKhachHang}`);
    }

    console.log('Khôi phục dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing data:', error);
    process.exit(1);
  }
};

fixData();
