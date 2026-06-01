const mongoose = require('mongoose'); 
mongoose.connect('mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0').then(async () => { 
  const SP = require('./src/models/SanPhamSon'); 
  await SP.findOneAndUpdate({MaSanPham: 'SP3121'}, {'$set': {'DanhSachMaMau.0.HexCode': '#F2F0EB'}}); 
  console.log('Updated DB'); 
  process.exit(0); 
});
