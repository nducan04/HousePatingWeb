const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DonHang = require('./src/models/DonHang');
const HopDong = require('./src/models/HopDong');
const LenhSanXuat = require('./src/models/LenhSanXuat');
const ProductionTarget = require('./src/models/ProductionTarget');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/house_painting');
    console.log('Connected to MongoDB');

    // 1. DonHang
    const donHangs = await DonHang.find({});
    let dhCount = 0;
    for (let dh of donHangs) {
      let changed = false;
      if (dh.Items && dh.Items.length > 0) {
        for (let item of dh.Items) {
          // Check if value is suspiciously large (likely kg). 
          // Since we previously generated fake data in thousands, we divide if > 20.
          // But to be safe, just blindly apply the 1 Thùng = 20Kg rule for this migration
          item.SoLuong = Math.round(item.SoLuong / 20) || 1;
          changed = true;
        }
      }
      if (changed) {
        await dh.save();
        dhCount++;
      }
    }
    console.log(`Updated ${dhCount} DonHang`);

    // 2. HopDong
    const hopDongs = await HopDong.find({});
    let hdCount = 0;
    for (let hd of hopDongs) {
      let changed = false;
      if (hd.ChiTietHopDong && hd.ChiTietHopDong.length > 0) {
        for (let item of hd.ChiTietHopDong) {
          item.quantity = Math.round(item.quantity / 20) || 1;
          changed = true;
        }
      }
      if (changed) {
        await hd.save();
        hdCount++;
      }
    }
    console.log(`Updated ${hdCount} HopDong`);

    // 3. LenhSanXuat
    const lenhs = await LenhSanXuat.find({});
    let lsxCount = 0;
    for (let lsx of lenhs) {
      if (lsx.TargetWeight) {
        lsx.TargetWeight = Math.round(lsx.TargetWeight / 20) || 1;
        await lsx.save();
        lsxCount++;
      }
    }
    console.log(`Updated ${lsxCount} LenhSanXuat`);

    // 4. ProductionTarget
    const targets = await ProductionTarget.find({});
    let ptCount = 0;
    for (let t of targets) {
      if (t.targetAmount) {
        t.targetAmount = Math.round(t.targetAmount / 20) || 1;
        await t.save();
        ptCount++;
      }
    }
    console.log(`Updated ${ptCount} ProductionTarget`);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

run();
