const mongoose = require('mongoose');
const KhachHang = require('./src/models/KhachHang');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const khs = await KhachHang.find({});
  console.log(JSON.stringify(khs, null, 2));
  process.exit(0);
};

check();
