const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SanPhamSon = require('../models/SanPhamSon');
const connectDB = require('../utils/db');

dotenv.config();

const updateInventory = async () => {
  try {
    await connectDB();
    console.log('Đang kết nối database và cân bằng tồn kho các sản phẩm về đúng 500...');

    const products = await SanPhamSon.find({});
    console.log(`Tìm thấy ${products.length} sản phẩm sơn trong hệ thống.`);

    for (let product of products) {
      product.DonGiaCoSo = 100000;
      
      const N = product.DanhSachMaMau ? product.DanhSachMaMau.length : 0;
      if (N > 0) {
        const baseStock = Math.floor(500 / N);
        const remainder = 500 % N;
        
        for (let i = 0; i < N; i++) {
          // Chia đều 500 thùng cho các màu, phần dư cộng vào màu đầu tiên
          product.DanhSachMaMau[i].TonKhoKhaDung = baseStock + (i === 0 ? remainder : 0);
          product.DanhSachMaMau[i].TonKhoTamGiu = 0;
        }
      } else {
        // Fallback nếu sản phẩm không có màu sắc nào
        product.TongTonKho = 500;
      }
      
      // Lưu sản phẩm để trigger hook pre-save tự động tính toán lại TongTonKho = 500
      await product.save();
      console.log(`-> Đã cập nhật: ${product.MaSanPham} - ${product.TenDongSon} (Tổng tồn kho = ${product.TongTonKho})`);
    }

    console.log('==================================================');
    console.log('✅ ĐÃ CÂN BẰNG TẤT CẢ SẢN PHẨM: Tồn kho = 500 thùng, Đơn giá = 100.000 VNĐ');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi cập nhật dữ liệu:', error);
    process.exit(1);
  }
};

updateInventory();
