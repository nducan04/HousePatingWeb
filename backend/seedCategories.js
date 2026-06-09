const mongoose = require('mongoose');
const DanhMucSon = require('./src/models/DanhMucSon');

const seedData = async () => {
  try {
    require('dotenv').config();
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtsc_db';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const categories = [
      { TenDanhMuc: 'Sơn tĩnh điện', MoTa: 'Sơn dạng bột khô, chuyên dùng cho kim loại', TrangThai: true },
      { TenDanhMuc: 'Sơn tàu biển', MoTa: 'Sơn chịu môi trường biển, chống rỉ sét và hà bám', TrangThai: true },
      { TenDanhMuc: 'Sơn công nghiệp', MoTa: 'Sơn bảo vệ kết cấu thép, nhà xưởng', TrangThai: true },
      { TenDanhMuc: 'Sơn nội thất', MoTa: 'Sơn dùng trong nhà, thân thiện môi trường', TrangThai: true },
    ];

    for (const cat of categories) {
      await DanhMucSon.findOneAndUpdate(
        { TenDanhMuc: cat.TenDanhMuc },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log('Seed categories successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedData();
