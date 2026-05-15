const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TaiKhoan = require('./src/models/TaiKhoan');

dotenv.config();

const seedDirector = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = {
      TenDangNhap: 'director01',
      MatKhau: '123456',
      Email: 'director01@vtsc.vn',
      VaiTro: 'Director'
    };

    const exists = await TaiKhoan.findOne({ TenDangNhap: user.TenDangNhap });
    if (!exists) {
      await TaiKhoan.create(user);
      console.log('Successfully created Director account');
    } else {
      console.log('Director account already exists');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDirector();
