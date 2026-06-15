require('dotenv').config();
const mongoose = require('mongoose');
const CongThuc = require('./src/models/CongThuc');
const SanPhamSon = require('./src/models/SanPhamSon');
const NguyenVatLieu = require('./src/models/NguyenVatLieu');

const paintColors = [
  { code: 'INT-D2525', name: 'Silver Metallic (Bạc Ánh Kim)' },
  { code: 'INT-W1000', name: 'Pearl White (Trắng Ngọc Trai)' },
  { code: 'INT-B7035', name: 'Charcoal Grey (Xám Than)' },
  { code: 'INT-M5540', name: 'Classic Bronze (Đồng Cổ Điển)' },
  { code: 'INT-R3020', name: 'Signal Red (Đỏ Tín Hiệu)' },
  { code: 'INT-G6018', name: 'Emerald Green (Xanh Ngọc Lục Bảo)' },
  { code: 'INT-Y1028', name: 'Melon Yellow (Vàng Dưa Lưới)' },
  { code: 'INT-K9005', name: 'Jet Black (Đen Tuyền)' },
  { code: 'INT-T7001', name: 'Titanium Grey (Xám Titan)' },
  { code: 'INT-C5015', name: 'Sky Blue (Xanh Da Trời)' },
  { code: 'INT-N7036', name: 'Platinum Grey (Xám Bạch Kim)' },
  { code: 'INT-P4010', name: 'Rose Gold Metallic (Vàng Hồng Ánh Kim)' },
  { code: 'INT-V8530', name: 'Deep Blue (Xanh Biển Sâu)' },
  { code: 'INT-A2030', name: 'Champagne Gold (Vàng Champagne)' },
  { code: 'INT-F3010', name: 'Forest Green (Xanh Rêu Rừng)' },
  { code: 'INT-S1015', name: 'Arctic Ice White (Trắng Băng Bắc Cực)' },
  { code: 'RAL-1003', name: 'Signal Yellow (Vàng Tín Hiệu)' },
  { code: 'RAL-1013', name: 'Oyster White (Trắng Vỏ Sò)' },
  { code: 'RAL-1015', name: 'Light Ivory (Vàng Ngà Nhạt)' },
  { code: 'RAL-1021', name: 'Rape Yellow (Vàng Hoa Cải)' },
  { code: 'RAL-1028', name: 'Melon Yellow (Vàng Dưa Lưới)' },
  { code: 'RAL-2004', name: 'Pure Orange (Cam Thuần)' },
  { code: 'RAL-2011', name: 'Deep Orange (Cam Đậm)' },
  { code: 'RAL-3000', name: 'Flame Red (Đỏ Lửa)' },
  { code: 'RAL-3002', name: 'Carmine Red (Đỏ Khói)' },
  { code: 'RAL-3005', name: 'Wine Red (Đỏ Rượu Vang)' },
  { code: 'RAL-3015', name: 'Light Pink (Hồng Phớt)' },
  { code: 'RAL-4005', name: 'Blue Lilac (Tím Đinh Hương)' },
  { code: 'RAL-4006', name: 'Traffic Purple (Tím Giao Thông)' },
  { code: 'RAL-5002', name: 'Ultramarine Blue (Xanh Hàng Hải)' },
  { code: 'RAL-5005', name: 'Signal Blue (Xanh Tín Hiệu)' },
  { code: 'RAL-5010', name: 'Gentian Blue (Xanh Long Đởm)' },
  { code: 'RAL-5012', name: 'Light Blue (Xanh Lam Nhạt)' },
  { code: 'RAL-5015', name: 'Sky Blue (Xanh Da Trời)' },
  { code: 'RAL-5024', name: 'Pastel Blue (Xanh Pastel)' },
  { code: 'RAL-6005', name: 'Moss Green (Xanh Rêu Thẫm)' },
  { code: 'RAL-6011', name: 'Reseda Green (Xanh Mộc Tê)' },
  { code: 'RAL-6018', name: 'Yellow Green (Xanh Đọt Chuối)' },
  { code: 'RAL-6029', name: 'Mint Green (Xanh Bạc Hà)' },
  { code: 'RAL-6032', name: 'Signal Green (Xanh Lục Tín Hiệu)' },
  { code: 'RAL-7001', name: 'Silver Grey (Xám Bạc)' },
  { code: 'RAL-7015', name: 'Slate Grey (Xám Đá Phiến)' },
  { code: 'RAL-7016', name: 'Anthracite Grey (Xám Than Đá)' },
  { code: 'RAL-7032', name: 'Pebble Grey (Xám Cuội)' },
  { code: 'RAL-7035', name: 'Light Grey (Xám Sáng)' },
  { code: 'RAL-7040', name: 'Window Grey (Xám Cửa Sổ)' },
  { code: 'RAL-7042', name: 'Traffic Grey A (Xám Giao Thông)' },
  { code: 'RAL-8003', name: 'Clay Brown (Nâu Đất Sét)' },
  { code: 'RAL-8011', name: 'Nut Brown (Nâu Hạt Dẻ)' },
  { code: 'RAL-8014', name: 'Sepia Brown (Nâu Đất Sẫm)' },
  { code: 'RAL-8017', name: 'Chocolate Brown (Nâu Chocolate)' },
  { code: 'RAL-8028', name: 'Terra Brown (Nâu Đất)' },
  { code: 'RAL-9003', name: 'Signal White (Trắng Tín Hiệu)' },
  { code: 'RAL-9005', name: 'Jet Black (Đen Tuyền)' },
  { code: 'RAL-9006', name: 'White Aluminium (Nhôm Trắng)' },
  { code: 'RAL-9007', name: 'Grey Aluminium (Nhôm Xám)' },
  { code: 'RAL-9010', name: 'Pure White (Trắng Tinh Khiết)' },
  { code: 'RAL-9016', name: 'Traffic White (Trắng Giao Thông)' },
  { code: 'TEX-S202', name: 'Hammer Silver (Vân Búa Bạc)' },
  { code: 'TEX-C303', name: 'Antique Copper (Vân Đồng Cổ)' },
  { code: 'TEX-G404', name: 'Hammer Gold (Vân Búa Vàng)' },
  { code: 'TEX-S505', name: 'Fine Texture Matt Black (Cát Nhám Mờ Đen)' },
  { code: 'TEX-W606', name: 'Wrinkle Black (Vân Nhăn Đen)' },
  { code: 'PAS-101', name: 'Pastel Pink (Hồng Nhạt)' },
  { code: 'PAS-102', name: 'Lavender Blue (Tím Oải Hương Nhạt)' },
  { code: 'PAS-103', name: 'Mint Turquoise (Xanh Băng Bạc Hà)' },
  { code: 'NEO-201', name: 'Lime Neon (Xanh Chanh Neon)' },
  { code: 'NEO-202', name: 'Cyber Pink (Hồng Cyber)' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0');
    console.log('Connected to DB');

    // Find a random product
    const product = await SanPhamSon.findOne();
    if (!product) {
      console.log('No SanPhamSon found. Create one first.');
      process.exit(1);
    }

    // Find some materials
    const materials = await NguyenVatLieu.find();
    if (materials.length < 3) {
      console.log('Need at least 3 materials to make a formula.');
      process.exit(1);
    }

    await CongThuc.deleteMany({});
    console.log('Cleared existing formulas');

    const newFormulas = [];

    for (const color of paintColors) {
      // Randomly pick 3 to 5 materials
      const numMaterials = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
      const selectedMaterials = [...materials].sort(() => 0.5 - Math.random()).slice(0, numMaterials);
      
      let remainingPercent = 100;
      const thanhPhan = [];
      
      for (let i = 0; i < selectedMaterials.length; i++) {
        let percent;
        if (i === selectedMaterials.length - 1) {
          percent = remainingPercent;
        } else {
          // Random percent between 5 and max available (leaving at least 5 for remaining)
          const maxPercent = remainingPercent - (selectedMaterials.length - 1 - i) * 5;
          percent = Math.floor(Math.random() * (maxPercent - 5 + 1)) + 5;
          remainingPercent -= percent;
        }
        
        const khoiLuong = (percent / 100) * 20; // Assuming 20 Lít/Kg is the expected yield
        
        thanhPhan.push({
          NguyenVatLieu: selectedMaterials[i]._id,
          TiLe: percent,
          KhoiLuongDinhMuc: parseFloat(khoiLuong.toFixed(3))
        });
      }

      const formula = {
        MaCongThuc: `CT-${color.code}`,
        TenCongThuc: `Công thức màu ${color.name}`,
        SanPham: product._id,
        MaMau: color.code,
        Version: '1.0',
        SanLuongDuKien: 20,
        DonVi: 'Lít',
        ThanhPhan: thanhPhan,
        GhiChu: `Base Type: Nhựa Epoxy/Polyester, Nhiệt độ sấy: 195°C`,
        TrangThai: 'Active'
      };

      newFormulas.push(formula);
    }

    await CongThuc.insertMany(newFormulas);
    console.log(`✅ Successfully seeded ${newFormulas.length} formulas!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding formulas:', error);
    process.exit(1);
  }
}

seed();
