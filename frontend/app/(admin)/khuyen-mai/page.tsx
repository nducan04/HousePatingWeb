'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown, Ticket, AlertTriangle, Gift, Phone, Plus, X,
  Users, TrendingUp, Check, MessageCircle, User
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

// --- Types ---
export interface CustomerData {
  id: number;
  name: string;
  totalPoints: number;
  totalOrders: number;
  totalSpent: number; // Tổng giá trị đơn hàng
  lastOrderDate: string;
  recentTickets: number;
}

export interface Customer extends CustomerData {
  tier: 'VIP' | 'Vàng' | 'Bạc' | 'Mới';
  aiAnalysis: string;
  aiType: 'danger' | 'warning' | 'info';
}

export interface Voucher {
  id: number | string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  condition: string;
  used: number; // Số lượng đơn áp dụng
  budget: number;
  status: 'active' | 'ended';
  startDate: string;
  endDate: string;
}

export interface AppliedOrder {
  orderId: string;
  customerName: string;
  orderDate: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

// --- 1. Logic Phân tích Hạng dựa trên Giá trị Đơn Hàng ---
const analyzeCustomer = (customer: CustomerData): Customer => {
  let tier: 'VIP' | 'Vàng' | 'Bạc' | 'Mới' = 'Mới';

  // Logic xét Hạng: 
  // >= 1 tỷ -> VIP
  // >= 500 triệu -> Vàng
  // >= 50 triệu -> Bạc
  if (customer.totalSpent >= 1000000000) {
    tier = 'VIP';
  } else if (customer.totalSpent >= 500000000) {
    tier = 'Vàng';
  } else if (customer.totalSpent >= 50000000) {
    tier = 'Bạc';
  } else {
    tier = 'Mới';
  }

  // Logic AI Alert (Rule-based)
  let aiAnalysis = 'Đang theo dõi';
  let aiType: 'danger' | 'warning' | 'info' = 'info';

  const lastOrderDateObj = new Date(customer.lastOrderDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastOrderDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 60) {
    aiAnalysis = `Nguy cơ rời bỏ cao (${diffDays} ngày chưa mua)`;
    aiType = 'danger';
  } else if (customer.recentTickets > 0) {
    aiAnalysis = 'Cần gọi chăm sóc Hậu mãi';
    aiType = 'warning';
  } else if (diffDays < 30 && customer.recentTickets === 0) {
    aiAnalysis = 'Khách hàng ổn định';
    aiType = 'info';
  }

  return {
    ...customer,
    tier,
    aiAnalysis,
    aiType
  };
};

export default function LoyaltyPromotionHub() {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'promotion'>('loyalty');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedVoucherDetails, setSelectedVoucherDetails] = useState<Voucher | null>(null);

