'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight, ArrowLeft, MapPin, RefreshCw, ShoppingBag, Circle, LifeBuoy, Star, FileCheck, AlertCircle } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import CustomerOrderModal from '@/components/CustomerOrderModal';
import CustomerCreateTicketModal from '@/components/CustomerCreateTicketModal';
import CustomerTicketDetailModal from '@/components/CustomerTicketDetailModal';

const STATUS_MAP: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
  CHO_XAC_NHAN: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock size={13} /> },
  DANG_XU_LY: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <Package size={13} /> },
  DA_XU_LY_XONG: { label: 'Đã xử lý xong', color: 'bg-purple-50 text-purple-700 border border-purple-200', icon: <FileCheck size={13} /> },
  DANG_GIAO: { label: 'Đang giao', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200', icon: <Truck size={13} /> },
  DA_GIAO: { label: 'Đã giao', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle2 size={13} /> },
  DA_HUY: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border border-rose-200', icon: <AlertCircle size={13} /> }
};

export default function CustomerOrderPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any>(null);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [creatingTicketFor, setCreatingTicketFor] = useState<any>(null);
  const [orderRatings, setOrderRatings] = useState<Record<string, { sp: number, dv: number }>>({});

  const handleRateTicket = async (ticketId: string, type: string, rating: number) => {
    try {
      const endpoint = type === 'WARRANTY' ? `/warranties/${ticketId}/status` : `/doi-tra/${ticketId}/status`;
      await api.patch(endpoint, {
        KhachHangDanhGia: rating
      });
      fetchOrders(); // Refresh to show the rating
    } catch (e) {
      console.error('Lỗi khi đánh giá:', e);
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  };

  const handleExpand = async (order: any) => {
    if (expandedId === order._id) {
      setExpandedId(null);
      setTrackingInfo(null);
    } else {
      setExpandedId(order._id);
      setTrackingInfo(null);
      if (['DANG_XU_LY', 'DANG_GIAO', 'DA_GIAO'].includes(order.TrangThai)) {
        setLoadingTracking(true);
        try {
          const res = await api.get(`/shipping/order/${order._id}`);
          if (res.data.success) {
            setTrackingInfo(res.data.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingTracking(false);
        }
      }
    }
  };

  const handleRateOrderSubmit = async (orderId: string) => {
    const rating = orderRatings[orderId];
    if (!rating || !rating.sp || !rating.dv) {
      alert("Vui lòng đánh giá cả Chất lượng sản phẩm và Chất lượng dịch vụ!");
      return;
    }
    try {
      const res = await api.patch(`/orders/${orderId}/rate`, { ChatLuongSanPham: rating.sp, ChatLuongDichVu: rating.dv });
      if (res.data.success) {
        alert("Đã đánh giá đơn hàng thành công!");
        fetchOrders();
      }
    } catch (e: any) {
      alert("Đánh giá thất bại: " + (e.response?.data?.message || e.message));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordersRes, returnsRes, warrantyRes] = await Promise.all([
        api.get('/orders'),
        api.get('/doi-tra'),
        api.get('/warranties')
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.data);

      const allTickets = [];
      if (returnsRes.data.success) {
        allTickets.push(...returnsRes.data.data.map((t: any) => ({ ...t, _ticketType: 'RETURN' })));
      }
      if (warrantyRes.data.success) {
        allTickets.push(...warrantyRes.data.data.map((t: any) => ({ ...t, _ticketType: 'WARRANTY' })));
      }
      setTickets(allTickets);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.TrangThai === filter);

  const tabs = [
    { key: 'ALL', label: 'Tất cả đơn' },
    { key: 'CHO_XAC_NHAN', label: 'Chờ xử lý' },
    { key: 'DANG_XU_LY', label: 'Đang xử lý' },
    { key: 'DA_XU_LY_XONG', label: 'Đã xử lý xong' },
    { key: 'DANG_GIAO', label: 'Đang giao' },
    { key: 'DA_GIAO', label: 'Đã giao' },
    { key: 'DA_HUY', label: 'Đã hủy' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 cursor-pointer">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900">Đơn hàng của tôi</h1>
            <p className="text-[11px] text-slate-400 font-medium">{user?.username || ''}</p>
          </div>
          <button onClick={fetchOrders} className="ml-auto w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 cursor-pointer">
            <RefreshCw size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${filter === t.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}>
              {t.label}
              {t.key !== 'ALL' && orders.filter(o => o.TrangThai === t.key).length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter === t.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {orders.filter(o => o.TrangThai === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
            <p className="text-sm font-bold text-slate-400">Đang tải đơn hàng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <ShoppingBag size={28} className="text-slate-300" />
            </div>
            <p className="font-black text-slate-400 text-base">Chưa có đơn hàng</p>
            <Link href="/" className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-bold no-underline">
              Mua sắm ngay
            </Link>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.TrangThai] || { label: order.TrangThai, color: 'bg-slate-50 text-slate-600 border border-slate-200', icon: <Package size={13} /> };
          const isExpanded = expandedId === order._id;
          const isShipping = order.TrangThai === 'DANG_GIAO';

          return (
            <div key={order._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div>
                  <button
                    onClick={() => setSelectedOrderDetails(order)}
                    className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border-none cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    #{order.MaDonHang}
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${st.color}`}>
                  {st.icon} {st.label}
                </span>
              </div>

              {/* Items preview */}
              <div className="px-5 py-3 border-t border-slate-50 space-y-2">
                {order.Items?.slice(0, isExpanded ? undefined : 2).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[13px]">{item.TenSanPham || 'Sản phẩm'}</div>
                        <div className="text-[11px] text-slate-400">SL: {item.SoLuong} × {item.DonGia?.toLocaleString('vi-VN')}đ {item.MaMau ? `| Màu: ${item.MaMau}` : ''}</div>
                      </div>
                    </div>
                    <span className="font-black text-slate-800 text-[13px]">{item.ThanhTien?.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                {!isExpanded && order.Items?.length > 2 && (
                  <p className="text-[11px] text-slate-400 font-bold">+{order.Items.length - 2} sản phẩm khác</p>
                )}
              </div>

              {/* Expanded address */}
              {isExpanded && (order.DiaChiGiaoHang || user?.profile?.DiaChi) && (
                <div className="px-5 py-3 border-t border-slate-50 flex items-start gap-2 text-xs text-slate-500">
                  <MapPin size={13} className="text-rose-400 mt-0.5 shrink-0" />
                  <span className="font-medium">{order.DiaChiGiaoHang === "Địa chỉ mặc định" ? (user?.profile?.DiaChi || "Chưa cập nhật") : (order.DiaChiGiaoHang || user?.profile?.DiaChi || "Chưa cập nhật")}</span>
                </div>
              )}

              {/* In-line Tracking Timeline */}
              {isExpanded && trackingInfo && (
                <div className="px-5 py-5 bg-slate-50/80 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Truck size={13} className="text-blue-500" /> Tiến độ giao hàng
                  </h4>
                  <div className="space-y-5 pl-1">
                    {trackingInfo.LoTrinh?.map((log: any, idx: number) => {
                      const isComplete = log.Status === "COMPLETE";
                      const isProcessing = log.Status === "PROCESSING";
                      return (
                        <div key={idx} className="flex items-start gap-4 relative">
                          {/* Vertical Line */}
                          {idx < trackingInfo.LoTrinh.length - 1 && (
                            <div className="absolute left-2 top-5 bottom-[-24px] w-[2px] bg-slate-200"></div>
                          )}
                          {/* Dot */}
                          <div className="relative z-10 bg-slate-50 mt-0.5">
                            {isComplete
                              ? <CheckCircle2 size={16} className="text-emerald-500 bg-white rounded-full" />
                              : isProcessing
                                ? <div className="w-4 h-4 rounded-full bg-blue-600 border-[3px] border-blue-100"></div>
                                : <Circle size={16} className="text-slate-300 bg-white rounded-full" />
                            }
                          </div>
                          <div className="-mt-0.5">
                            <p className={`text-[13px] leading-tight mb-1 ${isComplete || isProcessing ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>{log.NoiDung}</p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {log.ThoiGian ? new Date(log.ThoiGian).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {isExpanded && loadingTracking && (
                <div className="px-5 py-6 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 border-t border-slate-50 bg-slate-50/50">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
                  Đang tải thông tin lộ trình...
                </div>
              )}
              {/* Customer Tickets Section */}
              {isExpanded && (
                <div className="px-5 py-5 border-t border-slate-100 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LifeBuoy size={13} className="text-orange-500" /> Hỗ trợ & Hậu mãi
                    </h4>
                    {!(order.DanhGia && order.DanhGia.NgayDanhGia) && (
                      <button
                        onClick={() => setCreatingTicketFor(order)}
                        className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Yêu cầu hỗ trợ
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {tickets.filter(t => t.DonHang?._id === order._id || t.DonHang === order._id).map((ticket, idx) => {
                      const isWarranty = ticket._ticketType === 'WARRANTY';
                      const title = isWarranty ? `Bảo hành ${ticket.SanPham || ''}` : `${ticket.LoaiYeuCau} hàng`;
                      const isCompleted = ['Đã hoàn tất', 'Đã hoàn tiền', 'Đã khắc phục', 'Đóng'].includes(ticket.TrangThai);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => setSelectedTicketDetails(ticket)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-xs text-slate-800">{title}</div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {ticket.TrangThai}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mb-2">Lý do: {ticket.LyDo || ticket.NoiDungLoi}</p>
                          
                          {ticket.HinhAnh && ticket.HinhAnh.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {ticket.HinhAnh.map((imgUrl: string, iIdx: number) => (
                                <a 
                                  key={iIdx} 
                                  href={imgUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-12 h-12 rounded overflow-hidden border border-slate-200 hover:ring-1 hover:ring-blue-500 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img 
                                    src={imgUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                                    alt={`HinhAnh-${iIdx}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {ticket.PhuongAnGiaiQuyet && (
                            <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-700 mt-2">
                              <span className="font-bold text-blue-600">Phản hồi từ Admin:</span> {ticket.PhuongAnGiaiQuyet}
                            </div>
                          )}
                          {isCompleted && (
                            <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-col items-center">
                              {ticket.KhachHangDanhGia ? (
                                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                  Đã đánh giá: {Array.from({ length: ticket.KhachHangDanhGia }).map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                                  <span className="ml-1 text-emerald-600 font-bold">(Đã kết thúc)</span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[10px] font-bold text-slate-400 mb-1">Đánh giá 5★ để đóng yêu cầu:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={(e) => { e.stopPropagation(); handleRateTicket(ticket._id, ticket._ticketType, star); }}
                                        className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                                      >
                                        <Star size={16} className={star === 5 ? 'hover:fill-amber-400' : ''} />
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {tickets.filter(t => t.DonHang?._id === order._id || t.DonHang === order._id).length === 0 && (
                      <div className="text-[11px] text-slate-400 italic py-2 text-center">
                        Bạn chưa có yêu cầu hỗ trợ nào cho đơn hàng này.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rating Section */}
              {isExpanded && order.TrangThai === 'DA_GIAO' && (
                <div className="px-5 py-5 border-t border-slate-100 bg-emerald-50/30">
                  <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star size={14} className="text-emerald-500 fill-emerald-500" /> Đánh giá đơn hàng
                  </h4>
                  {order.DanhGia && order.DanhGia.NgayDanhGia ? (
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-600">Chất lượng sản phẩm</span>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < order.DanhGia.ChatLuongSanPham ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-600">Chất lượng dịch vụ</span>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < order.DanhGia.ChatLuongDichVu ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}
                        </div>
                      </div>
                      <p className="text-[10px] italic text-slate-400 mt-2 text-center">Cảm ơn bạn đã đánh giá! (Yêu cầu hỗ trợ đã bị khóa)</p>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-700">Chất lượng sản phẩm:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setOrderRatings(prev => ({ ...prev, [order._id]: { ...prev[order._id], sp: star } }))} className="text-slate-300 hover:text-amber-400 transition-colors">
                              <Star size={18} className={(orderRatings[order._id]?.sp || 0) >= star ? 'text-amber-400 fill-amber-400' : ''} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-700">Chất lượng dịch vụ (Giao hàng, CSKH):</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setOrderRatings(prev => ({ ...prev, [order._id]: { ...prev[order._id], dv: star } }))} className="text-slate-300 hover:text-amber-400 transition-colors">
                              <Star size={18} className={(orderRatings[order._id]?.dv || 0) >= star ? 'text-amber-400 fill-amber-400' : ''} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRateOrderSubmit(order._id)}
                        className="mt-2 w-full py-2 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Gửi Đánh Giá
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Tổng tiền</p>
                  <p className="font-black text-lg text-slate-900">{order.TongTien?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExpand(order)}
                    className="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                  {isShipping && (
                    <Link
                      href={`/tracking?orderId=${order._id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-blue-600 text-white no-underline hover:bg-blue-700 transition-all"
                    >
                      <Truck size={13} /> Theo dõi
                    </Link>
                  )}
                  {order.TrangThai === 'DA_GIAO' && !(order.DanhGia && order.DanhGia.NgayDanhGia) && (
                    <button
                      onClick={() => setCreatingTicketFor(order)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all cursor-pointer border border-amber-200"
                    >
                      <LifeBuoy size={13} /> Yêu cầu Đổi trả / BH
                    </button>
                  )}
                  {order.TrangThai === 'DA_GIAO' && tickets.filter(t => t.DonHang?._id === order._id || t.DonHang === order._id).length > 0 && (
                    <button
                      onClick={() => {
                        if (!isExpanded) handleExpand(order);
                        // Scroll or simply just expanding is enough
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer border border-blue-200"
                    >
                      Đã có ({tickets.filter(t => t.DonHang?._id === order._id || t.DonHang === order._id).length}) Yêu cầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrderDetails && (
        <CustomerOrderModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
        />
      )}

      {creatingTicketFor && (
        <CustomerCreateTicketModal
          order={creatingTicketFor}
          onClose={() => setCreatingTicketFor(null)}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {selectedTicketDetails && (
        <CustomerTicketDetailModal
          ticket={selectedTicketDetails}
          onClose={() => setSelectedTicketDetails(null)}
        />
      )}
    </div>
  );
}

