export interface PaintColor {
  code: string;
  name: string;
  hex: string;
  category: string;
  gloss: string;
  surface: string;
  application: string;
}

export const paintColors: PaintColor[] = [
  { code: 'INT-D2525', name: 'Silver Metallic', hex: '#A8B0BC', category: 'Metallic', gloss: '30% Matt', surface: 'Nhôm', application: 'Ngoại thất, Mặt dựng' },
  { code: 'INT-W1000', name: 'Pearl White', hex: '#F2F0EB', category: 'Solid', gloss: '80% Gloss', surface: 'Thép, Nhôm', application: 'Nội thất, Thiết bị' },
  { code: 'INT-B7035', name: 'Charcoal Grey', hex: '#4A4F5C', category: 'Solid', gloss: '20% Matt', surface: 'Nhôm đúc', application: 'Công nghiệp' },
  { code: 'INT-M5540', name: 'Bronze Anodized', hex: '#8B6F47', category: 'Metallic', gloss: '40% Semi', surface: 'Nhôm thanh', application: 'Kiến trúc' },
  { code: 'INT-R3020', name: 'Signal Red', hex: '#C1121F', category: 'Solid', gloss: '90% High Gloss', surface: 'Thép', application: 'An toàn, PCCC' },
  { code: 'INT-G6018', name: 'Emerald Green', hex: '#2E7D32', category: 'Solid', gloss: '60% Semi Gloss', surface: 'Nhôm, Thép', application: 'Ngoại thất' },
  { code: 'INT-Y1028', name: 'Melon Yellow', hex: '#F9A825', category: 'Solid', gloss: '80% Gloss', surface: 'Thép tấm', application: 'Công nghiệp' },
  { code: 'INT-K9005', name: 'Jet Black', hex: '#1A1A2E', category: 'Solid', gloss: '95% Piano', surface: 'Nhôm, Thép', application: 'Cao cấp, Nội thất' },
  { code: 'INT-T7001', name: 'Titanium', hex: '#78909C', category: 'Metallic', gloss: '25% Super Matt', surface: 'Nhôm', application: 'Kiến trúc hiện đại' },
  { code: 'INT-C5015', name: 'Sky Blue', hex: '#4FC3F7', category: 'Solid', gloss: '70% Gloss', surface: 'Thép, Nhôm', application: 'Thương mại' },
  { code: 'INT-N7036', name: 'Platinum Grey', hex: '#9E9E9E', category: 'Solid', gloss: '20% Texture', surface: 'Nhôm', application: 'Mặt dựng' },
  { code: 'INT-P4010', name: 'Copper Rose', hex: '#B87333', category: 'Metallic', gloss: '50% Satin', surface: 'Nhôm', application: 'Trang trí cao cấp' },
  { code: 'INT-V8530', name: 'Deep Navy', hex: '#1A237E', category: 'Solid', gloss: '75% Gloss', surface: 'Thép, Nhôm', application: 'Hàng hải' },
  { code: 'INT-A2030', name: 'Champagne Gold', hex: '#D4AF37', category: 'Metallic', gloss: '45% Semi', surface: 'Nhôm', application: 'Kiến trúc sang trọng' },
  { code: 'INT-F3010', name: 'Forest Moss', hex: '#5D7B6F', category: 'Texture', gloss: '15% Super Matt', surface: 'Nhôm', application: 'Ngoại thất tự nhiên' },
  { code: 'INT-S1015', name: 'Arctic Frost', hex: '#E8EAF6', category: 'Solid', gloss: '85% Gloss', surface: 'Thép tấm', application: 'Thiết bị gia dụng' },
];

export const trackingData = [
  {
    code: 'VTSC-240601-001',
    customer: 'NCC Aluminium',
    product: 'INT-D2525 Silver Metallic',
    quantity: '2,500 kg',
    steps: [
      { label: 'Đặt hàng', status: 'completed' as const, time: '01/06/2024' },
      { label: 'Sản xuất', status: 'completed' as const, time: '05/06/2024' },
      { label: 'QC Pass', status: 'completed' as const, time: '08/06/2024' },
      { label: 'Đang giao', status: 'current' as const, time: '10/06/2024' },
      { label: 'Đã nhận', status: 'upcoming' as const, time: '' },
    ]
  },
  {
    code: 'VTSC-240610-002',
    customer: 'Daikin Vietnam',
    product: 'INT-B7035 Charcoal Grey',
    quantity: '1,800 kg',
    steps: [
      { label: 'Đặt hàng', status: 'completed' as const, time: '10/06/2024' },
      { label: 'Sản xuất', status: 'completed' as const, time: '13/06/2024' },
      { label: 'QC Pass', status: 'current' as const, time: '16/06/2024' },
      { label: 'Đang giao', status: 'upcoming' as const, time: '' },
      { label: 'Đã nhận', status: 'upcoming' as const, time: '' },
    ]
  }
];
