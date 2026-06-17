const mongoose = require('mongoose');
const KhuyenMai = require('./backend/src/models/KhuyenMai');

mongoose.connect('mongodb://127.0.0.1:27017/VTSC_DB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const v = await KhuyenMai.findOne({ MaKhuyenMai: 'PORTUGAL' });
    console.log(v);
    if (v) {
        console.log("Length:", v.DanhSachApDung?.length);
        console.log("SoLuongToiDa:", v.SoLuongToiDa);
        console.log("Condition:", v.DanhSachApDung && v.SoLuongToiDa && v.DanhSachApDung.length >= v.SoLuongToiDa);
    }
    process.exit(0);
  });
