export interface B2BContract {
  id: string;
  title: string;
  party: string;
  partyAddress: string;
  vtscAddress: string;
  value: string;
  status: 'draft' | 'awaiting' | 'signed' | 'active';
  documentHash: string;
  txHash?: string;
  createdAt: string;
  signedAt?: string;
  terms: {
    sla: string;
    penalty: string;
    escrow: string;
    duration: string;
  };
}

export const contracts: B2BContract[] = [
  {
    id: 'CTR-2024-001',
    title: 'Hợp đồng Phân phối Sơn Interpon — NCC',
    party: 'NCC Aluminium Co., Ltd',
    partyAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
    vtscAddress: '0x8Ba1f109551bD432803012645Hac136c22C57e1b',
    value: '2.5 Tỷ VNĐ',
    status: 'signed',
    documentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    txHash: '0x9f8e7d6c5b4a39281706050403020100abcdef1234567890abcdef12345678',
    createdAt: '2024-01-10',
    signedAt: '2024-01-15',
    terms: {
      sla: 'Giao hàng trong 7 ngày làm việc kể từ xác nhận đơn',
      penalty: 'Phạt 2% giá trị đơn hàng/ngày trễ, tối đa 10%',
      escrow: '10% giá trị hợp đồng (250 triệu VNĐ)',
      duration: '12 tháng (01/2024 — 12/2024)'
    }
  },
  {
    id: 'CTR-2024-002',
    title: 'Hợp đồng Cung cấp Sơn — Daikin Vietnam',
    party: 'Daikin Industries Vietnam',
    partyAddress: '0x1234567890abcdef1234567890abcdef12345678',
    vtscAddress: '0x8Ba1f109551bD432803012645Hac136c22C57e1b',
    value: '1.8 Tỷ VNĐ',
    status: 'awaiting',
    documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    createdAt: '2024-03-05',
    terms: {
      sla: 'Giao hàng trong 10 ngày kể từ xác nhận đơn',
      penalty: 'Phạt 1.5% giá trị đơn hàng/ngày trễ, tối đa 8%',
      escrow: '15% giá trị hợp đồng (270 triệu VNĐ)',
      duration: '12 tháng (03/2024 — 02/2025)'
    }
  },
  {
    id: 'CTR-2024-003',
    title: 'Hợp đồng Khung — Eurowindow',
    party: 'Eurowindow Co., Ltd',
    partyAddress: '',
    vtscAddress: '0x8Ba1f109551bD432803012645Hac136c22C57e1b',
    value: '3.2 Tỷ VNĐ',
    status: 'draft',
    documentHash: '',
    createdAt: '2024-05-12',
    terms: {
      sla: 'Giao hàng trong 5 ngày làm việc (ưu tiên)',
      penalty: 'Phạt 3% giá trị đơn hàng/ngày trễ, tối đa 15%',
      escrow: '20% giá trị hợp đồng (640 triệu VNĐ)',
      duration: '24 tháng (06/2024 — 05/2026)'
    }
  }
];
