'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User as UserIcon, Loader2, Info, MessageSquare,
  X, Search, Filter, RefreshCcw, Shield, Package, AlertCircle,
  TrendingDown, TrendingUp, CheckCircle2, Clock, Eye, Settings,
  FileText, Check, Activity, ChevronRight, ShoppingBag, CreditCard,
  UserCheck, ClipboardList, PenTool
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

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

  useEffect(() => {
    // Session Init
    const sid = localStorage.getItem('vtsc_chat_session') || `session_${Date.now()}`;
    localStorage.setItem('vtsc_chat_session', sid);
    setSessionId(sid);

    // History Load
    fetch(`http://localhost:5000/api/chatbot/history/${sid}`)
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
  }, []);

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/nhan-vien');
      if (res.data.success) {
        // Filter for Technical department (matching 'R&D Kỹ Thuật Máy' from staff records)
        const filtered = res.data.data.filter((nv: any) =>
          nv.BoPhan?.includes('R&D Kỹ Thuật Máy')
        );
        setAllStaff(filtered);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      const [returnsRes, warrantyRes, ordersRes] = await Promise.all([
        api.get('/doi-tra'),
        api.get('/bao-hanh'),
        api.get('/don-hang')
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
        const resTicket = await api.get(`/bao-hanh/${id}`);
        // If we don't have a direct link in model, we show the products from the ticket or latest order
        if (resTicket.data.success) {
          // Logic for warranty details...
        }
      }

      if (orderId && orderId.length > 5) {
        const res = await api.get(`/don-hang/${orderId}`);
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
      const res = await api.get(`/don-hang`);
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
      else if (targetEntry.type === 'WARRANTY') endpoint = `/bao-hanh/${targetEntry.id}/status`;
      else if (targetEntry.type === 'ORDER') endpoint = `/don-hang/${targetEntry.id}/status`;

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
      const response = await fetch('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      });
      const data = await response.json();
      if (data.success) setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: data.data.response, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: `❌ Lỗi: ${error.message || 'Không thể kết nối đến máy chủ AI.'}`, timestamp: new Date() }]);
    } finally { setIsChatLoading(false); }
  };

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      {/* Background decorations removed as per prism removal request */}

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(to right, #0267ffff, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          AI & Trung Tâm Hỗ Trợ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>Giám sát tương tác & xử lý khiếu nại khách hàng VTSC</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><RefreshCcw size={22} /></div>
          <div className="kpi-label">Tổng Sự Vụ Đổi Trả</div>
          <div className="kpi-value">{entries.filter(e => e.type === 'RETURN').length}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Shield size={22} /></div>
          <div className="kpi-label">Khiếu Nại Kỹ Thuật (BH)</div>
          <div className="kpi-value">{entries.filter(e => e.type === 'WARRANTY').length}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đơn Hàng Gần Đây</div>
          <div className="kpi-value">{STATS.normal}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-label">Việc Cần Xử Lý Ngay</div>
          <div className="kpi-value">{STATS.pending}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input type="text" className="form-input" placeholder="Tìm Mã #, Khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ id: 'ALL', label: 'Tất cả' }, { id: 'PROBLEM', label: 'Hỗ trợ đặc biệt' }, { id: 'NORMAL', label: 'Vận hành chuẩn' }].map(tab => (
                <button key={tab.id} className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(tab.id as any)}>{tab.label}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={fetchDashboardData}><RefreshCcw size={16} /> Làm mới dữ liệu</button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Phân loại</th>
              <th>Mã Đơn Hàng</th>
              <th>Khách hàng</th>
              <th>Nội dung / Khiếu nại</th>
              <th>NV Phụ Trách (ĐT/BH)</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingDashboard ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="animate-spin" style={{ display: 'inline' }} /> Đang xử lý dữ liệu thực tế...</td></tr>
            ) : filteredEntries.map(entry => (
              <tr key={`${entry.type}-${entry.id}`}>
                <td>
                  <span className={`badge ${entry.type === 'RETURN' ? 'rejected' : entry.type === 'WARRANTY' ? 'testing' : 'approved'}`}>
                    {entry.type === 'RETURN' ? 'Đổi Trả' : entry.type === 'WARRANTY' ? 'Bảo Hành' : 'Đơn Hàng'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => openOrderSpecs(entry.id, entry.type)}
                    className="hover:underline transition-all"
                    style={{ fontWeight: 800, color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    #{entry.refId}
                  </button>
                </td>
                <td>
                  <button onClick={() => openCustomerDetails(entry.customerId, entry.customerName)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }} className="hover:text-[var(--accent-cyan)] transition-colors">
                    {entry.customerName}
                  </button>
                </td>
                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.issue}>{entry.issue}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-purple)', fontSize: 13 }}>{entry.staffName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {entry.staffId}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${['Đã hoàn tất', 'DA_GIAO', 'Đã khắc phục', 'Đã hoàn tiền'].includes(entry.status) ? 'approved' : 'warning'}`}>
                    {entry.status}
                  </span>
                </td>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" title="Quản lý & Giải quyết" onClick={() => openActionModal(entry)}><Settings size={16} /></button>
                    <button className="btn btn-ghost btn-sm" title="Hỗ trợ AI" onClick={() => setIsChatOpen(true)}><Bot size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specific Order Specs Modal */}
      {isSpecOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.9)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s', background: 'var(--bg-card)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 10, background: 'var(--accent-cyan-soft)', borderRadius: '12px' }}><ShoppingBag className="text-[var(--accent-cyan)]" /></div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Chi Tiết Đơn Hàng Thành Phẩm</h3>
                  {orderDetails && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Mã đơn: #{orderDetails.MaDonHang}</span>}
                </div>
              </div>
              <button onClick={() => { setIsSpecOpen(false); setOrderDetails(null); }} className="btn btn-ghost"><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {isLoadingSpecs ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}><Loader2 className="animate-spin mx-auto mb-4" /> Đang truy xuất thông số kỹ thuật lớp phủ...</div>
              ) : !orderDetails ? (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>Không tìm thấy thông tin đơn hàng gốc cho sự vụ này.</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div className="glass-card" style={{ padding: 16, background: 'rgba(50, 121, 121, 0.02)' }}>
                      <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Tổng thanh toán</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-cyan)' }}>{orderDetails.TongTien?.toLocaleString()} ₫</div>
                    </div>
                    <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Phương thức</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><CreditCard size={14} /> {orderDetails.PhuongThucThanhToan}</div>
                    </div>
                    <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Trạng thái giao</div>
                      <div style={{ fontWeight: 600 }}><div className="badge approved">{orderDetails.TrangThai}</div></div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} /> Danh mục sản phẩm & Hệ màu</h4>
                  <table className="data-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Tên Sản Phẩm / Dòng Sơn</th>
                        <th>Mã Màu (AkzoNobel)</th>
                        <th>Màu Sắc</th>
                        <th style={{ textAlign: 'right' }}>Số Lượng</th>
                        <th style={{ textAlign: 'right' }}>Đơn Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.Items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.SanPham?.TenDongSon || item.TenSanPham}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{item.MaMau}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '4px', background: item.HexCode || '#888', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                              <span style={{ fontSize: 12 }}>{item.TenMau || 'Tiêu chuẩn'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>{item.SoLuong} Thùng</td>
                          <td style={{ textAlign: 'right' }}>{item.DonGia?.toLocaleString()} ₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orderDetails.GhiChu && (
                    <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, borderLeft: '4px solid var(--accent-amber)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Ghi chú kỹ thuật đơn hàng:</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>{orderDetails.GhiChu}</div>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div className="glass-card" style={{ width: '500px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s', background: 'var(--bg-card)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Quản Lý & Giải Quyết</h3>
              <button onClick={() => setIsActionOpen(false)} className="btn btn-ghost"><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Staff Assignment */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>
                  <UserCheck size={16} /> Nhân viên phụ trách hỗ trợ (CSKH/Bảo hành)
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', background: '#000000' }}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>
                  <PenTool size={16} /> Phương án giải quyết & Thực thi
                </label>
                <textarea
                  className="form-input"
                  style={{ width: '100%', minHeight: 120, resize: 'none' }}
                  placeholder="Ghi rõ các bước giải quyết cho khách hàng (Vd: Hoàn 50% tiền, Gửi mẫu sơn mới, KT xuống tận nhà...)"
                  value={resolutionPlan}
                  onChange={e => setResolutionPlan(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  disabled={isUpdating}
                  onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đang khảo sát' : targetEntry.type === 'ORDER' ? 'DANG_XU_LY' : 'Đang xử lý')}
                  className="btn btn-ghost" style={{ justifyContent: 'center', height: 48, fontWeight: 700 }}
                >Xử lý yêu cầu</button>
                <button
                  disabled={isUpdating}
                  onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đang khảo sát' : targetEntry.type === 'ORDER' ? 'DANG_GIAO' : 'Đang xử lý')}
                  className="btn btn-ghost" style={{ justifyContent: 'center', height: 48, fontWeight: 700 }}
                >Đang thực hiện...</button>
              </div>

              <button
                disabled={isUpdating}
                onClick={() => updateEntryStatus(targetEntry.type === 'WARRANTY' ? 'Đã khắc phục' : targetEntry.type === 'ORDER' ? 'DA_GIAO' : 'Đã hoàn tiền')}
                className="btn btn-primary" style={{ width: '100%', height: 52, fontWeight: 800, background: 'var(--accent-emerald)', border: 'none' }}
              >
                <Check size={20} /> HOÀN TẤT & ĐÓNG SỰ VỤ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal (Order History) */}
      {isDetailOpen && selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s', background: 'var(--bg-card)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Lịch sử giao dịch: {selectedCustomer.name}</h3>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-ghost"><X size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {isLoadingOrders ? <Loader2 className="animate-spin mx-auto" /> : customerOrders.map((o: any) => (
                <div key={o._id} className="glass-card" style={{ padding: 16, marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>#{o.MaDonHang}</span>
                    <span className="badge approved">{o.TrangThai}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', fontSize: 12 }}>
                    <div>Ngày: {new Date(o.createdAt).toLocaleDateString()}</div>
                    <div>Tổng: {o.TongTien?.toLocaleString()} ₫</div>
                    <button onClick={() => { setIsDetailOpen(false); openOrderSpecs(o._id, 'ORDER'); }} className="text-[var(--accent-cyan)] hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Xem chi tiết hàng hóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Bubble */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000 }}>
        {isChatOpen ? <X size={28} color="white" /> : <Bot size={28} color="white" />}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="glass-card" style={{ position: 'fixed', bottom: '100px', right: '30px', width: '400px', height: '550px', display: 'flex', flexDirection: 'column', zIndex: 999, overflow: 'hidden', padding: 0, background: 'var(--bg-card)' }}>
          <div style={{ background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))', padding: '16px', color: 'white' }}>
            <Bot size={24} /> <span style={{ fontWeight: 800 }}>VTSC AI Support</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 15 }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px', background: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--bg-card)', color: msg.role === 'user' ? 'white' : 'var(--text-primary)' }}>{msg.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmitChat} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
            <input type="text" className="form-input" style={{ flex: 1, borderRadius: '20px' }} placeholder="Hỏi AI..." value={input} onChange={e => setInput(e.target.value)} />
            <button className="btn btn-primary" style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}><Send size={18} /></button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
