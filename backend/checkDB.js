require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const SanPhamSon = require('./src/models/SanPhamSon');
    const products = await SanPhamSon.find({ ThuongHieu: 'AkzoNobel' });
    console.log('Total products:', products.length);
    products.forEach(p => {
      console.log(`- [${p.MaSanPham}] ${p.TenDongSon} (Thương hiệu: ${p.ThuongHieu})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
