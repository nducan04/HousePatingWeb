'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User as UserIcon, Loader2, Info, MessageSquare,
  X, Search, Filter, RefreshCcw, Shield, Package, AlertCircle,
  TrendingDown, TrendingUp, CheckCircle2, Clock, Eye, Settings, Droplets,
  FileText, Check, Activity, ChevronRight, ShoppingBag, CreditCard,
  UserCheck, ClipboardList, PenTool, Plus, UserPlus, Sparkles, HelpCircle, ArrowRight
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import SupportTicketModal from './SupportTicketModal';
import TicketProcessingDrawer from './TicketProcessingDrawer';
import type { Ticket, TicketStatus } from './TicketProcessingDrawer';
import AICopilotPanel from './AICopilotPanel';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface SupportEntry {
  id: string;
  type: 'RETURN' | 'WARRANTY' | 'ORDER';
  refId: string;
  customerId: string;
  customerName: string;
  issue: string;
  staffName: string;
  staffId: string;
  status: string;
  date: string;
  linkedOrderId?: string;
  phuongAn?: string;
  raw?: any;
}

export default function ChatbotPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || 'Guest'; // 'Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'Director'
  const isCustomer = userRole === 'KhachHangB2B' || userRole === 'KhachHangB2C';

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dashboard States (For Admin)
  const [entries, setEntries] = useState<SupportEntry[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROBLEM' | 'NORMAL'>('ALL');

  // Modals (For Admin)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [targetEntry, setTargetEntry] = useState<SupportEntry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionPlan, setResolutionPlan] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [allStaff, setAllStaff] = useState<any[]>([]);

  // Main Tab (For Admin)
  const [mainTab, setMainTab] = useState<'dashboard' | 'tickets'>('dashboard');

  // Ticket Management States (For Admin)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketForAI, setSelectedTicketForAI] = useState<Ticket | null>(null);
  const [showTicketToast, setShowTicketToast] = useState(false);
  const [dbStaffs, setDbStaffs] = useState<any[]>([]);

  // Suggestion Chips (Context-Based)
  const suggestionChips = useMemo(() => {
    if (isCustomer) {
      return [
        { label: '🔎 Tìm sơn D1000', text: 'Tôi muốn tìm hiểu thông số dòng sơn tĩnh điện AkzoNobel D1000' },
        { label: '🔬 Quy trình pha sấy sơn', text: 'Quy trình pha chế sấy bột tĩnh điện AkzoNobel tiêu chuẩn là gì?' },
        { label: '🎨 Bảng màu Interpon 600', text: 'Lấy danh sách mã màu và tồn kho của sơn bột Interpon 600' },
        { label: '🏭 Kiểm tra tiến độ pha sơn', text: 'Tiến độ pha chế sản xuất sơn của hợp đồng HD-2026-001 như thế nào?' }
      ];
    } else {
      return [
        { label: '📊 Doanh thu tháng này', text: 'Báo cáo doanh thu vận hành của công ty trong 30 ngày qua?' },
        { label: '🚨 Cảnh báo cạn kho', text: 'Có mã màu sơn nào đang có tồn kho dưới mức cảnh báo không?' },
        { label: '👥 KPI & Hiệu suất', text: 'Thống kê điểm KPI hiệu suất của toàn bộ nhân viên VTSC' },
        { label: '📝 Hợp đồng B2B lớn', text: 'Thống kê tổng giá trị và trạng thái các hợp đồng B2B' }
      ];
    }
  }, [isCustomer]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Session Init
    const sid = localStorage.getItem('vtsc_chat_session') || `session_${Date.now()}`;
    localStorage.setItem('vtsc_chat_session', sid);
    setSessionId(sid);

    // Initial welcome message based on role
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'model',
      content: isCustomer
        ? 'Xin chào quý đối tác! Tôi là **VTSC PaintPro AI** - Cố vấn kỹ thuật ảo. Tôi có thể hỗ trợ bạn tìm kiếm các dòng sơn tĩnh điện AkzoNobel, cung cấp thông số nhiệt độ sấy KCS, tra bảng mã màu, hoặc tra cứu **tiến độ pha chế sản xuất** của hợp đồng. Bạn cần tôi hỗ trợ thông tin gì hôm nay?'
        : 'Xin chào quản trị viên! Tôi là **VTSC AI Business Advisor**. Hệ thống đã được xác thực toàn quyền nội bộ. Tôi có thể hỗ trợ bạn kết nối báo cáo doanh thu, rà soát cảnh báo cạn kho, phân tích hiệu suất KPI nhân viên, thống kê hợp đồng B2B lớn và tiến độ pha chế trên các chuyền sấy thời gian thực. Hãy nhập yêu cầu hoặc chọn gợi ý nhanh bên dưới!',
      timestamp: new Date()
    };

    // Load Chat History
    api.get(`/chatbot/history/${sid}`)
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          const loaded = res.data.data.map((msg: any, i: number) => ({
            id: `msg-${i}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages([welcomeMsg, ...loaded]);
        } else {
          setMessages([welcomeMsg]);
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải lịch sử chatbot:', err);
        setMessages([welcomeMsg]);
      });

    // Load admin states if staff/admin
    if (!isCustomer) {
      fetchDashboardData();
      fetchStaffList();
      fetchTickets();
    }
  }, [isCustomer]);

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setAllStaff(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const [resDoiTra, resBaoHanh] = await Promise.all([
        api.get('/doi-tra').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/warranties').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      const allTickets: Ticket[] = [];

      if (resDoiTra.data?.success) {
        resDoiTra.data.data.forEach((item: any) => {
          allTickets.push({
            id: item.MaDoiTra || item._id,
            type: (item.LoaiYeuCau as Ticket['type']) || 'Đổi trả',
            customer: item.KhachHang?.TenKhachHang || 'Khách hàng',
            phoneOrContract: item.DonHang?.MaHopDong || item.DonHang?.MaDonHang || 'N/A',
            description: item.LyDo || '',
            status: (item.TrangThai === 'draft' || item.TrangThai === 'Yêu cầu mới' ? 'Chờ tiếp nhận' :
              ['Đã hoàn tất', 'DA_GIAO', 'Đã khắc phục', 'Đã hoàn tiền'].includes(item.TrangThai) ? 'Đã hoàn tất' :
                item.TrangThai === 'Bị từ chối' ? 'Đã hủy yêu cầu' :
                  'Đang xử lý') as TicketStatus,
            assignee: item.NhanVienPhuTrach?.HoTen || '',
            resolution: item.PhuongAnGiaiQuyet || '',
            deadline: item.DuKienDenHang || '',
            createdAt: new Date(item.createdAt).toLocaleDateString('vi-VN'),
            rawCreatedAt: new Date(item.createdAt).getTime(),
            contractId: item.HopDong || item.DonHang?._id || item.DonHang,
            rawId: item._id,
            images: item.HinhAnh || [],
            source: 'doi-tra'
          } as any);
        });
      }

      if (resBaoHanh.data?.success) {
        resBaoHanh.data.data.forEach((item: any) => {
          allTickets.push({
            id: item.MaBaoHanh || item._id,
            type: 'Bảo hành',
            customer: item.KhachHang?.TenKhachHang || 'Khách hàng',
            phoneOrContract: item.SanPham || 'N/A',
            description: item.NoiDungLoi || '',
            status: (item.TrangThai === 'Mở' ? 'Chờ tiếp nhận' :
              ['Đã hoàn tất', 'Đã khắc phục', 'Hết hạn BH'].includes(item.TrangThai) ? 'Đã hoàn tất' :
                item.TrangThai === 'Đóng' ? 'Đã hủy yêu cầu' :
                  'Đang xử lý') as TicketStatus,
            assignee: item.KyThuatKCS?.HoTen || '',
            resolution: item.PhuongAnGiaiQuyet || '',
            deadline: item.HanBaoHanh || '',
            createdAt: new Date(item.createdAt).toLocaleDateString('vi-VN'),
            rawCreatedAt: new Date(item.createdAt).getTime(),
            contractId: item.HopDong || null,
            rawId: item._id,
            images: item.HinhAnh || [],
            source: 'bao-hanh'
          } as any);
        });
      }

      allTickets.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);
      setTickets(allTickets);
    } catch (err) { console.error('Lỗi fetch tickets:', err); }
  };

  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket({ ...ticket });
    setDbStaffs(allStaff);
    setIsDrawerOpen(true);
  };

  const handleDashboardEntryClick = (entry: SupportEntry) => {
    if (entry.type === 'ORDER') {
      openOrderSpecs(entry.id, 'ORDER');
      return;
    }

    const mappedTicket: Ticket = {
      id: entry.refId || entry.id,
      type: entry.type === 'RETURN' ? 'Đổi trả' : 'Bảo hành',
      customer: entry.customerName,
      phoneOrContract: entry.raw?.DonHang?.MaHopDong || entry.raw?.DonHang?.MaDonHang || 'N/A',
      description: entry.issue,
      status: (entry.status === 'draft' ? 'Chờ tiếp nhận' :
        entry.status === 'Yêu cầu mới' ? 'Chờ tiếp nhận' :
          ['Đã hoàn tất', 'DA_GIAO', 'Đã khắc phục', 'Đã hoàn tiền'].includes(entry.status) ? 'Đã hoàn tất' :
            ['Bị từ chối', 'Đóng'].includes(entry.status) ? 'Đã hủy yêu cầu' :
              'Đang xử lý') as TicketStatus,
      assignee: entry.staffName !== 'N/A' ? entry.staffName : '',
      resolution: entry.phuongAn || '',
      deadline: entry.raw?.DuKienDenHang || '',
      createdAt: new Date(entry.date).toLocaleDateString('vi-VN'),
      rawId: entry.id,
      contractId: entry.raw?.HopDong || entry.raw?.DonHang?._id || entry.raw?.DonHang,
      images: entry.raw?.HinhAnh || [],
      source: entry.type === 'WARRANTY' ? 'bao-hanh' : 'doi-tra'
    } as any;

    openTicketDetail(mappedTicket);
  };

  const handleUpdateTicket = async (updatedData: Partial<Ticket>) => {
    if (!selectedTicket) return;

    let backendStatus: string | undefined = updatedData.status;
    if ((selectedTicket as any).source === 'bao-hanh') {
      if (updatedData.status === 'Chờ tiếp nhận') backendStatus = 'Mở';
      if (updatedData.status === 'Đang xử lý') backendStatus = 'Đang khảo sát';
      if (updatedData.status === 'Đã hoàn tất') backendStatus = 'Đã khắc phục';
      if (updatedData.status === 'Đã hủy yêu cầu') backendStatus = 'Đóng';
    } else {
      if (updatedData.status === 'Chờ tiếp nhận') backendStatus = 'Yêu cầu mới';
      if (updatedData.status === 'Đang xử lý') backendStatus = 'Đang xử lý';
      if (updatedData.status === 'Đã hoàn tất') backendStatus = 'Đã hoàn tiền';
      if (updatedData.status === 'Đã hủy yêu cầu') backendStatus = 'Bị từ chối';
    }

    try {
      let endpoint = '';
      let payload: any = {
        status: backendStatus,
        phuongAn: updatedData.resolution
      };

      if ((selectedTicket as any).source === 'bao-hanh') {
        endpoint = `/warranties/${selectedTicket.rawId}/status`;
      } else {
        endpoint = `/doi-tra/${selectedTicket.rawId}/status`;
      }

      await api.patch(endpoint, payload);

      const updated = { ...selectedTicket, ...updatedData };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
      setSelectedTicket(updated);

      setEntries(prev => prev.map(e => {
        if (e.refId === selectedTicket.id || e.id === selectedTicket.id) {
          return {
            ...e,
            status: updated.status || e.status,
            staffName: updated.assignee || e.staffName,
            phuongAn: updated.resolution || e.phuongAn,
          };
        }
        return e;
      }));
    } catch (err) {
      console.error('Lỗi khi cập nhật ticket:', err);
      alert('Không thể cập nhật ticket trên máy chủ.');
    }
  };

  const triggerTicketToast = () => {
    setShowTicketToast(true);
    setTimeout(() => setShowTicketToast(false), 2500);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      const [returnsRes, warrantyRes, ordersRes] = await Promise.all([
        api.get('/doi-tra'),
        api.get('/warranties'),
        api.get('/orders')
      ]);

      const unifiedEntries: SupportEntry[] = [];

      if (returnsRes.data.success) {
        returnsRes.data.data.forEach((r: any) => {
          unifiedEntries.push({
            id: r._id,
            type: 'RETURN',
            refId: r.MaDoiTra,
            customerId: r.KhachHang?._id,
            customerName: r.KhachHang?.TenKhachHang || 'N/A',
            issue: r.LyDo,
            staffName: r.NhanVienPhuTrach?.HoTen || 'N/A',
            staffId: r.NhanVienPhuTrach?.MaNV || '---',
            status: r.TrangThai,
            date: r.createdAt,
            linkedOrderId: r.DonHang?._id,
            phuongAn: r.PhuongAnGiaiQuyet || '',
            raw: r
          });
        });
      }

      if (warrantyRes.data.success) {
        warrantyRes.data.data.forEach((w: any) => {
          unifiedEntries.push({
            id: w._id,
            type: 'WARRANTY',
            refId: w.MaBaoHanh,
            customerId: w.KhachHang?._id,
            customerName: w.KhachHang?.TenKhachHang || 'N/A',
            issue: w.NoiDungLoi,
            staffName: w.KyThuatKCS?.HoTen || 'N/A',
            staffId: w.KyThuatKCS?.MaNV || '---',
            status: w.TrangThai,
            date: w.createdAt,
            phuongAn: w.PhuongAnGiaiQuyet || '',
            raw: w
          });
        });
      }

      if (ordersRes.data.success) {
        ordersRes.data.data.forEach((o: any) => {
          unifiedEntries.push({
            id: o._id,
            type: 'ORDER',
            refId: o.MaDonHang,
            customerId: o.KhachHang?._id,
            customerName: o.KhachHang?.TenKhachHang || 'N/A',
            issue: o.GhiChu || 'Đơn hàng mới',
            staffName: o.NhanVienPhuTrach?.HoTen || 'N/A',
            staffId: o.NhanVienPhuTrach?.MaNV || '---',
            status: o.TrangThai,
            date: o.createdAt,
            raw: o
          });
        });
      }

      setEntries(unifiedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Lỗi tải dữ liệu dashboard:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const openOrderSpecs = async (id: string, type: 'RETURN' | 'WARRANTY' | 'ORDER') => {
    setIsSpecOpen(true);
    setIsLoadingSpecs(true);
    try {
      let orderId = id;
      if (type === 'RETURN') {
        const item = entries.find(e => e.id === id);
        orderId = item?.linkedOrderId || '';
      }

      if (orderId && orderId.length > 5) {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) setOrderDetails(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải thông số đơn hàng:', err);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  const openCustomerDetails = async (customerId: string, customerName: string) => {
    setSelectedCustomer({ id: customerId, name: customerName });
    setIsDetailOpen(true);
    setIsLoadingOrders(true);
    try {
      const res = await api.get(`/orders`);
      setCustomerOrders(res.data.data.filter((o: any) => o.KhachHang?._id === customerId));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const openActionModal = (entry: SupportEntry) => {
    setTargetEntry(entry);
    setResolutionPlan(entry.phuongAn || '');
    setSelectedStaffId(entry.raw?.NhanVienPhuTrach?._id || entry.raw?.KyThuatKCS?._id || '');
    setIsActionOpen(true);
  };

  const updateEntryStatus = async (newStatus: string) => {
    if (!targetEntry) return;
    setIsUpdating(true);
    try {
      let endpoint = '';
      let payload = {
        status: newStatus,
        phuongAn: resolutionPlan,
        assignedTo: selectedStaffId || undefined
      };

      if (targetEntry.type === 'RETURN') endpoint = `/doi-tra/${targetEntry.id}/status`;
      else if (targetEntry.type === 'WARRANTY') endpoint = `/warranties/${targetEntry.id}/status`;
      else if (targetEntry.type === 'ORDER') endpoint = `/orders/${targetEntry.id}/status`;

      const res = await api.patch(endpoint, payload);
      if (res.data.success) {
        alert('Cập nhật trạng thái & phương án thành công!');
        fetchDashboardData();
        setIsActionOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Lỗi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'PROBLEM') return matchesSearch && (e.type !== 'ORDER');
      if (activeTab === 'NORMAL') return matchesSearch && (e.type === 'ORDER');
      return matchesSearch;
    });
  }, [entries, searchTerm, activeTab]);

  const STATS = useMemo(() => ({
    total: entries.length,
    problems: entries.filter(e => e.type !== 'ORDER').length,
    pending: entries.filter(e => ['Yêu cầu mới', 'Mở', 'CHO_XAC_NHAN', 'Đang xử lý', 'Đang khảo sát', 'DANG_XU_LY'].includes(e.status)).length,
    normal: entries.filter(e => e.type === 'ORDER').length
  }), [entries]);

  const getAIInsightsForTicket = (ticket: Ticket): any => {
    if (!ticket) return null;

    const contentLower = ticket.description.toLowerCase();
    let sentiment: 'negative' | 'neutral' | 'positive' = 'neutral';
    let aiAnalysis = 'AI đang phân tích yêu cầu này...';
    let aiDraft = '';
    let aiTag = ['Tiêu chuẩn'];
    let highRisk = false;
    let isVIP = ticket.customer.toLowerCase().includes('vip') || ticket.customer.toLowerCase().includes('đại lý') || ticket.customer.toLowerCase().includes('nhà thầu');

    if (ticket.type === 'Khiếu nại') {
      sentiment = 'negative';
      highRisk = true;
      aiTag = ['Rủi ro cao', 'Ưu tiên'];
      aiAnalysis = `Phát hiện mức độ tức giận cao từ khách hàng liên quan đến chất lượng sơn/dịch vụ. Yêu cầu bồi thường thiệt hại và phản hồi khẩn cấp. Khuyến nghị CSKH gọi điện hỗ trợ trực tiếp ngay lập tức.`;
      aiDraft = `Kính gửi quý khách hàng ${ticket.customer},\n\nVTSC PaintPro chân thành xin lỗi về sự cố ngoài ý muốn liên quan đến đơn hàng/hợp đồng ${ticket.phoneOrContract}. Chúng tôi đang tiến hành kiểm tra chéo mẫu lưu trữ tại phòng KCS để xác định nguyên nhân.\n\nTrong vòng 2 giờ tới, trưởng bộ phận CSKH của chúng tôi sẽ gọi điện trực tiếp để thống nhất phương án đền bù thỏa đáng nhất cho quý khách.\n\nTrân trọng cảm ơn sự thông cảm của quý khách!`;
    } else if (ticket.type === 'Đổi trả') {
      sentiment = 'negative';
      aiTag = ticket.images && ticket.images.length > 0 ? ['Có ảnh', 'Ưu tiên'] : ['Ưu tiên'];
      aiAnalysis = `Khách hàng yêu cầu đổi trả hàng hóa do móp méo/hỏng hóc trong quá trình logistics. Khuyến nghị duyệt tạo phiếu nhập kho thu hồi và xuất bù hàng mới miễn phí để đảm bảo uy tín thương hiệu.`;
      aiDraft = `Chào quý khách ${ticket.customer},\n\nVTSC đã tiếp nhận yêu cầu đổi trả liên quan đến đơn hàng/hợp đồng ${ticket.phoneOrContract}. Chúng tôi đang tạo vận đơn thu hồi hàng lỗi về kho và sẽ xuất bù lô hàng mới miễn phí cho quý khách ngay trong ngày hôm nay.\n\nXin cảm ơn quý khách!`;
    } else if (ticket.type === 'Bảo hành') {
      sentiment = 'neutral';
      aiTag = ['Kỹ thuật', 'Cần khảo sát'];
      aiAnalysis = `Yêu cầu bảo hành liên quan đến chất lượng màng sơn sau khi sấy (bong tróc diện rộng). Sự cố này thường do nhiệt độ sấy buồng sấy chưa đạt chuẩn 180-200°C hoặc xử lý phôi chưa sạch. Khuyến nghị cử chuyên viên kỹ thuật KCS xuống đo hiện trường trước khi kết luận.`;
      aiDraft = `Kính gửi quý khách ${ticket.customer},\n\nVTSC đã nhận được yêu cầu bảo hành kỹ thuật đối với sản phẩm ${ticket.phoneOrContract}. Bộ phận kỹ thuật R&D của chúng tôi đang sắp xếp lịch và sẽ cử chuyên viên KCS xuống tận nơi đo đạc thông số nhiệt độ buồng sấy trong ngày mai để cùng quý khách tìm ra giải pháp xử lý triệt để.\n\nTrân trọng!`;
    }

    if (isVIP) {
      aiTag.unshift('Khách VIP');
    }

    return {
      id: ticket.id,
      type: ticket.type,
      customer: ticket.customer,
      contract: ticket.phoneOrContract,
      description: ticket.description,
      status: ticket.status,
      createdAt: ticket.createdAt,
      assignee: ticket.assignee,
      hasImage: ticket.images && ticket.images.length > 0,
      isVIP,
      highRisk,
      aiTag,
      sentiment,
      aiAnalysis,
      aiDraft
    };
  };

  // Submit Chat message using Axios api instance with automatic authorization token
  const handleSubmitChat = async (e: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const userMessage = customMsg ? customMsg.trim() : input.trim();
    if (!userMessage || isChatLoading) return;

    if (!customMsg) setInput('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsChatLoading(true);

    try {
      const response = await api.post('/chatbot/message', { sessionId, message: userMessage });
      if (response.data.success) {
        setMessages(prev => [...prev, {
          id: `model-${Date.now()}`,
          role: 'model',
          content: response.data.data.response,
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Không thể kết nối đến máy chủ AI.';
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `❌ Lỗi: ${errorMsg}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSubmitChat(null as any, text);
  };

  // ==========================================
  // RENDER 1: CUSTOMER VIEW (Premium full-screen)
  // ==========================================
  if (isCustomer) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row shadow-sm animate-in fade-in duration-500">

        {/* Left Sidebar - Specs & Info */}
        <div className="w-full lg:w-[380px] bg-slate-900 text-slate-100 p-8 flex flex-col justify-between border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Sparkles className="text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">PaintPro Consultant</h2>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Trợ Lý Kỹ Thuật Số</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/30">
                <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Droplets size={16} /> Tiêu chuẩn AkzoNobel
                </h3>
                <ul className="text-sm text-slate-300 space-y-2.5 pl-0 list-none">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Sấy đóng rắn: **180°C - 200°C**
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Thời gian sấy: **10 - 15 phút**
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Độ dày màng phủ: **60 - 80 µm**
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Bảo quản: **&lt; 25°C, độ ẩm &lt; 60%**
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Mẹo tra cứu nhanh</h4>
                <div className="space-y-2">
                  <div className="text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-700/20 text-slate-300 leading-relaxed">
                    💡 Hãy nhập câu hỏi chứa từ khóa như: <strong className="text-white font-mono">D1000</strong>, <strong className="text-white font-mono">D2000</strong> để tra cứu thông số sản phẩm sơn và bảng màu.
                  </div>
                  <div className="text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-700/20 text-slate-300 leading-relaxed">
                    🏭 Để xem tiến trình sấy &amp; pha chế, nhập câu hỏi kèm theo mã hợp đồng dạng <strong className="text-white font-mono">HD-2026-001</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Hệ thống trợ lý AI VTSC sử dụng dữ liệu sản xuất KCS chính thức từ nhà máy AkzoNobel Interpon.
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col bg-white h-[calc(100vh-140px)]">
          {/* Chat Header */}
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Bot size={20} />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-base">VTSC AI Assistant</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Trực tuyến • Kết nối dữ liệu live
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Bạn có muốn làm mới cuộc hội thoại hiện tại?')) {
                  const newSid = `session_${Date.now()}`;
                  localStorage.setItem('vtsc_chat_session', newSid);
                  setSessionId(newSid);
                  setMessages([{
                    id: 'welcome',
                    role: 'model',
                    content: 'Chào mừng trở lại! Tôi có thể giúp gì thêm cho bạn?',
                    timestamp: new Date()
                  }]);
                }
              }}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-500"
              title="Làm mới cuộc trò chuyện"
            >
              <RefreshCcw size={15} />
            </button>
          </div>

          {/* Messages Space */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm border ${msg.role === 'user'
                    ? 'bg-gradient-to-tr from-slate-700 to-slate-800 text-white border-slate-600'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-blue-500'
                  }`}>
                  {msg.role === 'user' ? (user?.username?.substring(0, 2).toUpperCase() || 'KH') : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm border ${msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none'
                      : 'bg-white text-slate-800 border-slate-100 rounded-tl-none font-medium prose prose-slate max-w-none prose-img:m-0 prose-p:m-0 prose-table:m-0 prose-td:p-2 prose-th:p-2'
                    }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border border-blue-500 flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white text-slate-800 border border-slate-100 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={16} />
                  <span className="text-xs text-slate-500 font-semibold animate-pulse">AI đang truy xuất dữ liệu sản xuất sấy sơn...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-8 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2.5">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isChatLoading}
                onClick={() => handleSuggestionClick(chip.text)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form
            onSubmit={(e) => handleSubmitChat(e)}
            className="p-6 border-t border-slate-100 bg-white flex gap-3"
          >
            <input
              type="text"
              disabled={isChatLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-70"
              placeholder="Đặt câu hỏi về thông số kỹ thuật, mã màu, tiến độ sản xuất..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              disabled={isChatLoading || !input.trim()}
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 shadow-md hover:shadow-lg disabled:shadow-none transition-all border-none cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: ADMIN VIEW (Helpdesk + Floating AI)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50/50 p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">AI</span> &amp; Trung Tâm Hỗ Trợ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Giám sát khiếu nại khách hàng &amp; Cố vấn vận hành thông minh</p>
        </div>
      </div>

      {/* Main Tab Switcher (Pill Tabs) */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1.5 w-fit mb-8 border border-slate-200">
        <button
          onClick={() => setMainTab('dashboard')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-none ${mainTab === 'dashboard'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 bg-transparent'
            }`}
        >
          <Activity size={16} className={mainTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'} /> Dashboard &amp; Giám Sát
        </button>
        <button
          onClick={() => setMainTab('tickets')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-none ${mainTab === 'tickets'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 bg-transparent'
            }`}
        >
          <ClipboardList size={16} className={mainTab === 'tickets' ? 'text-blue-600' : 'text-slate-400'} /> Xét duyệt yêu cầu hỗ trợ {tickets.length > 0 && `(${tickets.length})`}
        </button>
      </div>

      {/* ── DASHBOARD TAB ── */}
      {mainTab === 'dashboard' && (
        <>
          {/* Grid 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-bold">Tổng Sự Vụ Đổi Trả</span>
                <div className="p-2.5 bg-orange-50 rounded-xl">
                  <RefreshCcw size={18} className="text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">
                {entries.filter(e => e.type === 'RETURN').length}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-bold">Khiếu Nại Kỹ Thuật (BH)</span>
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Shield size={18} className="text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">
                {entries.filter(e => e.type === 'WARRANTY').length}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-bold">Đơn Hàng Gần Đây</span>
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">
                {STATS.normal}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-bold">Việc Cần Xử Lý Ngay</span>
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <Clock size={18} className="text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-800">
                {STATS.pending}
              </div>
            </div>
          </div>

          {/* Toolbar (Search & Filter) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Tìm Mã #, Khách hàng..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                {[{ id: 'ALL', label: 'Tất cả' }, { id: 'PROBLEM', label: 'Hỗ trợ đặc biệt' }, { id: 'NORMAL', label: 'Vận hành chuẩn' }].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border-none ${activeTab === tab.id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchDashboardData}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all duration-200 w-full sm:w-auto cursor-pointer"
            >
              <RefreshCcw size={15} className="text-slate-500" />
              Làm mới dữ liệu
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Phân loại</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Mã Yêu Cầu</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Nội dung / Khiếu nại</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">NV Phụ Trách</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDashboard ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-500">
                        <Loader2 className="animate-spin inline-block mr-2" size={18} /> Đang xử lý dữ liệu thực tế...
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400 italic">
                        Không tìm thấy kết quả nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr
                        key={`${entry.type}-${entry.id}`}
                        onClick={() => handleDashboardEntryClick(entry)}
                        className="border-b border-slate-100 hover:bg-slate-50/85 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${entry.type === 'RETURN'
                            ? 'bg-orange-50 text-orange-700 border border-orange-100'
                            : entry.type === 'WARRANTY'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-50 text-slate-700 border border-slate-100'
                            }`}>
                            {entry.type === 'RETURN' ? 'Đổi Trả' : entry.type === 'WARRANTY' ? 'Bảo Hành' : 'Đơn Hàng'}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleDashboardEntryClick(entry)}
                            className="font-mono font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-left"
                          >
                            #{entry.refId}
                          </button>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openCustomerDetails(entry.customerId, entry.customerName)}
                            className="bg-transparent border-none p-0 cursor-pointer text-left font-bold text-slate-800 hover:text-blue-600 transition-colors"
                          >
                            {entry.customerName}
                          </button>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-600 font-medium" title={entry.issue}>
                          {entry.issue}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                              {entry.staffName ? entry.staffName.charAt(0) : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-xs">{entry.staffName}</span>
                              <span className="text-[10px] text-slate-400">ID: {entry.staffId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${['Đã hoàn tất', 'DA_GIAO', 'Đã khắc phục', 'Đã hoàn tiền'].includes(entry.status)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : ['Yêu cầu mới', 'CHO_XAC_NHAN'].includes(entry.status)
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {new Date(entry.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleDashboardEntryClick(entry)}
                              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDashboardEntryClick(entry)}
                              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Quản lý &amp; Giải quyết"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => setIsChatOpen(true)}
                              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Hỗ trợ AI"
                            >
                              <Bot size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TICKET TAB ── */}
      {mainTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Trung Tâm Xử Lý Khiếu Nại</h2>
              <p className="text-sm text-slate-500 mt-1">Quản lý và xử lý tất cả yêu cầu hỗ trợ khách hàng</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTickets}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all cursor-pointer"
              >
                <RefreshCcw size={15} /> Làm mới
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                <Plus size={16} /> Tạo yêu cầu hỗ trợ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Mã Ticket</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Khách hàng</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Loại</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400 italic">
                          Chưa có ticket nào. Hãy tạo ticket mới!
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => {
                        const typeBadge: Record<string, string> = {
                          'Bảo hành': 'bg-blue-50 text-blue-700 border border-blue-100',
                          'Khiếu nại': 'bg-rose-50 text-rose-700 border border-rose-100',
                          'Đổi trả': 'bg-orange-50 text-orange-700 border border-orange-100'
                        };
                        const statusBadge: Record<string, string> = {
                          'Chờ tiếp nhận': 'bg-rose-50 text-rose-700 border border-rose-100',
                          'Đang xử lý': 'bg-amber-50 text-amber-700 border border-amber-100',
                          'Đã hoàn tất': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                          'Đã hủy yêu cầu': 'bg-slate-50 text-slate-500 border border-slate-100'
                        };
                        const isSelected = selectedTicketForAI?.id === ticket.id;
                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => setSelectedTicketForAI(ticket)}
                            className={`border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60 border-l-4 border-l-indigo-600' : ''
                              }`}
                          >
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{ticket.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{ticket.customer}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{ticket.phoneOrContract}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${typeBadge[ticket.type] || 'bg-slate-100 text-slate-600'}`}>
                                {ticket.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusBadge[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{ticket.createdAt}</td>
                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                              <button
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                onClick={() => openTicketDetail(ticket)}
                                title="Quản lý &amp; Giải quyết"
                              >
                                <UserPlus size={16} strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Copilot Panel */}
            <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden h-[680px] flex flex-col">
              <AICopilotPanel
                ticket={selectedTicketForAI ? getAIInsightsForTicket(selectedTicketForAI) : null}
                onClose={() => setSelectedTicketForAI(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Support Ticket Drawers */}
      <SupportTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { triggerTicketToast(); fetchTickets(); setIsCreateModalOpen(false); }}
      />
      <TicketProcessingDrawer
        isOpen={isDrawerOpen}
        ticket={selectedTicket}
        staffList={dbStaffs}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateTicket}
      />
      {showTicketToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[100]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Đã tạo ticket thành công!
        </div>
      )}

      {/* Order Specs Modal */}
      {isSpecOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600"><ShoppingBag size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Chi Tiết Đơn Hàng Thành Phẩm</h3>
                  {orderDetails && <span className="text-blue-600 font-semibold text-sm">Mã đơn: #{orderDetails.MaDonHang}</span>}
                </div>
              </div>
              <button
                onClick={() => { setIsSpecOpen(false); setOrderDetails(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingSpecs ? (
                <div className="text-center py-16 text-slate-500">
                  <Loader2 className="animate-spin mx-auto mb-3" size={24} /> Đang truy xuất thông số kỹ thuật...
                </div>
              ) : !orderDetails ? (
                <div className="text-center py-16 text-slate-400 italic">Không tìm thấy thông tin đơn hàng gốc cho sự vụ này.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tổng thanh toán</div>
                      <div className="text-lg font-bold text-slate-900">{orderDetails.TongTien?.toLocaleString()} ₫</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Phương thức</div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <CreditCard size={14} /> {orderDetails.PhuongThucThanhToan}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Trạng thái giao</div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {orderDetails.TrangThai}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <ClipboardList size={18} className="text-blue-500" /> Danh mục sản phẩm &amp; Hệ màu
                    </h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50">
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-700">Tên Sản Phẩm / Dòng Sơn</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Mã Màu (AkzoNobel)</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Màu Sắc</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 text-right">Số Lượng</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 text-right">Đơn Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.Items?.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.SanPham?.TenDongSon || item.TenSanPham}</td>
                              <td className="px-4 py-3 font-mono font-bold text-purple-700">{item.MaMau}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-5 h-5 rounded border border-slate-200 shadow-sm"
                                    style={{ background: item.HexCode || '#888' }}
                                  />
                                  <span className="text-xs text-slate-600">{item.TenMau || 'Tiêu chuẩn'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-800">{item.SoLuong} Thùng</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.DonGia?.toLocaleString()} ₫</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Action Modal */}
      {isActionOpen && targetEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">Quản Lý &amp; Giải Quyết</h3>
              <button
                onClick={() => setIsActionOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                  <UserCheck size={16} /> Nhân viên phụ trách hỗ trợ (CSKH/Bảo hành)
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  <option value="">-- Chọn nhân viên phụ trách --</option>
                  {allStaff.map(nv => (
                    <option key={nv._id} value={nv._id}>[{nv.MaNV}] {nv.HoTen} - {nv.BoPhan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                  <PenTool size={16} /> Phương án giải quyết &amp; Thực thi
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-28 resize-none leading-relaxed"
                  placeholder="Ghi rõ các giải pháp xử lý..."
                  value={resolutionPlan}
                  onChange={e => setResolutionPlan(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isUpdating}
                  onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đang khảo sát' : targetEntry.type === 'ORDER' ? 'DANG_XU_LY' : 'Đang xử lý')}
                  className="w-full py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer"
                >
                  Xử lý yêu cầu
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đang khảo sát' : targetEntry.type === 'ORDER' ? 'DANG_GIAO' : 'Đang xử lý')}
                  className="w-full py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer"
                >
                  Đang thực hiện...
                </button>
              </div>

              <button
                disabled={isUpdating}
                onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đã khắc phục' : targetEntry.type === 'ORDER' ? 'DA_GIAO' : 'Đã hoàn tiền')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                <Check size={18} /> HOÀN TẤT &amp; ĐÓNG SỰ VỤ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">Lịch sử giao dịch: {selectedCustomer.name}</h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {isLoadingOrders ? (
                <div className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto text-slate-500" size={24} />
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-400 italic">Khách hàng chưa có đơn hàng giao dịch nào.</div>
              ) : (
                customerOrders.map((o: any) => (
                  <div key={o._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-blue-600 text-base">#{o.MaDonHang}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        {o.TrangThai}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 font-semibold">
                      <div>Ngày: {new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                      <div className="font-extrabold text-slate-800">Tổng: {o.TongTien?.toLocaleString()} ₫</div>
                      <button
                        onClick={() => { setIsDetailOpen(false); openOrderSpecs(o._id, 'ORDER'); }}
                        className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-left font-bold"
                      >
                        Xem chi tiết hàng hóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ADMIN CHATBOT (Business Analytics & Assistance) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-tr from-slate-800 to-slate-950 hover:from-slate-900 hover:to-black flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50 border-none cursor-pointer"
      >
        {isChatOpen ? <X size={26} className="text-white" /> : <Bot size={26} className="text-white animate-pulse" />}
      </button>

      {isChatOpen && (
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl transition-all duration-300 flex flex-col fixed bottom-28 right-8 w-[420px] h-[580px] z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in">
          {/* Header */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-950 px-6 py-5 text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-sm block">VTSC AI Operations Advisor</span>
              <span className="text-[10px] text-blue-400/90 font-bold tracking-wider uppercase">Báo cáo &amp; Phân tích dữ liệu live</span>
            </div>
          </div>

          {/* Conversation history */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-900 text-white border-slate-800'
                  }`}>
                  {msg.role === 'user' ? 'AD' : <Bot size={14} />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm border ${msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none'
                      : 'bg-white text-slate-800 border-slate-200/60 rounded-tl-none font-medium prose prose-sm max-w-none prose-img:m-0 prose-p:m-0 prose-table:m-0 prose-td:p-2 prose-th:p-2'
                    }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white border border-slate-800 flex items-center justify-center shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="animate-spin text-slate-800" size={14} />
                  <span className="text-[10px] text-slate-500 font-bold animate-pulse">AI đang phân tích biểu đồ &amp; DB...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Analytics suggestions */}
          <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-1.5">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isChatLoading}
                onClick={() => handleSuggestionClick(chip.text)}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-900 hover:text-white text-slate-600 rounded-xl text-[10px] font-bold shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => handleSubmitChat(e)}
            className="p-4 border-t border-slate-200 bg-white flex gap-2"
          >
            <input
              type="text"
              disabled={isChatLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Hỏi về doanh thu, tồn kho, KPI nhân sự, mã đơn..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              disabled={isChatLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 shadow-sm transition-colors border-none cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
