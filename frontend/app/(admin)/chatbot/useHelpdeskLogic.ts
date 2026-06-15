import { useState, useMemo, useEffect } from 'react';

/**
 * Định nghĩa cấu trúc dữ liệu cho một Ticket hỗ trợ.
 */
export interface Ticket {
  id: string;
  type: 'Khiếu nại' | 'Đổi trả' | 'Bảo hành';
  customerName: string;
  customerPhone?: string;
  productName: string;
  content: string; // Nội dung mô tả sự vụ
  status: 'Mới' | 'Đang xử lý' | 'Đã giải quyết' | 'Bị từ chối';
  createdAt: string;
  assignee?: string;
  linkedOrderId?: string;
  resolutionNote?: string;
  isCustomerFault?: boolean; // Xác định lỗi do khách hàng (dành cho Bảo hành)
}

/**
 * Định nghĩa cấu trúc kết quả phân tích từ AI Copilot.
 */
export interface AIInsights {
  sentiment: 'Tức giận' | 'Thất vọng' | 'Lo lắng' | 'Bình thường';
  score: number; // Chỉ số mức độ nghiêm trọng (0 - 100)
  suggestion: string; // Đề xuất xử lý cho nhân viên
  autoReply?: string; // Mẫu câu phản hồi tự động đề xuất
  autoAction?: 'CREATE_INVENTORY_SLIP' | 'SCHEDULE_TECHNICAL_VISIT' | 'GENERATE_DISCOUNT_VOUCHER';
}

/**
 * Mảng dữ liệu giả lập (Mock Data) cực kỳ chi tiết đại diện cho 3 luồng nghiệp vụ lớn.
 */
export const mockTickets: Ticket[] = [];

