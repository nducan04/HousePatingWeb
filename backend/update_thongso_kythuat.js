const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0')
  .then(async () => {
    console.log('Connected to DB');
    const SP = require('./src/models/SanPhamSon');
    
    const products = await SP.find({});
    let updatedCount = 0;
    
    for (let p of products) {
      let isModified = false;
      if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
        for (let m of p.DanhSachMaMau) {
          if (!m.ThongSoKyThuat || !m.ThongSoKyThuat.DanhMuc) {
            m.ThongSoKyThuat = {
              DanhMuc: m.TenMau.includes('Metallic') || m.TenMau.includes('Titanium') ? 'Metallic' : 'Tiêu chuẩn',
              DoBong: '25% Super Matt',
              BeMat: 'Nhôm, Sắt mạ kẽm',
              UngDung: 'Kiến trúc hiện đại, Nội ngoại thất',
              DoPhuLyThuyet: '8 - 10 m²/kg',
              QuyCachDongGoi: 'Thùng 20kg',
              QuyTrinhPhaChe: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)'
            };
            isModified = true;
          }
        }
      }
      if (isModified) {
        await SP.findOneAndUpdate(
          { _id: p._id },
          { $set: { DanhSachMaMau: p.DanhSachMaMau } }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} products with ThongSoKyThuat!`);
    process.exit(0);
  })
  .catch(console.error);