  const getMockAppliedOrders = (voucher: Voucher): AppliedOrder[] => {
    return Array.from({ length: 5 }).map((_, idx) => {
      const originalPrice = 1000000 + Math.floor(Math.random() * 4000000);
      const discountAmount = voucher.type === 'percent' ? (originalPrice * voucher.value) / 100 : voucher.value;
      return {
        orderId: `DH202605${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: `Khách hàng ${idx + 1}`,
        orderDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
        originalPrice,
        discountAmount,
        finalPrice: originalPrice - discountAmount,
      };
    });
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.get('/khach-hang');
        if (res.data.success) {
          const realCustomers = res.data.data.map((c: any) => ({
            id: c._id,
            name: c.TenKhachHang || 'Khách hàng ẩn danh',
            totalPoints: Math.floor((c.TongChiTieu || 0) / 100000),
            totalOrders: c.SoDonHang || 0,
            totalSpent: c.TongChiTieu || 0,
            lastOrderDate: c.NgayMuaGanNhat || c.createdAt || new Date().toISOString(),
            recentTickets: 0
          }));
          setCustomers(realCustomers.map(analyzeCustomer).sort((a: any, b: any) => b.totalSpent - a.totalSpent));
        }
      } catch (error) {
        console.error("Lỗi tải khách hàng:", error);
      }

      setVouchers([
      {
        id: 1,
        code: "VTSC-VIP20",
        type: "percent",
        value: 20,
        condition: "Chỉ áp dụng cho hạng VIP",
        used: 124,
        budget: 500,
        status: "active",
        startDate: "2026-04-01",
        endDate: "2026-06-30"
      },
      {
        id: 2,
        code: "SUMMER50",
        type: "fixed",
        value: 5000000,
        condition: "Đơn hàng ≥ 50 triệu",
        used: 87,
        budget: 300,
        status: "active",
        startDate: "2026-05-01",
        endDate: "2026-07-31"
      },
    ]);

    setLoading(false);
    };

    fetchRealData();
  }, []);

  // --- Logic Tạo Chiến Dịch Khuyến Mãi ---
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 0,
    targetTier: 'all' as 'all' | 'VIP' | 'Vàng' | 'Bạc' | 'New',
    minOrder: 0,
    startDate: '',
    endDate: ''
  });

  const handleCreateCampaign = () => {
    if (!formData.name || !formData.code) {
      alert("Vui lòng nhập tên chiến dịch và mã voucher");
      return;
    }

    const conditionText = formData.targetTier !== 'all'
      ? `Chỉ áp dụng cho hạng ${formData.targetTier === 'New' ? 'Khách hàng mới' : formData.targetTier}`
      : `Đơn hàng ≥ ${formData.minOrder.toLocaleString()}đ`;

    const newVoucher: Voucher = {
      id: Date.now(),
      code: formData.code,
      type: formData.type,
      value: formData.value,
      condition: conditionText,
      used: 0,
      budget: 200,
      status: 'active',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || '2026-12-31'
    };

    setVouchers([...vouchers, newVoucher]);
    setIsCampaignModalOpen(false);
    setFormData({
      name: '', code: '', type: 'percent', value: 0,
      targetTier: 'all', minOrder: 0, startDate: '', endDate: ''
    });
    showToast("Đã tạo chiến dịch thành công!");
  };

  // --- Logic Tặng Voucher ---
  const [giftData, setGiftData] = useState({
    customerId: '',
    voucherId: ''
  });

  const handleGiftVoucher = async () => {
    if (!giftData.customerId || !giftData.voucherId) {
      alert("Vui lòng chọn khách hàng và voucher.");
      return;
    }

    const customer = customers.find(c => c.id.toString() === giftData.customerId);
    const voucher = vouchers.find(v => v.id.toString() === giftData.voucherId);

    if (customer && voucher) {
      try {
        const payload = {
          VoucherCode: voucher.code,
          DiscountPercent: voucher.type === 'percent' ? voucher.value : 0,
          DiscountAmount: voucher.type === 'fixed' ? voucher.value : 0,
          Description: `Tặng ${voucher.code} - ${voucher.condition}`,
          ExpirationDate: voucher.endDate
        };
        const res = await api.post(`/khach-hang/${customer.id}/gift-voucher`, payload);
        if (res.data.success) {
          setIsGiftModalOpen(false);
          setGiftData({ customerId: '', voucherId: '' });
          showToast(`Đã tặng thành công voucher ${voucher.code} cho ${customer.name}!`);
        } else {
          alert("Lỗi khi tặng voucher: " + res.data.error);
        }
      } catch (error: any) {
        alert("Lỗi khi tặng voucher: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Logic Gọi điện & Chat chăm sóc Hậu mãi ---
  const [selectedCustomerForChat, setSelectedCustomerForChat] = useState<Customer | null>(null);

  // State tin nhắn chat
  interface ChatMessage {
    sender: 'agent' | 'customer';
    text: string;
    timestamp: string;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const chatTemplates = [
    {
      id: 'survey_14d',
      title: 'Khảo sát chất lượng sơn (14 ngày)',
      getContent: (name: string, tier?: string) => `Kính chào đại diện ${name}, hãng sơn VTSC xin phép khảo sát chất lượng dòng sơn mà quý khách đã mua thi công cách đây 14 ngày. Sơn lên màu có chuẩn và đạt độ bóng như ý muốn của quý khách không ạ? Nếu cần hỗ trợ kỹ thuật pha hoặc bảo hành, xin quý khách phản hồi tin nhắn này.`
    },
    {
      id: 'gift_tier',
      title: 'Tri ân khách hàng hạng thành viên',
      getContent: (name: string, tier?: string) => `Chào ${name}, cảm ơn bạn luôn đồng hành cùng VTSC Paint. Với hạng thành viên ${tier || ''} hiện tại, VTSC xin gửi tặng bạn mã giảm giá tri ân riêng biệt để áp dụng cho đơn hàng kế tiếp. Vui lòng kiểm tra mục Quà tặng trên hệ thống!`
    },
    {
      id: 'tech_guide',
      title: 'Hướng dẫn lăn sơn & kỹ thuật thi công',
      getContent: (name: string, tier?: string) => `VTSC Paint gửi ${name} cẩm nang hướng dẫn tỷ lệ pha nước sạch chuẩn (5-10%) và kỹ thuật lăn lót kháng kiềm để tường nhà lên màu sơn phủ chuẩn đẹp nhất. Quý khách có thể xem hướng dẫn tại: vtsc.vn/huong-dan-thi-cong`
    },
    {
      id: 'invite_event',
      title: 'Mời sự kiện hội nghị thợ sơn PaintPro',
      getContent: (name: string, tier?: string) => `Chào anh/chị đại diện ${name}, hãng sơn VTSC chuẩn bị tổ chức hội nghị kỹ thuật PaintPro chia sẻ cách phối màu & xu hướng sơn chống thấm thế hệ mới tại khu vực vào thứ 7 tuần này. Trân trọng kính mời quý anh/chị tham gia!`
    }
  ];

  const handleOpenChat = (customer: Customer) => {
    setSelectedCustomerForChat(customer);
    setChatInput('');
    setChatMessages([
      {
        sender: 'customer',
        text: `Chào hãng sơn VTSC, tôi muốn hỏi chút về lô sơn ngoại thất siêu bóng VTSC-9000 bên mình vừa giao.`,
        timestamp: '09:15'
      },
      {
        sender: 'agent',
        text: `Dạ VTSC xin chào anh/chị đại diện ${customer.name} ạ! Lô sơn VTSC-9000 đó gặp vấn đề gì hay anh/chị cần hỗ trợ kỹ thuật thi công ạ?`,
        timestamp: '09:17'
      },
      {
        sender: 'customer',
        text: customer.recentTickets > 0
          ? `Mấy thùng sơn lót kiềm có hiện tượng hơi đặc quá, thợ thi công pha thêm nước thì sợ loãng màu sơn phủ sau này.`
          : `Không có vấn đề gì đâu, sơn lên màu rất đẹp, độ bóng cực tốt. Thợ thi công của tôi đánh giá rất cao độ phủ của dòng này. Tôi muốn hỏi thêm về ưu đãi đặt mua lô tiếp theo.`,
        timestamp: '09:20'
      }
    ]);
  };



  const handleSendChatMessageAgent = () => {
    if (!chatInput.trim() || !selectedCustomerForChat) return;

    const newMsg: ChatMessage = {
      sender: 'agent',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleSendChatMessageCustomer = (text: string) => {
    if (!selectedCustomerForChat || !text.trim()) return;

    const newMsg: ChatMessage = {
      sender: 'customer',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'VIP': 'bg-amber-600 text-white',
      'Vàng': 'bg-amber-400 text-amber-900',
      'Bạc': 'bg-slate-300 text-slate-700',
      'Mới': 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-md ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  const getAiBadge = (analysis: string, type: 'danger' | 'warning' | 'info') => {
    const colors = {
      danger: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-md border ${colors[type]}`}>
        {analysis}
      </span>
    );
  };

  // Tính toán Top Stats
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.tier === 'VIP').length;
  const churnAlerts = customers.filter(c => c.aiType === 'danger').length;
  const activeVouchers = vouchers.filter(v => v.status === 'active').length;

