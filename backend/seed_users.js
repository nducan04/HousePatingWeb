const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TaiKhoan = require('./src/models/TaiKhoan');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const users = [
      {
        TenDangNhap: 'nv_test01',
        MatKhau: '123456',
        Email: 'nv_test01@vtsc.vn',
        VaiTro: 'NhanVien'
      },
      {
        TenDangNhap: 'b2b_test01',
        MatKhau: '123456',
        Email: 'b2b_test01@vtsc.vn',
        VaiTro: 'KhachHangB2B'
      },
      {
        TenDangNhap: 'b2c_test01',
        MatKhau: '123456',
        Email: 'b2c_test01@vtsc.vn',
        VaiTro: 'KhachHangB2C'
      }
    ];

    for (const user of users) {
      const exists = await TaiKhoan.findOne({ 
        $or: [
          { TenDangNhap: user.TenDangNhap },
          { Email: user.Email }
        ]
      });
      
      if (!exists) {
        await TaiKhoan.create(user);
        console.log(`Successfully created: ${user.TenDangNhap} (${user.VaiTro})`);
      } else {
        console.log(`User or Email already exists: ${user.TenDangNhap}`);
      }
    }

    console.log('--- DONE ---');
    process.exit();
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers();
