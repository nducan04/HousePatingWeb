export interface TestVersion {
  version: string;
  date: string;
  result: 'pass' | 'fail' | 'pending';
  parameters: string;
  feedback: string;
  images: string[];
  tester: string;
}

export interface RDRequest {
  id: string;
  customer: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  surface: string;
  status: 'pending' | 'testing' | 'approved' | 'rejected';
  createdAt: string;
  versions: TestVersion[];
  signedBy?: string;
  signedAt?: string;
}

export const rdRequests: RDRequest[] = [
  {
    id: 'RD-2024-001',
    customer: 'NCC Aluminium',
    colorCode: 'INT-D2525',
    colorName: 'Bạc Ánh Kim',
    colorHex: '#A8B0BC',
    surface: 'Nhôm định hình',
    status: 'approved',
    createdAt: '2024-01-15',
    signedBy: 'Phí Bình Minh',
    signedAt: '2024-02-20',
    versions: [
      {
        version: '1.0',
        date: '2024-01-20',
        result: 'fail',
        parameters: 'Nhiệt độ: 200°C, Thời gian: 15 phút, Độ dày: 60-80μm',
        feedback: 'Lệch màu ΔE > 1.5, cần điều chỉnh tỷ lệ bột nhôm',
        images: [],
        tester: 'Nguyễn Duy Dũng'
      },
      {
        version: '1.1',
        date: '2024-02-01',
        result: 'fail',
        parameters: 'Nhiệt độ: 195°C, Thời gian: 18 phút, Độ dày: 65-75μm',
        feedback: 'ΔE = 1.2, gần đạt. Bề mặt chưa đều, cần điều chỉnh áp suất phun',
        images: [],
        tester: 'Nguyễn Duy Dũng'
      },
      {
        version: '1.2',
        date: '2024-02-15',
        result: 'pass',
        parameters: 'Nhiệt độ: 195°C, Thời gian: 18 phút, Độ dày: 68-72μm, Áp suất: 3.5 bar',
        feedback: 'ΔE = 0.6 — ĐẠT. Bề mặt đều, bám dính tốt, test salt-spray 1000h OK.',
        images: [],
        tester: 'Nguyễn Duy Dũng'
      }
    ]
  },
  {
    id: 'RD-2024-002',
    customer: 'Huihoang Interior',
    colorCode: 'INT-W1000',
    colorName: 'Trắng Ngọc Trai',
    colorHex: '#F2F0EB',
    surface: 'Thép tấm',
    status: 'testing',
    createdAt: '2024-03-01',
    versions: [
      {
        version: '1.0',
        date: '2024-03-08',
        result: 'fail',
        parameters: 'Nhiệt độ: 190°C, Thời gian: 20 phút, Độ dày: 70-90μm',
        feedback: 'Lệch màu ΔE = 2.8, bề mặt có vân cam. Cần tăng nhiệt độ nung.',
        images: [],
        tester: 'Nguyễn Đăng Tuấn'
      },
      {
        version: '1.1',
        date: '2024-03-20',
        result: 'fail',
        parameters: 'Nhiệt độ: 200°C, Thời gian: 18 phút, Độ dày: 65-80μm',
        feedback: 'ΔE = 1.8, cải thiện nhưng vẫn lệch. Feedback hãng: cần thay batch bột mới.',
        images: [],
        tester: 'Nguyễn Đăng Tuấn'
      }
    ]
  },
  {
    id: 'RD-2024-003',
    customer: 'Daikin Vietnam',
    colorCode: 'INT-B7035',
    colorName: 'Xám Than',
    colorHex: '#4A4F5C',
    surface: 'Nhôm đúc',
    status: 'testing',
    createdAt: '2024-04-10',
    versions: [
      {
        version: '1.0',
        date: '2024-04-18',
        result: 'pending',
        parameters: 'Nhiệt độ: 198°C, Thời gian: 17 phút, Độ dày: 60-75μm',
        feedback: 'Đang chờ kết quả test salt-spray từ phòng lab hãng.',
        images: [],
        tester: 'Nguyễn Mạnh Hà'
      }
    ]
  },
  {
    id: 'RD-2024-004',
    customer: 'Eurowindow',
    colorCode: 'INT-M5540',
    colorName: 'Đồng Cổ Điển',
    colorHex: '#8B6F47',
    surface: 'Nhôm thanh',
    status: 'pending',
    createdAt: '2024-05-02',
    versions: []
  },
  {
    id: 'RD-2024-005',
    customer: 'VPIC Steel',
    colorCode: 'INT-R3020',
    colorName: 'Đỏ Tín Hiệu',
    colorHex: '#C1121F',
    surface: 'Thép ống',
    status: 'rejected',
    createdAt: '2024-02-10',
    versions: [
      {
        version: '1.0',
        date: '2024-02-18',
        result: 'fail',
        parameters: 'Nhiệt độ: 205°C, Thời gian: 15 phút, Độ dày: 55-70μm',
        feedback: 'Màu đỏ bị biến sắc sau UV test 500h. Khách hàng hủy yêu cầu do thay đổi thiết kế.',
        images: [],
        tester: 'Nguyễn Mạnh Hà'
      }
    ]
  }
];