export function useHelpdeskLogic() {
  // --- 1. State Management ---
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'Tất cả' | 'Khiếu nại' | 'Đổi trả' | 'Bảo hành'>('Tất cả');

  // State xử lý Drawer tương tác chi tiết
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Trạng thái thao tác API giả lập
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [operationLog, setOperationLog] = useState<string[]>([]); // Log audit ghi lại hoạt động trong phiên làm việc

  // Khởi tạo và fetch dữ liệu từ API giả lập
  useEffect(() => {
    const fetchAllTickets = async () => {
      setIsLoading(true);
      try {
        // Giả lập gọi API với delay 800ms
        await new Promise((resolve) => setTimeout(resolve, 800));
        setTickets(mockTickets);
        logAction("Hệ thống: Tải danh sách yêu cầu hỗ trợ thành công.");
      } catch (error) {
        console.error("Lỗi khi tải danh sách ticket:", error);
        logAction("Lỗi: Không thể kết nối với máy chủ API.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllTickets();
  }, []);

  // Tiện ích ghi nhật ký hoạt động nội bộ
  const logAction = (message: string) => {
    const time = new Date().toLocaleTimeString('vi-VN');
    setOperationLog(prev => [`[${time}] ${message}`, ...prev]);
  };

  // --- 2. Logic "AI Copilot" (Mô phỏng động cơ phân tích ngữ nghĩa ngôn ngữ tự nhiên) ---
  const generateAIInsights = (ticket: Ticket): AIInsights => {
    const contentLower = ticket.content.toLowerCase();

    // Luồng 1: Xử lý Khiếu nại
    if (ticket.type === "Khiếu nại") {
      return {
        sentiment: "Tức giận",
        score: 85,
        suggestion: "Đề xuất gọi điện xoa dịu lập tức trong vòng 2 tiếng, xin lỗi trực tiếp đại diện doanh nghiệp và cấp mã Voucher giảm 10% cho đơn hàng kế tiếp để duy trì mối quan hệ thương mại.",
        autoReply: `Kính gửi quý khách hàng ${ticket.customerName}, VTSC PaintPro chân thành xin lỗi về sự cố liên quan đến dòng sản phẩm ${ticket.productName} khiến quá trình thi công bị gián đoạn. Đội ngũ KCS của chúng tôi đang khẩn cấp kiểm tra lại lưu mẫu lô sản xuất này và sẽ có chuyên viên liên hệ giải quyết đền bù thỏa đáng trong vòng tối đa 2 giờ làm việc. Trân trọng cảm ơn sự thông cảm của quý khách!`,
        autoAction: "GENERATE_DISCOUNT_VOUCHER"
      };
    }

    // Luồng 2: Xử lý Đổi trả
    if (ticket.type === "Đổi trả") {
      const containsMopMeo = contentLower.includes("móp") || contentLower.includes("méo") || contentLower.includes("rò rỉ");
      return {
        sentiment: "Thất vọng",
        score: 90,
        suggestion: containsMopMeo
          ? "Phân tích hình ảnh & phản ánh thực tế cho thấy 90% lỗi do móp méo va đập mạnh trong khâu logistics. Đề xuất Duyệt tạo Phiếu Nhập Kho thu hồi vỏ móp méo và xuất bù gấp lô mới để kịp tiến độ khách hàng."
          : "Đề xuất kiểm tra chéo với kho thành phẩm trước khi duyệt.",
        autoReply: `Chào ${ticket.customerName}, VTSC đã tiếp nhận yêu cầu hoàn trả sản phẩm ${ticket.productName}. Chúng tôi đang tạo vận đơn thu hồi sản phẩm lỗi móp méo về kho và xuất kho bù miễn phí lô mới cho quý khách ngay trong ngày hôm nay.`,
        autoAction: "CREATE_INVENTORY_SLIP"
      };
    }

    // Luồng 3: Xử lý Bảo hành kỹ thuật đặc thù
    if (ticket.type === "Bảo hành") {
      return {
        sentiment: "Lo lắng",
        score: 60,
        suggestion: "Sự cố bong tróc màng sơn sấy nhiệt thường do 3 nguyên nhân: xử lý bề mặt phôi chưa sạch dầu mỡ, hoặc nhiệt độ sấy thực tế chưa đạt 180-200°C. Cần cử kỹ thuật viên xuống hiện trường đo trực tiếp nhiệt độ buồng sấy bằng máy chuyên dụng trước khi ký quyết định đền bù.",
        autoAction: "SCHEDULE_TECHNICAL_VISIT"
      };
    }

    // Giá trị mặc định
    return {
      sentiment: "Bình thường",
      score: 30,
      suggestion: "Thu thập thêm thông tin từ khách hàng và phân bổ cho nhân viên kinh doanh phụ trách xử lý."
    };
  };

  // --- 3. Logic Xử lý Nghiệp vụ chuyên sâu (Action Handlers với try...catch và API Mockup) ---

  /**
   * Nghiệp vụ 1: Giải quyết khiếu nại bằng cách bồi thường mã Voucher giảm giá
   */
  const handleResolveComplaint = async (ticketId: string, voucherCode: string) => {
    setIsSubmitting(true);
    logAction(`Hành động: Bắt đầu xử lý giải quyết khiếu nại ${ticketId}...`);
    try {
      // Giả lập gọi API PATCH lên server `/api/doi-tra/:id/resolve`
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Đã giải quyết',
            resolutionNote: `Đã đóng khiếu nại thành công. Sinh và gửi thành công mã giảm giá tri ân ${voucherCode} cho khách hàng.`
          };
        }
        return t;
      }));

      // Đồng bộ trạng thái selected ticket nếu đang mở
      setSelectedTicket(prev => prev && prev.id === ticketId ? {
        ...prev,
        status: 'Đã giải quyết',
        resolutionNote: `Đã đóng khiếu nại thành công. Sinh và gửi thành công mã giảm giá tri ân ${voucherCode} cho khách hàng.`
      } : prev);

      logAction(`Thành công: Đã đóng khiếu nại ${ticketId} và gửi voucher tri ân [${voucherCode}] cho khách hàng.`);
      return { success: true, message: "Giải quyết khiếu nại thành công và cấp mã voucher!" };
    } catch (error: any) {
      logAction(`Lỗi: Thất bại khi giải quyết khiếu nại ${ticketId}. Chi tiết: ${error.message || error}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Nghiệp vụ 2: Phê duyệt yêu cầu đổi trả và tự động kích hoạt lập phiếu kho ảo
   */
  const handleApproveReturn = async (ticketId: string) => {
    setIsSubmitting(true);
    logAction(`Hành động: Bắt đầu phê duyệt yêu cầu đổi trả ${ticketId}...`);
    try {
      // Giả lập gọi API duyệt `/api/doi-tra/:id/approve`
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Thực thi luồng xử lý tự động: Tạo phiếu nhập/xuất kho ảo (simulated)
      const slipResult = await createInventorySlips(ticketId);

      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Đã giải quyết',
            resolutionNote: `Đã phê duyệt đổi trả thành công. ${slipResult}`
          };
        }
        return t;
      }));

      setSelectedTicket(prev => prev && prev.id === ticketId ? {
        ...prev,
        status: 'Đã giải quyết',
        resolutionNote: `Đã phê duyệt đổi trả thành công. ${slipResult}`
      } : prev);

      logAction(`Thành công: Phê duyệt đổi trả ${ticketId} thành công. ${slipResult}`);
      return { success: true, message: `Phê duyệt đổi trả thành công. ${slipResult}` };
    } catch (error: any) {
      logAction(`Lỗi: Thất bại khi duyệt đổi trả ${ticketId}. Chi tiết: ${error.message || error}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Hàm ảo phụ trợ: Tạo phiếu xuất nhập kho tự động (Triggered từ ApproveReturn)
   */
  const createInventorySlips = async (ticketId: string): Promise<string> => {
    // Mô phỏng gọi API kết nối hệ thống Quản lý kho (WMS)
    await new Promise((resolve) => setTimeout(resolve, 600));
    const maPhieuNhap = `PNK-RE-${Math.floor(10000 + Math.random() * 90000)}`;
    const maPhieuXuat = `PXK-OUT-${Math.floor(10000 + Math.random() * 90000)}`;
    return `[Hệ thống WMS]: Tự động sinh Phiếu Nhập Kho thu hồi lỗi (#${maPhieuNhap}) & Phiếu Xuất Kho bù hàng mới (#${maPhieuXuat}).`;
  };

  /**
   * Nghiệp vụ 3: Quyết định bảo hành dựa trên việc thẩm định hiện trường lỗi do ai
   */
  const handleWarrantyDecision = async (ticketId: string, isCustomerFault: boolean, note: string) => {
    setIsSubmitting(true);
    logAction(`Hành động: Thẩm định đưa ra phán quyết bảo hành cho ${ticketId}...`);
    try {
      // Giả lập gọi API `/api/doi-tra/:id/warranty-decision`
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const finalStatus = isCustomerFault ? 'Bị từ chối' : 'Đã giải quyết';
      const detailNote = isCustomerFault
        ? `Từ chối bảo hành: Kết quả kiểm tra mẫu hiện trường cho thấy lỗi do khách hàng pha sai tỉ lệ dung môi hoặc nhiệt độ sấy buồng sấy không đều. Chi tiết: ${note}`
        : `Duyệt bảo hành đền bù: Xác định lỗi do dung môi chất lượng kém từ nhà máy VTSC. Chi tiết: ${note}`;

      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: finalStatus,
            isCustomerFault,
            resolutionNote: detailNote
          };
        }
        return t;
      }));

      setSelectedTicket(prev => prev && prev.id === ticketId ? {
        ...prev,
        status: finalStatus,
        isCustomerFault,
        resolutionNote: detailNote
      } : prev);

      logAction(`Thành công: Đã cập nhật phán quyết bảo hành cho ${ticketId}. Trạng thái mới: [${finalStatus}].`);
      return { success: true, message: `Thẩm định hoàn tất. Trạng thái: ${finalStatus}` };
    } catch (error: any) {
      logAction(`Lỗi: Thất bại khi thẩm định bảo hành ${ticketId}. Chi tiết: ${error.message || error}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. Xử lý Tương tác Giao diện (UI Interactions) ---

  /**
   * Xử lý khi click vào một dòng dữ liệu Ticket trên bảng chính
   */
  const handleRowClick = async (ticket: Ticket) => {
    logAction(`UI: Chọn xem chi tiết yêu cầu ${ticket.id}. Khởi tạo AI Copilot...`);
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);

    // Kích hoạt phân tích AI Copilot với hiệu ứng chờ xử lý
    setIsAiLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Hiệu ứng chờ 500ms
      const insights = generateAIInsights(ticket);
      setAiInsights(insights);
      logAction(`AI Copilot: Đã hoàn tất phân tích sự vụ ${ticket.id}. Sentiment: ${insights.sentiment} (${insights.score}%).`);
    } catch (err) {
      console.error("Lỗi AI Copilot:", err);
      setAiInsights(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Đóng Drawer chi tiết và reset dữ liệu AI tạm thời
   */
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTicket(null);
    setAiInsights(null);
  };

  // --- 5. Logic Lọc dữ liệu thông minh (Search và Tabs) ---
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Lọc theo Tab loại yêu cầu
      const matchesTab = filterType === 'Tất cả' || ticket.type === filterType;

      // Lọc theo từ khóa tìm kiếm (Tên khách hàng, Mã yêu cầu, Tên sản phẩm, Nội dung)
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch = !keyword ||
        ticket.id.toLowerCase().includes(keyword) ||
        ticket.customerName.toLowerCase().includes(keyword) ||
        ticket.productName.toLowerCase().includes(keyword) ||
        ticket.content.toLowerCase().includes(keyword);

      return matchesTab && matchesSearch;
    });
  }, [tickets, searchTerm, filterType]);

  // Trả về toàn bộ state và handlers cần thiết để tích hợp trực tiếp vào component UI
  return {
    tickets,
    filteredTickets,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,

    // Drawer & Selected Item
    selectedTicket,
    isDrawerOpen,
    aiInsights,
    isAiLoading,
    handleRowClick,
    handleCloseDrawer,

    // Core Handlers
    handleResolveComplaint,
    handleApproveReturn,
    handleWarrantyDecision,
    isSubmitting,

    // System Log
    operationLog,
    logAction
  };
}
