"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  Ticket,
  AlertTriangle,
  Gift,
  Phone,
  Plus,
  X,
  Users,
  TrendingUp,
  Check,
  MessageCircle,
  User,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";

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
  tier: "VIP" | "Vàng" | "Bạc" | "Mới";
  aiAnalysis: string;
  aiType: "danger" | "warning" | "info";
}

export interface Voucher {
  id: number | string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  condition: string;
  used: number; // Số lượng đơn áp dụng
  budget: number;
  status: "active" | "ended";
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
  let tier: "VIP" | "Vàng" | "Bạc" | "Mới" = "Mới";

  // Logic xét Hạng:
  // >= 1 tỷ -> VIP
  // >= 500 triệu -> Vàng
  // >= 50 triệu -> Bạc
  if (customer.totalSpent >= 1000000000) {
    tier = "VIP";
  } else if (customer.totalSpent >= 500000000) {
    tier = "Vàng";
  } else if (customer.totalSpent >= 50000000) {
    tier = "Bạc";
  } else {
    tier = "Mới";
  }

  // Logic AI Alert (Rule-based)
  let aiAnalysis = "Đang theo dõi";
  let aiType: "danger" | "warning" | "info" = "info";

  const lastOrderDateObj = new Date(customer.lastOrderDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastOrderDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 60) {
    aiAnalysis = `Nguy cơ rời bỏ cao (${diffDays} ngày chưa mua)`;
    aiType = "danger";
  } else if (customer.recentTickets > 0) {
    aiAnalysis = "Cần gọi chăm sóc Hậu mãi";
    aiType = "warning";
  } else if (diffDays < 30 && customer.recentTickets === 0) {
    aiAnalysis = "Khách hàng ổn định";
    aiType = "info";
  }

  return {
    ...customer,
    tier,
    aiAnalysis,
    aiType,
  };
};

