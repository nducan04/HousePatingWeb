require('dotenv').config();
const mongoose = require('mongoose');
const CongThuc = require('./src/models/CongThuc');
const SanPhamSon = require('./src/models/SanPhamSon');
const NguyenVatLieu = require('./src/models/NguyenVatLieu');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0');
    console.log('Connected to DB');

    // 1. KHAI BÁO NGUYÊN VẬT LIỆU CẦN THIẾT
    const nvlList = [
      // Nhựa (Resin)
      { MaNVL: 'RES-001', TenNguyenVatLieu: 'Nhựa Acrylic 100%', PhanLoai: 'Nhựa', DonViTinh: 'Kg', TonKho: 5000, DonGia: 45000 },
      { MaNVL: 'RES-002', TenNguyenVatLieu: 'Nhựa Epoxy', PhanLoai: 'Nhựa', DonViTinh: 'Kg', TonKho: 3000, DonGia: 55000 },
      { MaNVL: 'RES-003', TenNguyenVatLieu: 'Nhựa Polyurethane', PhanLoai: 'Nhựa', DonViTinh: 'Kg', TonKho: 2500, DonGia: 65000 },
      
      // Dung môi (Solvents)
      { MaNVL: 'SOL-001', TenNguyenVatLieu: 'Dung môi Xylene', PhanLoai: 'Dung môi', DonViTinh: 'Lít', TonKho: 2000, DonGia: 30000 },
      { MaNVL: 'SOL-002', TenNguyenVatLieu: 'Dung môi Butyl Acetate', PhanLoai: 'Dung môi', DonViTinh: 'Lít', TonKho: 1500, DonGia: 35000 },
      { MaNVL: 'SOL-003', TenNguyenVatLieu: 'Nước RO (Pha loãng)', PhanLoai: 'Dung môi', DonViTinh: 'Lít', TonKho: 10000, DonGia: 5000 },

      // Phụ gia (Additives)
      { MaNVL: 'ADD-001', TenNguyenVatLieu: 'Phụ gia phân tán', PhanLoai: 'Phụ gia', DonViTinh: 'Kg', TonKho: 500, DonGia: 120000 },
      { MaNVL: 'ADD-002', TenNguyenVatLieu: 'Phụ gia chống lắng', PhanLoai: 'Phụ gia', DonViTinh: 'Kg', TonKho: 300, DonGia: 150000 },
      { MaNVL: 'ADD-003', TenNguyenVatLieu: 'Phụ gia phá bọt', PhanLoai: 'Phụ gia', DonViTinh: 'Kg', TonKho: 400, DonGia: 135000 },

      // Bao bì (Packaging) - Enum doesn't have "Bao bì" so we use "Khác"
      { MaNVL: 'PKG-001', TenNguyenVatLieu: 'Thùng thiếc 18L', PhanLoai: 'Khác', DonViTinh: 'Thùng', TonKho: 1000, DonGia: 35000 },
      { MaNVL: 'PKG-002', TenNguyenVatLieu: 'Lon thiếc 5L', PhanLoai: 'Khác', DonViTinh: 'Thùng', TonKho: 2000, DonGia: 15000 },
      { MaNVL: 'PKG-003', TenNguyenVatLieu: 'Thùng nhựa 20L', PhanLoai: 'Khác', DonViTinh: 'Thùng', TonKho: 1500, DonGia: 40000 },
      { MaNVL: 'PKG-004', TenNguyenVatLieu: 'Bao bì PE 25Kg', PhanLoai: 'Khác', DonViTinh: 'Cái', TonKho: 5000, DonGia: 5000 },
    ];

    // Bột màu (Pigments) - Generated dynamically below based on products colors, but we'll pre-add standard ones
    const basePigments = [
      { MaNVL: 'PIG-WHT', TenNguyenVatLieu: 'Titanium Dioxide (Trắng)', PhanLoai: 'Bột màu', DonViTinh: 'Kg', TonKho: 2000, DonGia: 85000 },
      { MaNVL: 'PIG-BLK', TenNguyenVatLieu: 'Carbon Black (Đen)', PhanLoai: 'Bột màu', DonViTinh: 'Kg', TonKho: 1000, DonGia: 75000 },
      { MaNVL: 'PIG-RED', TenNguyenVatLieu: 'Iron Oxide Red (Đỏ)', PhanLoai: 'Bột màu', DonViTinh: 'Kg', TonKho: 800, DonGia: 65000 },
      { MaNVL: 'PIG-YLW', TenNguyenVatLieu: 'Iron Oxide Yellow (Vàng)', PhanLoai: 'Bột màu', DonViTinh: 'Kg', TonKho: 800, DonGia: 60000 },
      { MaNVL: 'PIG-BLU', TenNguyenVatLieu: 'Phthalocyanine Blue (Xanh lam)', PhanLoai: 'Bột màu', DonViTinh: 'Kg', TonKho: 500, DonGia: 110000 },
    ];

    const allNvl = [...nvlList, ...basePigments];

    console.log('Inserting / Updating Raw Materials...');
    const savedMaterials = [];
    for (const item of allNvl) {
      const updated = await NguyenVatLieu.findOneAndUpdate(
        { MaNVL: item.MaNVL },
        { $set: item },
        { upsert: true, new: true }
      );
      savedMaterials.push(updated);
    }
    console.log('Raw Materials ready.');

    // Categorize materials to create realistic formulas
    const resins = savedMaterials.filter(m => m.PhanLoai === 'Nhựa');
    const solvents = savedMaterials.filter(m => m.PhanLoai === 'Dung môi');
    const additives = savedMaterials.filter(m => m.PhanLoai === 'Phụ gia');
    const pigments = savedMaterials.filter(m => m.PhanLoai === 'Bột màu');
    const packages = savedMaterials.filter(m => m.PhanLoai === 'Khác'); // Thùng/Bao

    // 2. TẠO CÔNG THỨC THEO CÁC MÀU CÓ TRONG HỆ THỐNG
    const products = await SanPhamSon.find({});
    if (!products.length) {
      console.log('No SanPhamSon found. Please add products first.');
      process.exit(1);
    }

    await CongThuc.deleteMany({});
    console.log('Cleared existing formulas');

    const newFormulas = [];

    for (const product of products) {
      if (!product.DanhSachMaMau || product.DanhSachMaMau.length === 0) continue;

      for (const color of product.DanhSachMaMau) {
        
        // --- BUỘC PHẢI CÓ ĐỦ THÀNH PHẦN THEO TỶ LỆ CHUẨN ---
        const thanhPhan = [];
        
        // 1. Nhựa (Resin) - ~ 50%
        const resin = resins[Math.floor(Math.random() * resins.length)];
        thanhPhan.push({ NguyenVatLieu: resin._id, TiLe: 50, KhoiLuongDinhMuc: 10 }); // 10L for 20L bucket

        // 2. Dung môi (Solvent) - ~ 25%
        const solvent = solvents[Math.floor(Math.random() * solvents.length)];
        thanhPhan.push({ NguyenVatLieu: solvent._id, TiLe: 25, KhoiLuongDinhMuc: 5 });

        // 3. Phụ gia (Additive) - ~ 5%
        const additive = additives[Math.floor(Math.random() * additives.length)];
        thanhPhan.push({ NguyenVatLieu: additive._id, TiLe: 5, KhoiLuongDinhMuc: 1 });

        // 4. Bột màu (Pigment) - ~ 20%
        // Pick 1-2 pigments to match color
        const pigment = pigments[Math.floor(Math.random() * pigments.length)];
        thanhPhan.push({ NguyenVatLieu: pigment._id, TiLe: 20, KhoiLuongDinhMuc: 4 });

        // 5. Bao Bì (Thùng/Bao) - 1 Thùng
        const pkg = packages[Math.floor(Math.random() * packages.length)];
        thanhPhan.push({ NguyenVatLieu: pkg._id, TiLe: 0, KhoiLuongDinhMuc: 1 }); // TiLe 0 for packaging

        const formula = {
          MaCongThuc: `CT-${product.MaSanPham}-${color.MaMau}`,
          TenCongThuc: `Công thức ${product.TenDongSon} - Màu ${color.TenMau}`,
          SanPham: product._id,
          MaMau: color.MaMau,
          Version: '1.0',
          SanLuongDuKien: 20,
          DonVi: 'Lít',
          ThanhPhan: thanhPhan,
          GhiChu: `Bao bì đựng: ${pkg.TenNguyenVatLieu}`,
          TrangThai: 'Active'
        };

        newFormulas.push(formula);
      }
    }

    if (newFormulas.length > 0) {
      await CongThuc.insertMany(newFormulas);
      console.log(`✅ Successfully generated ${newFormulas.length} formulas for existing colors!`);
    } else {
      console.log('No colors found in any product to create formulas.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding formulas:', error);
    process.exit(1);
  }
}

seed();
