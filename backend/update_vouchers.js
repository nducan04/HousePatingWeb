const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0')
  .then(async () => {
    const db = mongoose.connection.db;
    const res = await db.collection('khuyenmais').updateMany(
      {},
      { $set: { TrangThai: 'DANG_DIEN_RA', NgayHetHan: new Date('2027-12-31T00:00:00Z') } }
    );
    console.log(`Updated ${res.modifiedCount} vouchers.`);
    process.exit(0);
  })
  .catch(console.error);