  if (loading) return <div className="p-8 text-center text-slate-600">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Loyalty & Voucher</h1>
            <p className="text-slate-600 mt-1">Trung Tâm Quản Lý Thẻ Khách Hàng & Voucher</p>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Stat 1 */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-md">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Khách hàng VIP / Tổng</div>
              <div className="text-3xl font-semibold text-slate-900 mt-1">
                {vipCustomers} <span className="text-xl font-normal text-slate-400">/ {totalCustomers}</span>
              </div>
            </div>
          </div>

          {/* Stat 2 - Churn Alert */}


          {/* Stat 3 */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-md">
              <Ticket className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Voucher đang kích hoạt</div>
              <div className="text-3xl font-semibold text-emerald-600 mt-1">{activeVouchers}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-8 py-3 font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'loyalty' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" /> Quản lý Hạng Thành Viên
          </button>
          <button
            onClick={() => setActiveTab('promotion')}
            className={`px-8 py-3 font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'promotion' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingUp className="w-4 h-4" /> Chiến dịch Khuyến mãi
          </button>
        </div>

        {/* Loyalty Tab Content */}
        {activeTab === 'loyalty' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Danh sách Khách hàng & Hạng Thành Viên</h3>
                <p className="text-sm text-slate-500">
                  Quy định hạng: Bạc (≥ 50tr), Vàng (≥ 500tr), VIP (≥ 1 tỷ).
                </p>
              </div>
              <button onClick={() => setIsGiftModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                <Gift className="w-4 h-4" /> Tặng Voucher Cho Khách Hàng Thân Thiết
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Khách hàng</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Tổng chi tiêu</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Hạng</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Cảnh báo</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <div>
                        <div className="font-medium text-slate-900">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.totalOrders} đơn • {new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                      {customer.totalSpent.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTierBadge(customer.tier)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getAiBadge(customer.aiAnalysis, customer.aiType)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setGiftData({ ...giftData, customerId: customer.id.toString() }); setIsGiftModalOpen(true); }}
                          className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Tặng Voucher"
                        >
                          <Gift className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleOpenChat(customer)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Nhắn tin Zalo"
                        >
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Promotion Tab Content */}
        {activeTab === 'promotion' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-lg">Chiến dịch Khuyến mãi</h3>
                <p className="text-sm text-slate-500">Quản lý mã giảm giá và số lượng đơn đã áp dụng</p>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tạo Chiến dịch Mới
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Mã Voucher</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Loại giảm</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Điều kiện</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Số lượng đơn áp dụng</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Trạng thái</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-semibold text-blue-600">{v.code}</td>
                      <td className="px-6 py-4">
                        {v.type === 'percent' ? `${v.value}%` : `${v.value.toLocaleString()}đ`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{v.condition}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">{v.used} đơn</span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-md overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(v.used / v.budget) * 100}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500">Giới hạn {v.budget}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-md ${v.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {v.status === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedVoucherDetails(v)}
                          className="text-xs px-4 py-1.5 border border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tặng Voucher */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Gift className="w-5 h-5 text-emerald-600" /> Tặng Voucher</h2>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn Khách Hàng</label>
                <select
                  value={giftData.customerId}
                  onChange={(e) => setGiftData({ ...giftData, customerId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn Mã Khuyến Mãi</label>
                <select
                  value={giftData.voucherId}
                  onChange={(e) => setGiftData({ ...giftData, voucherId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md font-mono text-blue-700"
                >
                  <option value="">-- Chọn Voucher đang active --</option>
                  {vouchers.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.code} - Giảm {v.type === 'percent' ? `${v.value}%` : `${v.value.toLocaleString()}đ`}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
              <button onClick={() => setIsGiftModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Hủy</button>
              <button onClick={handleGiftVoucher} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" /> Xác nhận Tặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Chiến dịch */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold">Tạo Chiến dịch Khuyến mãi Mới</h2>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên chiến dịch</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã Voucher</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại giảm giá</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md">
                      <option value="percent">Giảm theo %</option>
                      <option value="fixed">Giảm tiền mặt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Giá trị</label>
                    <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Targeting (Hạng khách hàng)</label>
                  <select value={formData.targetTier} onChange={(e) => setFormData({ ...formData, targetTier: e.target.value as any })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md">
                    <option value="all">Tất cả</option>
                    <option value="VIP">VIP</option>
                    <option value="Vàng">Vàng</option>
                    <option value="Bạc">Bạc</option>
                    <option value="New">Khách hàng mới</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Giá trị đơn hàng tối thiểu</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={formData.minOrder} onChange={(e) => setFormData({ ...formData, minOrder: Number(e.target.value) })} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-md" />
                    <span className="text-slate-500">VNĐ</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày bắt đầu</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày kết thúc</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsCampaignModalOpen(false)} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Hủy</button>
              <button onClick={handleCreateCampaign} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">Lưu & Kích hoạt</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Voucher */}
      {selectedVoucherDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold">Chi tiết Voucher: <span className="text-blue-600 font-mono">{selectedVoucherDetails.code}</span></h2>
                <p className="text-sm text-slate-500 mt-1">Lịch sử các đơn hàng đã áp dụng khuyến mãi</p>
              </div>
              <button onClick={() => setSelectedVoucherDetails(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-6 py-4 font-medium text-slate-600">Mã đơn</th>
                      <th className="text-left px-6 py-4 font-medium text-slate-600">Khách hàng</th>
                      <th className="text-left px-6 py-4 font-medium text-slate-600">Ngày đặt</th>
                      <th className="text-right px-6 py-4 font-medium text-slate-600">Nguyên giá</th>
                      <th className="text-right px-6 py-4 font-medium text-slate-600">Giảm giá</th>
                      <th className="text-right px-6 py-4 font-medium text-slate-600">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMockAppliedOrders(selectedVoucherDetails).map((order) => (
                      <tr key={order.orderId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">{order.orderId}</td>
                        <td className="px-6 py-4 text-slate-600">{order.customerName}</td>
                        <td className="px-6 py-4 text-slate-500">{order.orderDate}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{order.originalPrice.toLocaleString()}đ</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">-{order.discountAmount.toLocaleString()}đ</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-800">{order.finalPrice.toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedVoucherDetails(null)} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Modal Nhắn tin chăm sóc nhanh (Dual-Screen Simulator) */}
      {selectedCustomerForChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                  {selectedCustomerForChat.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{selectedCustomerForChat.name}</span>
                    {getTierBadge(selectedCustomerForChat.tier)}
                  </div>
                  <span className="text-xs text-slate-400">
                    Mô phỏng quy trình tương tác Zalo OA thời gian thực của đại lý sơn VTSC
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerForChat(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side: CRM Zalo OA (Employee Screen) */}
              <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50">
                <div className="bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">CRM Admin Portal (Màn hình Nhân Viên)</span>
                  <span className="text-xs text-slate-400">ID Khách hàng: #{selectedCustomerForChat.id}</span>
                </div>

                {/* Agent Chat Window */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3 flex flex-col justify-end">
                  <div className="text-center my-1">
                    <span className="text-[10px] text-slate-400 bg-slate-200/50 px-3 py-1 rounded-md font-medium">Lịch sử hội thoại CRM</span>
                  </div>
                  {chatMessages.map((msg, index) => {
                    const isAgent = msg.sender === 'agent';
                    return (
                      <div key={index} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm shadow-sm ${isAgent ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <div className={`text-[9px] mt-1 text-right ${isAgent ? 'text-blue-200' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Agent Input Bar */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="flex gap-2 items-center mb-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessageAgent()}
                      placeholder="Nhập nội dung tư vấn gửi cho Khách hàng..."
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all font-sans"
                    />
                    <button
                      onClick={handleSendChatMessageAgent}
                      disabled={!chatInput.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
                    >
                      Gửi tin nhắn
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Action Panels */}
              <div className="w-80 border-l border-slate-200 p-6 flex flex-col bg-white overflow-y-auto space-y-6">
                <div>
                  <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-600" /> Mẫu gửi của Nhân viên
                  </h3>
                  <div className="space-y-2">
                    {chatTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const content = t.id === 'gift_tier'
                            ? t.getContent(selectedCustomerForChat.name, selectedCustomerForChat.tier)
                            : t.getContent(selectedCustomerForChat.name);
                          setChatInput(content);
                        }}
                        className="w-full text-left p-3 rounded-md border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-semibold text-slate-700 group"
                      >
                        <div className="font-bold text-slate-800 group-hover:text-blue-800 mb-0.5">{t.title}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:text-slate-500">{t.id === 'gift_tier' ? t.getContent(selectedCustomerForChat.name, selectedCustomerForChat.tier) : t.getContent(selectedCustomerForChat.name)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600" /> Khách hàng Phản Hồi nhanh
                  </h3>
                  <p className="text-[10px] text-slate-400 mb-3">Click mẫu phản hồi dưới đây để thêm ngay vào cuộc hội thoại với tư cách Khách hàng</p>
                  <div className="space-y-2">
                    {[
                      { title: "👍 Sơn chuẩn màu & mịn đẹp", text: "Lớp sơn phủ lên màu rất chuẩn và mịn. Độ bóng đạt chuẩn, tôi rất hài lòng!" },
                      { title: "🎨 Độ phủ thực tế cực tốt", text: "Sơn lót kháng kiềm phủ rất tốt, công trình của tôi tiết kiệm được gần 2 thùng sơn." },
                      { title: "💰 Hỏi chiết khấu công trình mới", text: "Tôi sắp có thêm một công trình sơn biệt thự mới, đợt này bên mình có ưu đãi chiết khấu thêm không?" },
                      { title: "🛠 Hỏi kỹ thuật chống thấm", text: "Bên kỹ thuật VTSC cho anh hỏi chút, tường bị ẩm chân thì nên dùng lót gì chống kiềm hóa tốt nhất?" }
                    ].map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleSendChatMessageCustomer(reply.text);
                        }}
                        className="w-full text-left p-3 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 group"
                      >
                        <div className="font-bold text-slate-800 mb-0.5">{reply.title}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:text-slate-600">{reply.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5">
          <Gift className="w-5 h-5 text-emerald-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}