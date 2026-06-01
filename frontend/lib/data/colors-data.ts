export interface PaintColor {
  code: string;
  name: string;
  hex: string;
  category: string;
  gloss: string;
  surface: string;
  application: string;
  coverage: string;
  packaging: string;
  mixing: string;
}

export const paintColors: PaintColor[] = [
  { code: 'INT-D2525', name: 'Silver Metallic', hex: '#A8B0BC', category: 'Metallic', gloss: '30% Matt', surface: 'Nhôm', application: 'Ngoại thất, Mặt dựng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-W1000', name: 'Pearl White', hex: '#F2F0EB', category: 'Solid', gloss: '80% Gloss', surface: 'Thép, Nhôm', application: 'Nội thất, Thiết bị', coverage: '10 - 12 m²/thùng', packaging: '1 Thùng (25kg)', mixing: 'Tỷ lệ 4:1 (Sơn : Đóng rắn) - Dung môi 10%' },
  { code: 'INT-B7035', name: 'Charcoal Grey', hex: '#4A4F5C', category: 'Solid', gloss: '20% Matt', surface: 'Nhôm đúc', application: 'Công nghiệp', coverage: '7 - 9 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy kỹ - Chỉnh súng phun áp lực 60-80 kV' },
  { code: 'INT-M5540', name: 'Bronze Anodized', hex: '#8B6F47', category: 'Metallic', gloss: '40% Semi', surface: 'Nhôm thanh', application: 'Kiến trúc', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-R3020', name: 'Signal Red', hex: '#C1121F', category: 'Solid', gloss: '90% High Gloss', surface: 'Thép', application: 'An toàn, PCCC', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-G6018', name: 'Emerald Green', hex: '#2E7D32', category: 'Solid', gloss: '60% Semi Gloss', surface: 'Nhôm, Thép', application: 'Ngoại thất', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-Y1028', name: 'Melon Yellow', hex: '#F9A825', category: 'Solid', gloss: '80% Gloss', surface: 'Thép tấm', application: 'Công nghiệp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-K9005', name: 'Jet Black', hex: '#1A1A2E', category: 'Solid', gloss: '95% Piano', surface: 'Nhôm, Thép', application: 'Cao cấp, Nội thất', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-T7001', name: 'Titanium', hex: '#78909C', category: 'Metallic', gloss: '25% Super Matt', surface: 'Nhôm', application: 'Kiến trúc hiện đại', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-C5015', name: 'Sky Blue', hex: '#4FC3F7', category: 'Solid', gloss: '70% Gloss', surface: 'Thép, Nhôm', application: 'Thương mại', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-N7036', name: 'Platinum Grey', hex: '#9E9E9E', category: 'Solid', gloss: '20% Texture', surface: 'Nhôm', application: 'Mặt dựng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-P4010', name: 'Copper Rose', hex: '#B87333', category: 'Metallic', gloss: '50% Satin', surface: 'Nhôm', application: 'Trang trí cao cấp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-V8530', name: 'Deep Navy', hex: '#1A237E', category: 'Solid', gloss: '75% Gloss', surface: 'Thép, Nhôm', application: 'Hàng hải', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-A2030', name: 'Champagne Gold', hex: '#D4AF37', category: 'Metallic', gloss: '45% Semi', surface: 'Nhôm', application: 'Kiến trúc sang trọng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-F3010', name: 'Forest Moss', hex: '#5D7B6F', category: 'Texture', gloss: '15% Super Matt', surface: 'Nhôm', application: 'Ngoại thất tự nhiên', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'INT-S1015', name: 'Arctic Frost', hex: '#E8EAF6', category: 'Solid', gloss: '85% Gloss', surface: 'Thép tấm', application: 'Thiết bị gia dụng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // -- BỔ SUNG BẢNG MÀU CHUẨN RAL QUỐC TẾ --

  // Dải Vàng & Cam (Yellow & Orange - RAL 1xxx, 2xxx)
  { code: 'RAL-1003', name: 'Signal Yellow', hex: '#F9A800', category: 'Solid', gloss: '85% Gloss', surface: 'Thép, Nhôm', application: 'Công nghiệp tín hiệu', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-1013', name: 'Oyster White', hex: '#EAE6CA', category: 'Solid', gloss: '30% Matt', surface: 'Nhôm', application: 'Trang trí nội thất', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-1015', name: 'Light Ivory', hex: '#E6D2B5', category: 'Solid', gloss: '90% Gloss', surface: 'Thép', application: 'Vỏ máy móc', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-1021', name: 'Colza Yellow', hex: '#F3A505', category: 'Solid', gloss: '75% Gloss', surface: 'Nhôm, Thép', application: 'Giao thông', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-1028', name: 'Melon Yellow', hex: '#FF9B00', category: 'Solid', gloss: '80% Gloss', surface: 'Tôn mạ kẽm', application: 'Biển báo', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-2004', name: 'Pure Orange', hex: '#E75B12', category: 'Solid', gloss: '85% Gloss', surface: 'Nhôm', application: 'Máy công trình', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-2011', name: 'Deep Orange', hex: '#F3752C', category: 'Solid', gloss: '60% Semi', surface: 'Nhôm đúc', application: 'Công nghiệp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Đỏ & Tím (Red & Purple - RAL 3xxx, 4xxx)
  { code: 'RAL-3000', name: 'Flame Red', hex: '#AF2B1E', category: 'Solid', gloss: '90% High Gloss', surface: 'Thép', application: 'Hệ thống PCCC', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-3002', name: 'Carmine Red', hex: '#A2231D', category: 'Solid', gloss: '70% Gloss', surface: 'Nhôm', application: 'Cửa cuốn', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-3005', name: 'Wine Red', hex: '#5E2129', category: 'Solid', gloss: '20% Matt', surface: 'Nhôm thanh', application: 'Ngoại thất, Mái che', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-3015', name: 'Light Pink', hex: '#E1A6AD', category: 'Solid', gloss: '50% Satin', surface: 'Nhôm', application: 'Nội thất y tế', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-4005', name: 'Blue Lilac', hex: '#7A5889', category: 'Solid', gloss: '30% Matt', surface: 'Thép', application: 'Trang trí đặc biệt', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-4006', name: 'Traffic Purple', hex: '#913073', category: 'Solid', gloss: '80% Gloss', surface: 'Nhôm', application: 'Biển hiệu dán decal', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Xanh Lam (Blue - RAL 5xxx)
  { code: 'RAL-5002', name: 'Ultramarine Blue', hex: '#20214F', category: 'Solid', gloss: '85% Gloss', surface: 'Nhôm, Thép', application: 'Cột đèn', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-5005', name: 'Signal Blue', hex: '#005387', category: 'Solid', gloss: '80% Gloss', surface: 'Thép mạ', application: 'Khung pano', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-5010', name: 'Gentian Blue', hex: '#004F7C', category: 'Solid', gloss: '75% Gloss', surface: 'Nhôm', application: 'Mặt dựng tòa nhà', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-5012', name: 'Light Blue', hex: '#2B83BA', category: 'Solid', gloss: '30% Matt', surface: 'Thép', application: 'Máy nén khí', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-5015', name: 'Sky Blue', hex: '#2378CB', category: 'Solid', gloss: '85% Gloss', surface: 'Tôn tấm', application: 'Mái hiên', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-5024', name: 'Pastel Blue', hex: '#5D9B9B', category: 'Solid', gloss: '50% Satin', surface: 'Nhôm', application: 'Cửa sổ', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Xanh Lục (Green - RAL 6xxx)
  { code: 'RAL-6005', name: 'Moss Green', hex: '#114232', category: 'Texture', gloss: '15% Super Matt', surface: 'Thép', application: 'Hàng rào chấn song', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-6011', name: 'Reseda Green', hex: '#68825B', category: 'Solid', gloss: '50% Semi', surface: 'Nhôm', application: 'Máy tiện CNC', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-6018', name: 'Yellow Green', hex: '#4B8B3B', category: 'Solid', gloss: '85% Gloss', surface: 'Thép', application: 'Đồ gia dụng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-6029', name: 'Mint Green', hex: '#007243', category: 'Solid', gloss: '90% Gloss', surface: 'Nhôm thanh', application: 'Kiến trúc xanh', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-6032', name: 'Signal Green', hex: '#0F8558', category: 'Solid', gloss: '70% Gloss', surface: 'Thép đen', application: 'Khung lưới thép', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Xám (Grey - RAL 7xxx)  - Dải phổ biến nhất
  { code: 'RAL-7001', name: 'Silver Grey', hex: '#8F999F', category: 'Metallic', gloss: '40% Semi', surface: 'Nhôm', application: 'Mặt dựng Aluminium', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7015', name: 'Slate Grey', hex: '#51565C', category: 'Solid', gloss: '20% Matt', surface: 'Thép', application: 'Khung máy công nghiệp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7016', name: 'Anthracite Grey', hex: '#373F43', category: 'Texture', gloss: '15% Cát nhám', surface: 'Nhôm, Thép', application: 'Cửa nhôm Xingfa', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7032', name: 'Pebble Grey', hex: '#B8B4A5', category: 'Solid', gloss: '85% Gloss', surface: 'Thép tấm', application: 'Tủ điện công nghiệp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7035', name: 'Light Grey', hex: '#C5C7C4', category: 'Solid', gloss: '85% Gloss', surface: 'Tôn mạ', application: 'Tủ rack mạng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7040', name: 'Window Grey', hex: '#9DA1AA', category: 'Solid', gloss: '30% Matt', surface: 'Nhôm', application: 'Cửa nhựa lõi thép', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-7042', name: 'Traffic Grey A', hex: '#8D948D', category: 'Solid', gloss: '70% Gloss', surface: 'Thép', application: 'Gầm máy', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Nâu (Brown - RAL 8xxx)
  { code: 'RAL-8003', name: 'Clay Brown', hex: '#7A542E', category: 'Solid', gloss: '50% Satin', surface: 'Nhôm', application: 'Ngoại thất, Giả gỗ', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-8011', name: 'Nut Brown', hex: '#5B3A29', category: 'Texture', gloss: 'Nhám vân gỗ', surface: 'Thép hộp', application: 'Bàn ghế cafe', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-8014', name: 'Sepia Brown', hex: '#4A3525', category: 'Solid', gloss: '30% Matt', surface: 'Nhôm thanh', application: 'Cửa lùa', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-8017', name: 'Chocolate Brown', hex: '#45322E', category: 'Solid', gloss: '90% Gloss', surface: 'Thép', application: 'Mái che tôn', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-8028', name: 'Terra Brown', hex: '#4E3B31', category: 'Solid', gloss: '20% Matt', surface: 'Nhôm', application: 'Kiến trúc cổ điển', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Dải Trắng & Đen (White & Black - RAL 9xxx)
  { code: 'RAL-9003', name: 'Signal White', hex: '#ECECE7', category: 'Solid', gloss: '90% High Gloss', surface: 'Thép', application: 'Buồng sơn, Phòng sạch', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-9005', name: 'Jet Black', hex: '#0A0A0A', category: 'Solid', gloss: '20% Matt / 90% Gloss', surface: 'Nhôm, Thép', application: 'Chi tiết ô tô, Xe máy', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-9006', name: 'White Aluminium', hex: '#A5A8A6', category: 'Metallic', gloss: '45% Nhũ bạc', surface: 'Thép tấm', application: 'La zăng xe, Mâm đúc', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-9007', name: 'Grey Aluminium', hex: '#8F8F8C', category: 'Metallic', gloss: '45% Nhũ xám', surface: 'Nhôm đúc', application: 'Phụ kiện cửa cuốn', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-9010', name: 'Pure White', hex: '#F1ECE1', category: 'Solid', gloss: '85% Gloss', surface: 'Thép', application: 'Máng đèn chiếu sáng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'RAL-9016', name: 'Traffic White', hex: '#F6F6F6', category: 'Solid', gloss: '30% Matt', surface: 'Nhôm, Thép', application: 'Cửa nhựa, Lan can', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },

  // Mã màu vân đặc biệt (Texture & Pattern - Non-RAL)
  { code: 'TEX-S202', name: 'Silver HammerTone', hex: '#8C92AC', category: 'Texture', gloss: 'Vân búa bạc', surface: 'Thép đúc', application: 'Két sắt, Cửa xếp', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'TEX-C303', name: 'Copper Vein', hex: '#8A5A44', category: 'Texture', gloss: 'Vân đồng cổ', surface: 'Thép nghệ thuật', application: 'Cổng xếp, Hàng rào đúc', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'TEX-G404', name: 'Gold Hammertone', hex: '#B8860B', category: 'Texture', gloss: 'Vân búa vàng', surface: 'Sắt mỹ thuật', application: 'Bàn ghế sắt uốn', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'TEX-S505', name: 'Sand Texture Black', hex: '#1C1C1C', category: 'Texture', gloss: 'Cát nhám mờ', surface: 'Hợp kim kẽm', application: 'Phụ kiện tay cứng', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'TEX-W606', name: 'Wrinkle Black', hex: '#2B2B2B', category: 'Texture', gloss: 'Vân nhăn đen', surface: 'Nhôm tản nhiệt', application: 'Tản nhiệt Led, Âm ly', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'PAS-101', name: 'Pastel Pink', hex: '#FFD1DC', category: 'Pastel', gloss: '20% Matt', surface: 'Nhôm', application: 'Nội thất trẻ em', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'PAS-102', name: 'Soft Lavender', hex: '#E6E6FA', category: 'Pastel', gloss: '20% Matt', surface: 'Nhôm', application: 'Nội thất phòng ngủ', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'PAS-103', name: 'Mint Frost', hex: '#AAF0D1', category: 'Pastel', gloss: '20% Matt', surface: 'Nhôm', application: 'Bệnh viện, Trường học', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'NEO-201', name: 'Electric Lime', hex: '#CCFF00', category: 'Neon', gloss: '90% Gloss', surface: 'Thép', application: 'Trang trí thể thao', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' },
  { code: 'NEO-202', name: 'Cyber Pink', hex: '#FF007F', category: 'Neon', gloss: '90% Gloss', surface: 'Thép', application: 'Biển quảng cáo', coverage: '8 - 10 m²/thùng', packaging: '1 Thùng (20kg)', mixing: 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)' }
];

export const trackingData = [
  {
    code: 'VTSC-240601-001',
    customer: 'NCC Aluminium',
    product: 'INT-D2525 Silver Metallic',
    quantity: '2,25 thùng',
    steps: [
      { label: 'Đặt hàng', status: 'completed' as const, time: '01/04/2026' },
      { label: 'Sản xuất', status: 'completed' as const, time: '05/04/2026' },
      { label: 'QC Pass', status: 'completed' as const, time: '08/04/2026' },
      { label: 'Đang giao', status: 'current' as const, time: '10/04/2026' },
      { label: 'Đã nhận', status: 'upcoming' as const, time: '' },
    ]
  },
  {
    code: 'VTSC-240610-002',
    customer: 'Daikin Vietnam',
    product: 'INT-B7035 Charcoal Grey',
    quantity: '1,800 thùng',
    steps: [
      { label: 'Đặt hàng', status: 'completed' as const, time: '10/03/2026' },
      { label: 'Sản xuất', status: 'completed' as const, time: '13/03/2026' },
      { label: 'QC Pass', status: 'current' as const, time: '16/03/2026' },
      { label: 'Đang giao', status: 'upcoming' as const, time: '' },
      { label: 'Đã nhận', status: 'upcoming' as const, time: '' },
    ]
  }
];
