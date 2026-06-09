const mongoose = require('mongoose');
const DanhMucSon = require('./src/models/DanhMucSon');
const SanPhamSon = require('./src/models/SanPhamSon');

const seedProducts = async () => {
  try {
    require('dotenv').config();
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtsc_db';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to DB...");

    // Xóa các sản phẩm mẫu (dummy) cũ trước đó
    await SanPhamSon.deleteMany({ MaSanPham: { $regex: /^DUMMY/ } });
    console.log("Deleted old dummy products.");

    const categories = await DanhMucSon.find({ TrangThai: true });
    
    // Dữ liệu thực tế và phong phú
    const realisticData = {
      "Sơn tĩnh điện": [
        {
          MaSanPham: "STD-EP01",
          TenDongSon: "Sơn Tĩnh Điện Epoxy Bóng Trong Nhà",
          DonGiaCoSo: 65000,
          MoTa: "Sơn bột tĩnh điện Epoxy có độ bóng cao, chịu va đập tốt.",
          MoTaSanPham: "Sơn Tĩnh Điện Epoxy Bóng Trong Nhà chuyên dùng cho nội thất gia đình, đồ gia dụng, vỏ máy móc và thiết bị văn phòng. Màng sơn có độ bóng cao, chịu nhiệt và chống mài mòn cực tốt.",
        },
        {
          MaSanPham: "STD-PE02",
          TenDongSon: "Sơn Tĩnh Điện Polyester Ngoài Trời",
          DonGiaCoSo: 72000,
          MoTa: "Kháng tia UV cực tốt, chống phai màu ngoài trời.",
          MoTaSanPham: "Sơn Tĩnh Điện Polyester Ngoài Trời với tính năng chịu đựng thời tiết khắc nghiệt. Phù hợp cho khung nhôm cửa kính, biển báo giao thông, hàng rào và các công trình ngoài trời.",
        }
      ],
      "Sơn tàu biển": [
        {
          MaSanPham: "STB-PU01",
          TenDongSon: "Sơn Tàu Biển Chống Hà PU",
          DonGiaCoSo: 145000,
          MoTa: "Sơn phủ Polyurethane chống hà, chống ăn mòn nước biển.",
          MoTaSanPham: "Sơn Tàu Biển Chống Hà PU chuyên dụng cho phần ngập nước của thân tàu. Sản phẩm chống hà, chống ăn mòn hóa học và chịu được tác động trực tiếp của nước biển trong thời gian dài.",
        },
        {
          MaSanPham: "STB-EP02",
          TenDongSon: "Sơn Chống Rỉ Tàu Biển Cao Cấp",
          DonGiaCoSo: 110000,
          MoTa: "Sơn lót epoxy 2 thành phần siêu chống rỉ cho vỏ tàu.",
          MoTaSanPham: "Lớp sơn lót bảo vệ hoàn hảo cho thép, nhôm và các bề mặt kim loại của tàu biển. Có khả năng chống mài mòn, chống va đập và chịu nước vượt trội.",
        }
      ],
      "Sơn công nghiệp": [
        {
          MaSanPham: "SCN-AK03",
          TenDongSon: "Sơn Công Nghiệp Alkyd Nhanh Khô",
          DonGiaCoSo: 85000,
          MoTa: "Hệ sơn Alkyd khô nhanh, sơn kết cấu thép mạ kẽm.",
          MoTaSanPham: "Sơn Công Nghiệp Alkyd phù hợp cho các nhà xưởng, kết cấu thép, và các máy móc công nghiệp. Sản phẩm khô nhanh, bám dính tốt trên bề mặt kim loại mà không cần sơn lót.",
        },
        {
          MaSanPham: "SCN-PU04",
          TenDongSon: "Sơn Sàn Công Nghiệp Epoxy 2 Thành Phần",
          DonGiaCoSo: 180000,
          MoTa: "Sơn sàn Epoxy chịu lực, chống trơn trượt, chống hóa chất.",
          MoTaSanPham: "Sơn sàn công nghiệp chuyên dụng cho nhà máy, gara, bệnh viện và phòng thí nghiệm. Mang lại bề mặt liền mạch, kháng khuẩn, dễ lau chùi và chịu tải trọng lớn.",
        }
      ],
      "Sơn nội thất": [
        {
          MaSanPham: "SNT-MAT01",
          TenDongSon: "Sơn Nội Thất Siêu Mịn Lau Chùi Hiệu Quả",
          DonGiaCoSo: 55000,
          MoTa: "Sơn nước nội thất với màng sơn nhẵn mịn, dễ lau chùi vết bẩn.",
          MoTaSanPham: "Sơn Nội Thất Siêu Mịn mang lại vẻ đẹp thanh lịch cho không gian sống. Công thức chống bám bẩn ưu việt giúp dễ dàng lau chùi các vết bẩn cứng đầu mà không làm phai màu sơn.",
        },
        {
          MaSanPham: "SNT-GLS02",
          TenDongSon: "Sơn Nội Thất Bóng Ngọc Trai Cao Cấp",
          DonGiaCoSo: 95000,
          MoTa: "Sơn nội thất cao cấp với bề mặt bóng lấp lánh như ngọc trai.",
          MoTaSanPham: "Sản phẩm sơn trang trí cao cấp nhất, tạo hiệu ứng bóng sáng sang trọng. Chống nấm mốc, kháng khuẩn cực tốt, mang lại môi trường sống an toàn cho gia đình.",
        }
      ]
    };

    for (const cat of categories) {
      const catName = cat.TenDanhMuc;
      const productsToCreate = realisticData[catName] || [];

      for (const prodData of productsToCreate) {
        // Find if we already seeded this specific product
        const existing = await SanPhamSon.findOne({ MaSanPham: prodData.MaSanPham });
        
        if (!existing) {
          const newProduct = new SanPhamSon({
            MaSanPham: prodData.MaSanPham,
            TenDongSon: prodData.TenDongSon,
            ThuongHieu: "VTSC",
            PhanLoai: catName,
            DonGiaCoSo: prodData.DonGiaCoSo,
            DonViTinh: "Thùng",
            MoTa: prodData.MoTa,
            MoTaSanPham: prodData.MoTaSanPham,
            HinhAnh: [],
            DanhSachMaMau: [
              {
                MaMau: "WHT01",
                TenMau: "Trắng Tiêu Chuẩn",
                HexCode: "#FFFFFF",
                TonKhoKhaDung: 150,
                TonKhoTamGiu: 0,
                NguongCanhBao: 20,
                TrangThai: true
              },
              {
                MaMau: "GRY01",
                TenMau: "Xám Bạc",
                HexCode: "#C0C0C0",
                TonKhoKhaDung: 80,
                TonKhoTamGiu: 0,
                NguongCanhBao: 10,
                TrangThai: true
              }
            ]
          });

          await newProduct.save();
          console.log(`Created product ${prodData.MaSanPham} for ${catName}`);
        } else {
          console.log(`Product ${prodData.MaSanPham} already exists, skipping...`);
        }
      }
    }

    console.log("Seed products successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

seedProducts();
