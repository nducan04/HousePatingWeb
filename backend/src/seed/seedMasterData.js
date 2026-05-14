const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const KhachHang = require('../models/KhachHang');
const SanPhamSon = require('../models/SanPhamSon');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Master Data Seeding with Images...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
const middleNames = ['Văn', 'Thị', 'Minh', 'Anh', 'Quang', 'Hồng', 'Đức', 'Xuân', 'Gia', 'Ngọc'];
const lastNames = ['Dũng', 'Hạnh', 'Tuấn', 'Linh', 'Sơn', 'Lan', 'Nam', 'Trang', 'Hùng', 'Mai'];
const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Hưng Yên', 'Biên Hòa', 'Nha Trang', 'Bắc Ninh', 'Quảng Ninh'];

const generateCustomer = (i) => {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const mn = middleNames[Math.floor(Math.random() * middleNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const type = i % 3 === 0 ? 'B2C' : (i % 3 === 1 ? 'B2B' : 'Đại lý');

    return {
        MaKH: `MASS-KH-${10000 + i}`,
        PhanLoai: type,
        TenKhachHang: type === 'B2B' ? `Công ty TNHH ${ln} ${mn} Logistics` : `${fn} ${mn} ${ln}`,
        Email: `user${i}@example.com`,
        SDT: `09${Math.floor(Math.random() * 90000000 + 10000000)}`,
        DiaChi: `${Math.floor(Math.random() * 500) + 1} Đường Giải Phóng, ${cities[Math.floor(Math.random() * cities.length)]}`,

        MaSoThueCaNhan: type === 'Đại lý' ? `${Math.floor(Math.random() * 9000000000 + 1000000000)}` : ''
    };
};

const categories = ['Sơn tĩnh điện', 'Sơn tàu biển', 'Sơn công nghiệp', 'Sơn nội thất'];
const brands = ['AkzoNobel', 'Jotun', 'Nippon', 'Dulux', 'KCC', 'VTSC Premium'];

// Image Mapping based on available files in uploads/
const imageMap = {
    'Sơn nội thất': [
        '/uploads/1776500523069-dulux.jpg',
        '/uploads/1776499976092-majestic.png'
    ],
    'Sơn tàu biển': [
        '/uploads/1776499530727-sch.jpg',
        '/uploads/1776524686459-hp3.jpeg'
    ],
    'Sơn công nghiệp': [
        '/uploads/1776446052399-SCN.webp',
        '/uploads/1776445371324-ACRYLIC.webp',
        '/uploads/1776445246656-epoxy.webp'
    ],
    'Sơn tĩnh điện': [
        '/uploads/1776448402372-STCN.webp',
        '/uploads/1776499635120-vinyl.jpeg',
        '/uploads/1776498709682-PU.webp'
    ]
};

const seedData = async () => {
    try {
        await connectDB();

        console.log('Cleaning existing MASS seed data...');
        await KhachHang.deleteMany({ MaKH: { $regex: /^MASS-/ } });
        await SanPhamSon.deleteMany({ MaSanPham: { $regex: /^MASS-/ } });

        // 1. Seed 500 Customers
        console.log('Generating 500 Customers...');
        const khBuffer = [];
        for (let i = 1; i <= 500; i++) {
            khBuffer.push(generateCustomer(i));
        }
        await KhachHang.insertMany(khBuffer);
        console.log('Inserted 500 Customers.');

        // 2. Seed 1,000 Products & 2,000 Colors
        console.log('Generating 1,000 Products and 2,000 Colors with Images...');
        const spBuffer = [];
        for (let i = 1; i <= 1000; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const images = imageMap[cat] || [];
            const randomImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : '';

            // Randomly generate 1 to 3 colors per product
            const colorsCount = Math.floor(Math.random() * 3) + 1;
            const colors = [];
            for (let c = 1; c <= colorsCount; c++) {
                const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                colors.push({
                    MaMau: `RAL-${Math.floor(Math.random() * 9000) + 1000}`,
                    TenMau: `Color Sample ${hex.toUpperCase()}`,
                    HexCode: `#${hex}`,
                    TrangThai: true
                });
            }

            spBuffer.push({
                MaSanPham: `MASS-SP-${30000 + i}`,
                TenDongSon: `${cat} ${brand} Series ${i}`,
                ThuongHieu: brand,
                PhanLoai: cat,
                DonGiaCoSo: 500000 + Math.floor(Math.random() * 4500000),
                TonKho: Math.floor(Math.random() * 5000),
                DonViTinh: i % 10 === 0 ? 'Kg' : 'Thùng',
                MoTa: `Dòng sơn chất lượng cao ứng dụng trong ${cat.toLowerCase()}, độ bền vượt trội. Sản phẩm chính hãng ${brand}.`,
                HinhAnh: randomImage,
                DanhSachMaMau: colors
            });
        }
        await SanPhamSon.insertMany(spBuffer);
        console.log('Inserted 1,000 Products with embedded colors and REAL images.');

        console.log('MASS MASTER SEED SUCCESS: Generated 1,500 new master records with images.');
        process.exit(0);
    } catch (err) {
        console.error('MASS MASTER SEED ERROR:', err);
        process.exit(1);
    }
};

seedData();
