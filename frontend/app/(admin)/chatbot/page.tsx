'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User as UserIcon, Loader2, Info, MessageSquare,
  X, Search, Filter, RefreshCcw, Shield, Package, AlertCircle,
  TrendingDown, TrendingUp, CheckCircle2, Clock, Eye, Settings,
  FileText, Check, Activity, ChevronRight, ShoppingBag, CreditCard,
  UserCheck, ClipboardList, PenTool, Plus, UserPlus
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import SupportTicketModal from './SupportTicketModal';
import TicketProcessingDrawer from './TicketProcessingDrawer';
import type { Ticket, TicketStatus } from './TicketProcessingDrawer';

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
  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Xin chào! Tôi là trợ lý AI chuyên môn của VTSC. Tôi có thể giúp bạn tra cứu thông tin sản phẩm sơn tĩnh điện Akzonobel, quy trình R&D, và bảng thông số an toàn (MSDS). Bạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dashboard States
  const [entries, setEntries] = useState<SupportEntry[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROBLEM' | 'NORMAL'>('ALL');

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [selectedOrderID, setSelectedOrderID] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [targetEntry, setTargetEntry] = useState<SupportEntry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionPlan, setResolutionPlan] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [allStaff, setAllStaff] = useState<any[]>([]);

  // ── Main Tab ──
  const [mainTab, setMainTab] = useState<'dashboard' | 'tickets'>('dashboard');

  // ── Ticket Management States ──
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketToast, setShowTicketToast] = useState(false);
  const [dbStaffs, setDbStaffs] = useState<any[]>([]);

  useEffect(() => {
    // Session Init
    const sid = localStorage.getItem('vtsc_chat_session') || `session_${Date.now()}`;
    localStorage.setItem('vtsc_chat_session', sid);
    setSessionId(sid);

    // History Load
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/chatbot/history/${sid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const loadedMessages = data.data.map((msg: any, i: number) => ({
            id: `msg-${i}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages([{ id: 'welcome', role: 'model', content: 'Xin chào! Tôi là trợ lý AI chuyên môn của VTSC...', timestamp: new Date() }, ...loadedMessages]);
        }
      }).catch(err => console.error(err));

    fetchDashboardData();
    fetchStaffList();
    fetchTickets();
  }, []);

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

    // Determine exact backend status
    let backendStatus: string | undefined = updatedData.status;
    if ((selectedTicket as any).source === 'bao-hanh') {
      if (updatedData.status === 'Chờ tiếp nhận') backendStatus = 'Mở';
      if (updatedData.status === 'Đang xử lý') backendStatus = 'Đang khảo sát';
      if (updatedData.status === 'Đã hoàn tất') backendStatus = 'Đã khắc phục';
      if (updatedData.status === 'Đã hủy yêu cầu') backendStatus = 'Đóng';
    } else {
      if (updatedData.status === 'Chờ tiếp nhận') backendStatus = 'Yêu cầu mới';
      if (updatedData.status === 'Đang xử lý') backendStatus = 'Đang xử lý';
      if (updatedData.status === 'Đã hoàn tất') backendStatus = 'Đã hoàn tiền'; // Or 'Đã hoàn tất' if you want a general one, but DoiTra has 'Đã hoàn tiền'
      if (updatedData.status === 'Đã hủy yêu cầu') backendStatus = 'Bị từ chối';
    }

    try {
      let endpoint = '';
      let payload: any = {
        status: backendStatus,
        phuongAn: updatedData.resolution
      };

      // Depending on the ticket source, route to the correct update endpoint
      if ((selectedTicket as any).source === 'bao-hanh') {
        endpoint = `/warranties/${selectedTicket.rawId}/status`;
      } else {
        endpoint = `/doi-tra/${selectedTicket.rawId}/status`;
      }

      await api.patch(endpoint, payload);

      const updated = { ...selectedTicket, ...updatedData };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
      setSelectedTicket(updated);

      // Sync state with entries for dashboard & monitoring
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
      } else if (type === 'WARRANTY') {
        // Find order by customer for warranty if no direct link
        const item = entries.find(e => e.id === id);
        // Often warranty is linked to a customer, we show their latest order or let them choose
        // For now, let's try to fetch the item's info which might contain linked order info
        const resTicket = await api.get(`/warranties/${id}`);
        // If we don't have a direct link in model, we show the products from the ticket or latest order
        if (resTicket.data.success) {
          // Logic for warranty details...
        }
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

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsChatLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      });
      const data = await response.json();
      if (data.success) setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: data.data.response, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: `❌ Lỗi: ${error.message || 'Không thể kết nối đến máy chủ AI.'}`, timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">AI</span> &amp; Trung Tâm Hỗ Trợ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Giám sát tương tác &amp; xử lý khiếu nại khách hàng VTSC</p>
        </div>
      </div>

      {/* Main Tab Switcher (Pill Tabs) */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1.5 w-fit mb-8">
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
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">Tổng Sự Vụ Đổi Trả</span>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <RefreshCcw size={18} className="text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {entries.filter(e => e.type === 'RETURN').length}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">Khiếu Nại Kỹ Thuật (BH)</span>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Shield size={18} className="text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {entries.filter(e => e.type === 'WARRANTY').length}
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">Đơn Hàng Gần Đây</span>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {STATS.normal}
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">Việc Cần Xử Lý Ngay</span>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock size={18} className="text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {STATS.pending}
              </div>
            </div>
          </div>

          {/* Toolbar (Search & Filter) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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

              {/* Segmented Control */}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Phân loại</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Mã Yêu Cầu</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Nội dung / Khiếu nại</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">NV Phụ Trách</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Thao tác</th>
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
                        className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${entry.type === 'RETURN'
                            ? 'bg-orange-100 text-orange-700'
                            : entry.type === 'WARRANTY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
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
                            className="bg-transparent border-none p-0 cursor-pointer text-left font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                          >
                            {entry.customerName}
                          </button>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-600" title={entry.issue}>
                          {entry.issue}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                              {entry.staffName ? entry.staffName.charAt(0) : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-sm">{entry.staffName}</span>
                              <span className="text-xs text-slate-400">ID: {entry.staffId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${['Đã hoàn tất', 'DA_GIAO', 'Đã khắc phục', 'Đã hoàn tiền'].includes(entry.status)
                            ? 'bg-emerald-100 text-emerald-700'
                            : ['Yêu cầu mới', 'CHO_XAC_NHAN'].includes(entry.status)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                            }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
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
                              title="Quản lý & Giải quyết"
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
        <div>
          <div className="flex items-center justify-between mb-6">
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

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Mã Ticket</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Loại</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Trạng thái</th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400 italic">
                        Chưa có ticket nào. Hãy tạo ticket mới!
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => {
                      const typeBadge: Record<string, string> = {
                        'Bảo hành': 'bg-blue-100 text-blue-700',
                        'Khiếu nại': 'bg-rose-100 text-rose-700',
                        'Đổi trả': 'bg-orange-100 text-orange-700'
                      };
                      const statusBadge: Record<string, string> = {
                        'Chờ tiếp nhận': 'bg-rose-100 text-rose-700',
                        'Đang xử lý': 'bg-amber-100 text-amber-700',
                        'Đã hoàn tất': 'bg-emerald-100 text-emerald-700',
                        'Đã hủy yêu cầu': 'bg-slate-100 text-slate-500'
                      };
                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => openTicketDetail(ticket)}
                          className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-semibold text-slate-900">{ticket.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{ticket.customer}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{ticket.phoneOrContract}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadge[ticket.type] || 'bg-slate-100 text-slate-600'}`}>
                              {ticket.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                              {ticket.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">{ticket.createdAt}</td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <button
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                              onClick={() => openTicketDetail(ticket)}
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

          {/* Removed Modals from here */}
        </div>
      )}

      {/* Modals (Available across all tabs) */}
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

      {/* Specific Order Specs Modal */}
      {isSpecOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
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

                  {orderDetails.GhiChu && (
                    <div className="p-4 bg-amber-50/50 border-l-4 border-amber-500 rounded-r-xl">
                      <div className="text-xs font-bold text-amber-800 mb-1">Ghi chú kỹ thuật đơn hàng:</div>
                      <div className="text-sm text-amber-900 leading-relaxed">{orderDetails.GhiChu}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Action Modal */}
      {isActionOpen && targetEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
              {/* Staff Assignment */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1.5">
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

              {/* Resolution Plan */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1.5">
                  <PenTool size={16} /> Phương án giải quyết &amp; Thực thi
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-28 resize-none leading-relaxed"
                  placeholder="Ghi rõ các bước giải quyết cho khách hàng (Vd: Hoàn 50% tiền, Gửi mẫu sơn mới, KT xuống tận nhà...)"
                  value={resolutionPlan}
                  onChange={e => setResolutionPlan(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
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

      {/* Customer Detail Modal (Order History) */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  <div key={o._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-blue-600 text-base">#{o.MaDonHang}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {o.TrangThai}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
                      <div>Ngày: {new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                      <div className="font-semibold text-slate-800">Tổng: {o.TongTien?.toLocaleString()} ₫</div>
                      <button
                        onClick={() => { setIsDetailOpen(false); openOrderSpecs(o._id, 'ORDER'); }}
                        className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-left font-medium"
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

      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-50 border-none cursor-pointer"
      >
        {isChatOpen ? <X size={24} className="text-white" /> : <Bot size={24} className="text-white" />}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl transition-all duration-300 flex flex-col fixed bottom-24 right-8 w-96 h-[500px] z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center gap-2">
            <Bot size={20} />
            <div>
              <span className="font-bold text-sm block">VTSC AI Support</span>
              <span className="text-[10px] text-blue-100">Hỗ trợ tra cứu &amp; CSKH thời gian thực</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSubmitChat}
            className="p-4 border-t border-slate-200 bg-white flex gap-2"
          >
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Hỏi AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors border-none cursor-pointer">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