export default function LoyaltyPromotionHub() {
  const [activeTab, setActiveTab] = useState<"loyalty" | "promotion">(
    "loyalty",
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedVoucherDetails, setSelectedVoucherDetails] =
    useState<Voucher | null>(null);

  const [appliedOrders, setAppliedOrders] = useState<AppliedOrder[]>([]);

  const fetchVoucherStats = async (voucherId: string | number) => {
    try {
      const res = await api.get(`/khuyen-mai/${voucherId}/stats`);
      if (res.data.success) {
        setAppliedOrders(res.data.data.appliedOrders);
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết thống kê voucher:", error);
    }
  };

  const handleOpenVoucherDetails = (v: Voucher) => {
    setSelectedVoucherDetails(v);
    fetchVoucherStats(v.id);
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.get("/khach-hang");
        if (res.data.success) {
          const realCustomers = res.data.data.map((c: any) => ({
            id: c._id,
            name: c.TenKhachHang || "Khách hàng ẩn danh",
            totalPoints: Math.floor((c.TongChiTieu || 0) / 100000),
            totalOrders: c.SoDonHang || 0,
            totalSpent: c.TongChiTieu || 0,
            lastOrderDate:
              c.NgayMuaGanNhat || c.createdAt || new Date().toISOString(),
            recentTickets: 0,
          }));
          setCustomers(
            realCustomers
              .map(analyzeCustomer)
              .sort((a: any, b: any) => b.totalSpent - a.totalSpent),
          );
        }
      } catch (error) {
        console.error("Lỗi tải khách hàng:", error);
      }

      try {
        const resVouchers = await api.get("/khuyen-mai");
        if (resVouchers.data.success) {
          const fetchedVouchers: Voucher[] = resVouchers.data.data.map(
            (v: any) => ({
              id: v._id,
              code: v.MaVoucher,
              type: v.LoaiGiamGia === "PHAN_TRAM" ? "percent" : "fixed",
              value: v.MucGiam,
              condition:
                v.GhiChu ||
                `Giảm ${v.LoaiGiamGia === "PHAN_TRAM" ? v.MucGiam + "%" : v.MucGiam.toLocaleString() + "đ"}`,
              used: v.SoLuongDaDung || 0,
              budget: v.SoLuongToiDa || 0,
              status: v.TrangThai === "DANG_DIEN_RA" ? "active" : "ended",
              startDate: new Date(v.NgayBatDau || v.createdAt)
                .toISOString()
                .split("T")[0],
              endDate: new Date(v.NgayHetHan).toISOString().split("T")[0],
            }),
          );
          setVouchers(fetchedVouchers);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách voucher:", error);
      }

      setLoading(false);
    };

    fetchRealData();
  }, []);

  // --- Logic Tạo Chiến Dịch Khuyến Mãi ---
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "percent" as "percent" | "fixed",
    value: 0,
    targetTier: "all" as "all" | "VIP" | "Vàng" | "Bạc" | "New",
    minOrder: 0,
    maxUsage: 500,
    startDate: "",
    endDate: "",
  });

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.code) {
      alert("Vui lòng nhập tên chiến dịch và mã voucher");
      return;
    }

    const conditionText =
      formData.targetTier !== "all"
        ? `Chỉ áp dụng cho hạng ${formData.targetTier === "New" ? "Khách hàng mới" : formData.targetTier}`
        : `Đơn hàng ≥ ${formData.minOrder.toLocaleString()}đ`;

    try {
      const payload = {
        MaVoucher: formData.code,
        LoaiGiamGia: formData.type === "percent" ? "PHAN_TRAM" : "GIAM_THANG",
        MucGiam: formData.value,
        DonHangToiThieu: formData.minOrder,
        NgayBatDau:
          formData.startDate || new Date().toISOString().split("T")[0],
        NgayHetHan: formData.endDate || "2026-12-31",
        SoLuongToiDa: formData.maxUsage || 500,
        GhiChu: conditionText,
      };

      const res = await api.post("/khuyen-mai", payload);

      if (res.data.success) {
        const v = res.data.data;
        const newVoucher: Voucher = {
          id: v._id,
          code: v.MaVoucher,
          type: v.LoaiGiamGia === "PHAN_TRAM" ? "percent" : "fixed",
          value: v.MucGiam,
          condition: v.GhiChu || conditionText,
          used: v.SoLuongDaDung || 0,
          budget: v.SoLuongToiDa || formData.maxUsage || 500,
          status: v.TrangThai === "DANG_DIEN_RA" ? "active" : "ended",
          startDate: new Date(v.NgayBatDau).toISOString().split("T")[0],
          endDate: new Date(v.NgayHetHan).toISOString().split("T")[0],
        };

        setVouchers([newVoucher, ...vouchers]);
        setIsCampaignModalOpen(false);
        setFormData({
          name: "",
          code: "",
          type: "percent",
          value: 0,
          targetTier: "all",
          minOrder: 0,
          maxUsage: 500,
          startDate: "",
          endDate: "",
        });
        showToast("Đã tạo chiến dịch thành công!");
      }
    } catch (error: any) {
      alert(
        "Lỗi tạo chiến dịch: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  // --- Logic Tặng Voucher ---
  const [giftData, setGiftData] = useState({
    customerId: "",
    voucherId: "",
  });

  const handleGiftVoucher = async () => {
    if (!giftData.customerId || !giftData.voucherId) {
      alert("Vui lòng chọn khách hàng và voucher.");
      return;
    }

    const customer = customers.find(
      (c) => c.id.toString() === giftData.customerId,
    );
    const voucher = vouchers.find(
      (v) => v.id.toString() === giftData.voucherId,
    );

    if (customer && voucher) {
      try {
        const payload = {
          VoucherCode: voucher.code,
          DiscountPercent: voucher.type === "percent" ? voucher.value : 0,
          DiscountAmount: voucher.type === "fixed" ? voucher.value : 0,
          Description: `Tặng ${voucher.code} - ${voucher.condition}`,
          ExpirationDate: voucher.endDate,
        };
        const res = await api.post(
          `/khach-hang/${customer.id}/gift-voucher`,
          payload,
        );
        if (res.data.success) {
          setIsGiftModalOpen(false);
          setGiftData({ customerId: "", voucherId: "" });
          showToast(
            `Đã tặng thành công voucher ${voucher.code} cho ${customer.name}!`,
          );
        } else {
          alert("Lỗi khi tặng voucher: " + res.data.error);
        }
      } catch (error: any) {
        alert(
          "Lỗi khi tặng voucher: " +
            (error.response?.data?.error || error.message),
        );
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Logic Gọi điện & Chat chăm sóc Hậu mãi ---
  const [selectedCustomerForChat, setSelectedCustomerForChat] =
    useState<Customer | null>(null);

  // State tin nhắn chat
  interface ChatMessage {
    sender: "agent" | "customer";
    text: string;
    timestamp: string;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const chatTemplates = [
    {
      id: "survey_14d",
      title: "Khảo sát chất lượng sơn (14 ngày)",
      getContent: (name: string, tier?: string) =>
        `Kính chào đại diện ${name}, hãng sơn VTSC xin phép khảo sát chất lượng dòng sơn mà quý khách đã mua thi công cách đây 14 ngày. Sơn lên màu có chuẩn và đạt độ bóng như ý muốn của quý khách không ạ? Nếu cần hỗ trợ kỹ thuật pha hoặc bảo hành, xin quý khách phản hồi tin nhắn này.`,
    },
    {
      id: "gift_tier",
      title: "Tri ân khách hàng hạng thành viên",
      getContent: (name: string, tier?: string) =>
        `Chào ${name}, cảm ơn bạn luôn đồng hành cùng VTSC Paint. Với hạng thành viên ${tier || ""} hiện tại, VTSC xin gửi tặng bạn mã giảm giá tri ân riêng biệt để áp dụng cho đơn hàng kế tiếp. Vui lòng kiểm tra mục Quà tặng trên hệ thống!`,
    },
    {
      id: "tech_guide",
      title: "Hướng dẫn lăn sơn & kỹ thuật thi công",
      getContent: (name: string, tier?: string) =>
        `VTSC Paint gửi ${name} cẩm nang hướng dẫn tỷ lệ pha nước sạch chuẩn (5-10%) và kỹ thuật lăn lót kháng kiềm để tường nhà lên màu sơn phủ chuẩn đẹp nhất. Quý khách có thể xem hướng dẫn tại: vtsc.vn/huong-dan-thi-cong`,
    },
    {
      id: "invite_event",
      title: "Mời sự kiện hội nghị thợ sơn PaintPro",
      getContent: (name: string, tier?: string) =>
        `Chào anh/chị đại diện ${name}, hãng sơn VTSC chuẩn bị tổ chức hội nghị kỹ thuật PaintPro chia sẻ cách phối màu & xu hướng sơn chống thấm thế hệ mới tại khu vực vào thứ 7 tuần này. Trân trọng kính mời quý anh/chị tham gia!`,
    },
  ];

  const handleOpenChat = (customer: Customer) => {
    setSelectedCustomerForChat(customer);
    setChatInput("");
    setChatMessages([
      {
        sender: "customer",
        text: `Chào hãng sơn VTSC, tôi muốn hỏi chút về lô sơn ngoại thất siêu bóng VTSC-9000 bên mình vừa giao.`,
        timestamp: "09:15",
      },
      {
        sender: "agent",
        text: `Dạ VTSC xin chào anh/chị đại diện ${customer.name} ạ! Lô sơn VTSC-9000 đó gặp vấn đề gì hay anh/chị cần hỗ trợ kỹ thuật thi công ạ?`,
        timestamp: "09:17",
      },
      {
        sender: "customer",
        text:
          customer.recentTickets > 0
            ? `Mấy thùng sơn lót kiềm có hiện tượng hơi đặc quá, thợ thi công pha thêm nước thì sợ loãng màu sơn phủ sau này.`
            : `Không có vấn đề gì đâu, sơn lên màu rất đẹp, độ bóng cực tốt. Thợ thi công của tôi đánh giá rất cao độ phủ của dòng này. Tôi muốn hỏi thêm về ưu đãi đặt mua lô tiếp theo.`,
        timestamp: "09:20",
      },
    ]);
  };

  const handleSendChatMessageAgent = () => {
    if (!chatInput.trim() || !selectedCustomerForChat) return;

    const newMsg: ChatMessage = {
      sender: "agent",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const handleSendChatMessageCustomer = (text: string) => {
    if (!selectedCustomerForChat || !text.trim()) return;

    const newMsg: ChatMessage = {
      sender: "customer",
      text: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      VIP: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm border border-amber-400/20",
      Vàng: "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200",
      Bạc: "bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border border-slate-200",
      Mới: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-bold rounded-full ${colors[tier] || colors.Mới}`}
      >
        {tier}
      </span>
    );
  };

  const getAiBadge = (
    analysis: string,
    type: "danger" | "warning" | "info",
  ) => {
    const colors = {
      danger: "bg-red-50 text-red-700 border-red-100",
      warning: "bg-amber-50 text-amber-700 border-amber-100",
      info: "bg-blue-50 text-blue-700 border-blue-100",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${colors[type] || colors.info}`}
      >
        {analysis}
      </span>
    );
  };

  // Tính toán Top Stats
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c) => c.tier === "VIP").length;
  const churnAlerts = customers.filter((c) => c.aiType === "danger").length;
  const activeVouchers = vouchers.filter((v) => v.status === "active").length;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <span className="text-sm font-semibold text-slate-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 relative font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            🏷️ Quản lý khuyến mãi & Chăm sóc khách hàng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý chiến dịch ưu đãi, xếp hạng thành viên và chăm sóc khách hàng tự động tích hợp Zalo OA.
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group">
            <div className="p-3.5 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Khách hàng VIP
              </div>
              <div className="text-3xl font-bold text-slate-950 mt-1 flex items-baseline gap-1">
                {vipCustomers}
                <span className="text-sm font-normal text-slate-400">
                  / {totalCustomers} thành viên
                </span>
              </div>
            </div>
          </div>

          {/* Stat 2 - Churn Alert */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group">
            <div className="p-3.5 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nguy cơ rời bỏ
              </div>
              <div className="text-3xl font-bold text-red-600 mt-1 flex items-baseline gap-1">
                {churnAlerts}
                <span className="text-xs font-semibold text-slate-400">
                  khách &gt;60 ngày chưa mua
                </span>
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group">
            <div className="p-3.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Ticket className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Voucher kích hoạt
              </div>
              <div className="text-3xl font-bold text-emerald-600 mt-1">
                {activeVouchers}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Pill Styled */}
        <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 max-w-md mb-8 shadow-inner">
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "loyalty"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" /> Hạng thành viên
          </button>
          <button
            onClick={() => setActiveTab("promotion")}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "promotion"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Chiến dịch khuyến mãi
          </button>
        </div>

        {/* Loyalty Tab Content */}
        {activeTab === "loyalty" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Danh sách khách hàng & Hạng thành viên
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân hạng tự động: Bạc (≥ 50tr), Vàng (≥ 500tr), VIP (≥ 1 tỷ).
                </p>
              </div>
              <button
                onClick={() => setIsGiftModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
              >
                <Gift className="w-4 h-4" /> Tặng Voucher Tri Ân
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Khách hàng
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tổng chi tiêu
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hạng thành viên
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Đánh giá AI (Hành vi)
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {customer.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {customer.totalOrders} đơn hàng • Mua gần nhất: {new Date(customer.lastOrderDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                        {customer.totalSpent.toLocaleString()}đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getTierBadge(customer.tier)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getAiBadge(customer.aiAnalysis, customer.aiType)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setGiftData({
                                ...giftData,
                                customerId: customer.id.toString(),
                              });
                              setIsGiftModalOpen(true);
                            }}
                            className="p-2 hover:bg-emerald-50 rounded-xl transition-colors group"
                            title="Tặng Voucher"
                          >
                            <Gift className="w-4.5 h-4.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleOpenChat(customer)}
                            className="p-2 hover:bg-blue-50 rounded-xl transition-colors group"
                            title="Nhắn tin Chăm sóc"
                          >
                            <MessageCircle className="w-4.5 h-4.5 text-blue-600 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promotion Tab Content */}
        {activeTab === "promotion" && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Chiến dịch Khuyến mãi</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách mã giảm giá và báo cáo ngân sách sử dụng trực quan.
                </p>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Tạo Chiến dịch Mới
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mã Voucher
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mức giảm
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Điều kiện áp dụng
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mức sử dụng ngân sách
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Trạng thái
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vouchers.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/80 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 font-mono font-bold text-blue-700 bg-blue-50 rounded-lg text-sm border border-blue-100/50">
                            {v.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                          {v.type === "percent"
                            ? `${v.value}%`
                            : `${v.value.toLocaleString()}đ`}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                          {v.condition}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-slate-700">
                                {v.used} / {v.budget} đơn
                              </span>
                              <span className="text-slate-400">
                                ({Math.round((v.used / v.budget) * 100)}%)
                              </span>
                            </div>
                            <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (v.used / v.budget) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                              v.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {v.status === "active" ? "Đang chạy" : "Đã kết thúc"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenVoucherDetails(v)}
                            className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all"
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
          </div>
        )}
      </div>

      {/* Modal Tặng Voucher */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" /> Tặng Voucher
              </h2>
              <button
                onClick={() => setIsGiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chọn Khách Hàng
                </label>
                <select
                  value={giftData.customerId}
                  onChange={(e) =>
                    setGiftData({ ...giftData, customerId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chọn Mã Khuyến Mãi
                </label>
                <select
                  value={giftData.voucherId}
                  onChange={(e) =>
                    setGiftData({ ...giftData, voucherId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm font-mono text-blue-700 font-semibold"
                >
                  <option value="" className="font-sans text-slate-700 font-normal">-- Chọn Voucher đang kích hoạt --</option>
                  {vouchers
                    .filter((v) => v.status === "active")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.code} - Giảm {v.type === "percent" ? `${v.value}%` : `${v.value.toLocaleString()}đ`}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setIsGiftModalOpen(false)}
                className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleGiftVoucher}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" /> Xác nhận Tặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Chiến dịch */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Tạo Chiến dịch Khuyến mãi Mới
              </h2>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tên chiến dịch
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Ví dụ: Chào hè rực rỡ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Mã Voucher
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-mono uppercase font-bold text-blue-600 placeholder:normal-case placeholder:font-normal"
                    placeholder="Ví dụ: HE2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Loại giảm giá
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="fixed">Giảm tiền mặt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Giá trị giảm
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            value: Number(e.target.value),
                          })
                        }
                        className={`w-full pl-4 ${formData.type === "percent" ? "pr-10" : "pr-16"} py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-bold">
                          {formData.type === "percent" ? "%" : "VNĐ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Targeting (Hạng khách hàng)
                  </label>
                  <select
                    value={formData.targetTier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetTier: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                  >
                    <option value="all">Tất cả hạng khách</option>
                    <option value="VIP">Hạng VIP</option>
                    <option value="Vàng">Hạng Vàng</option>
                    <option value="Bạc">Hạng Bạc</option>
                    <option value="New">Khách hàng mới</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Đơn tối thiểu
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="number"
                        value={formData.minOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minOrder: Number(e.target.value),
                          })
                        }
                        className="w-full pl-4 pr-16 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-bold">VNĐ</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Giới hạn mã
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="number"
                        value={formData.maxUsage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxUsage: Number(e.target.value),
                          })
                        }
                        className="w-full pl-4 pr-12 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-bold">Mã</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                Lưu & Kích hoạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Voucher */}
      {selectedVoucherDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Lịch sử sử dụng:{" "}
                  <span className="px-2 py-1 font-mono font-bold text-blue-700 bg-blue-50 rounded-lg text-sm border border-blue-100/50">
                    {selectedVoucherDetails.code}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Chi tiết đơn hàng đã áp dụng khuyến mãi thành công.
                </p>
              </div>
              <button
                onClick={() => setSelectedVoucherDetails(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mã đơn
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Khách hàng
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Ngày đặt
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Nguyên giá
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Ưu đãi
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {appliedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-slate-400 font-semibold"
                        >
                          Chưa có đơn hàng nào áp dụng mã khuyến mãi này.
                        </td>
                      </tr>
                    ) : (
                      appliedOrders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="hover:bg-slate-50/55 transition-colors"
                        >
                          <td className="px-6 py-3.5 font-mono font-semibold text-slate-700">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-700">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-3.5 text-slate-400">
                            {order.orderDate}
                          </td>
                          <td className="px-6 py-3.5 text-right text-slate-500 font-medium">
                            {order.originalPrice.toLocaleString()}đ
                          </td>
                          <td className="px-6 py-3.5 text-right text-emerald-600 font-bold">
                            -{order.discountAmount.toLocaleString()}đ
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                            {order.finalPrice.toLocaleString()}đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedVoucherDetails(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhắn tin chăm sóc nhanh (Dual-Screen Simulator) */}
      {selectedCustomerForChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
                  {selectedCustomerForChat.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedCustomerForChat.name}
                    </span>
                    {getTierBadge(selectedCustomerForChat.tier)}
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="Trực tuyến"></span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Mô phỏng quy trình tương tác Zalo OA thời gian thực của đại lý sơn VTSC
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForChat(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side: CRM Zalo OA (Employee Screen) */}
              <div className="flex-1 flex flex-col bg-[#eef2f6]">
                <div className="bg-white border-b border-slate-100 px-5 py-3 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Màn hình Nhân Viên (CRM Portal)
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                    ID: #{selectedCustomerForChat.id.toString().slice(-6)}
                  </span>
                </div>

                {/* Agent Chat Window */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-end">
                  <div className="text-center my-2">
                    <span className="text-[10px] text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      Lịch sử hội thoại Zalo OA
                    </span>
                  </div>
                  {chatMessages.map((msg, index) => {
                    const isAgent = msg.sender === "agent";
                    return (
                      <div
                        key={index}
                        className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            isAgent
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                          }`}
                        >
                          <p className="leading-relaxed font-medium">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-1.5 text-right font-medium ${isAgent ? "text-blue-200" : "text-slate-400"}`}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Agent Input Bar */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendChatMessageAgent()
                    }
                    placeholder="Nhập nội dung tư vấn gửi cho Khách hàng..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all font-sans"
                  />
                  <button
                    onClick={handleSendChatMessageAgent}
                    disabled={!chatInput.trim()}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                  >
                    Gửi tin
                  </button>
                </div>
              </div>

              {/* Right Side: Quick Action Panels */}
              <div className="w-80 border-l border-slate-100 p-5 flex flex-col bg-white overflow-y-auto gap-6 shadow-2xl">
                <div>
                  <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" /> Mẫu nhắn tin nhanh
                  </h3>
                  <div className="space-y-2">
                    {chatTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const content =
                            t.id === "gift_tier"
                              ? t.getContent(
                                  selectedCustomerForChat.name,
                                  selectedCustomerForChat.tier,
                                )
                              : t.getContent(selectedCustomerForChat.name);
                          setChatInput(content);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-xs font-semibold text-slate-700 group"
                      >
                        <div className="font-bold text-slate-800 group-hover:text-blue-700 mb-1 transition-colors">
                          {t.title}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-normal">
                          {t.id === "gift_tier"
                            ? t.getContent(
                                selectedCustomerForChat.name,
                                selectedCustomerForChat.tier,
                              )
                            : t.getContent(selectedCustomerForChat.name)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-slate-500" /> Khách hàng Phản Hồi
                  </h3>
                  <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                    Click để mô phỏng tin nhắn phản hồi của Khách hàng gửi lại Zalo OA.
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        title: "👍 Sơn chuẩn màu & mịn đẹp",
                        text: "Lớp sơn phủ lên màu rất chuẩn và mịn. Độ bóng đạt chuẩn, tôi rất hài lòng!",
                      },
                      {
                        title: "🎨 Độ phủ thực tế cực tốt",
                        text: "Sơn lót kháng kiềm phủ rất tốt, công trình của tôi tiết kiệm được gần 2 thùng sơn.",
                      },
                      {
                        title: "💰 Hỏi chiết khấu công trình mới",
                        text: "Tôi sắp có thêm một công trình sơn biệt thự mới, đợt này bên mình có ưu đãi chiết khấu thêm không?",
                      },
                      {
                        title: "🛠 Hỏi kỹ thuật chống thấm",
                        text: "Bên kỹ thuật VTSC cho anh hỏi chút, tường bị ẩm chân thì nên dùng lót gì chống kiềm hóa tốt nhất?",
                      },
                    ].map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleSendChatMessageCustomer(reply.text);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 group"
                      >
                        <div className="font-bold text-slate-800 mb-1">
                          {reply.title}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-normal">
                          {reply.text}
                        </p>
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 duration-300 border border-slate-800">
          <Gift className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
