'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight, ArrowLeft, MapPin, RefreshCw, ShoppingBag, Circle, Plus, X } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import CustomerOrderModal from '@/components/CustomerOrderModal';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock size={13} /> },
  DANG_XU_LY: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <Package size={13} /> },
  DANG_GIAO: { label: 'Đang giao', color: 'bg-violet-50 text-violet-700 border border-violet-200', icon: <Truck size={13} /> },
  DA_GIAO: { label: 'Đã giao', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle2 size={13} /> },
  DA_HUY: { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border border-red-200', icon: <XCircle size={13} /> },
};

export default function CustomerOrderPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tenNguoiNhan: '', sdtNguoiNhan: '', DiaChiGiaoHang: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const [requestModalOrder, setRequestModalOrder] = useState<any>(null);
  const [requestForm, setRequestForm] = useState<{LoaiYeuCau: string, LyDo: string, HinhAnh: string[]}>({ LoaiYeuCau: 'Đổi trả', LyDo: '', HinhAnh: [] });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleExpand = async (order: any) => {
    if (expandedId === order._id) {
      setExpandedId(null);
      setTrackingInfo(null);
      setEditingInfoId(null);
    } else {
      setExpandedId(order._id);
      setTrackingInfo(null);
      setEditingInfoId(null);
      if (['DANG_XU_LY', 'DANG_GIAO', 'DA_GIAO'].includes(order.TrangThai)) {
        setLoadingTracking(true);
        try {
          const res = await api.get(`/van-chuyen/order/${order._id}`);
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
      const res = await api.get('/don-hang');
      if (res.data.success) setOrders(res.data.data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (orderId: string) => {
    setSavingInfo(true);
    try {
      const res = await api.patch(`/don-hang/${orderId}/info`, editForm);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...editForm } : o));
        setEditingInfoId(null);
        alert('Cập nhật thông tin thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      const res = await api.patch(`/don-hang/${orderId}/cancel`);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, TrangThai: 'DA_HUY' } : o));
        alert('Hủy đơn hàng thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng!');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingImage(true);
    try {
      const res = await api.post('/files/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.url) {
        setRequestForm(prev => ({ ...prev, HinhAnh: [...prev.HinhAnh, res.data.url] }));
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể tải ảnh lên. Vui lòng thử lại sau.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.LyDo) {
      alert('Vui lòng nhập lý do');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const res = await api.post('/doi-tra', {
        DonHang: requestModalOrder._id,
        KhachHang: requestModalOrder.KhachHang?._id || requestModalOrder.KhachHang || user?.profile?._id,
        LyDo: requestForm.LyDo,
        LoaiYeuCau: requestForm.LoaiYeuCau,
        HinhAnh: requestForm.HinhAnh
      });
      if (res.data.success) {
        alert('Gửi yêu cầu thành công! Yêu cầu của bạn đã được chuyển đến bộ phận CSKH.');
        setRequestModalOrder(null);
        setRequestForm({ LoaiYeuCau: 'Đổi trả', LyDo: '', HinhAnh: [] });
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.TrangThai === filter);

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
    { key: 'DANG_XU_LY', label: 'Đang xử lý' },
    { key: 'DANG_GIAO', label: 'Đang giao' },
    { key: 'DA_GIAO', label: 'Đã giao' },
    { key: 'DA_HUY', label: 'Đã hủy' },
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
                        <div className="text-[11px] text-slate-400">SL: {item.SoLuong} × {item.DonGia?.toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                    <span className="font-black text-slate-800 text-[13px]">{item.ThanhTien?.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                {!isExpanded && order.Items?.length > 2 && (
                  <p className="text-[11px] text-slate-400 font-bold">+{order.Items.length - 2} sản phẩm khác</p>
                )}
              </div>

              {/* Expanded address & info */}
              {isExpanded && (
                <div className="px-5 py-4 border-t border-slate-50 text-sm">
                  {editingInfoId === order._id ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-[13px] mb-2">Chỉnh sửa thông tin người nhận</h4>
                      <input 
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" 
                        placeholder="Tên người nhận" 
                        value={editForm.tenNguoiNhan} 
                        onChange={e => setEditForm({...editForm, tenNguoiNhan: e.target.value})} 
                      />
                      <input 
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" 
                        placeholder="Số điện thoại" 
                        value={editForm.sdtNguoiNhan} 
                        onChange={e => setEditForm({...editForm, sdtNguoiNhan: e.target.value})} 
                      />
                      <textarea 
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" 
                        placeholder="Địa chỉ giao hàng" 
                        value={editForm.DiaChiGiaoHang} 
                        onChange={e => setEditForm({...editForm, DiaChiGiaoHang: e.target.value})} 
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingInfoId(null)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                        <button disabled={savingInfo} onClick={() => handleUpdateInfo(order._id)} className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">Lưu thông tin</button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 relative cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                      onClick={() => {
                        if (order.TrangThai === 'CHO_XAC_NHAN') {
                          setEditForm({ 
                            tenNguoiNhan: order.TenNguoiNhan || user?.profile?.HoTen || '', 
                            sdtNguoiNhan: order.SDTNguoiNhan || user?.profile?.SoDienThoai || '', 
                            DiaChiGiaoHang: order.DiaChiGiaoHang === "Địa chỉ mặc định" ? (user?.profile?.DiaChi || "") : (order.DiaChiGiaoHang || user?.profile?.DiaChi || '') 
                          });
                          setEditingInfoId(order._id);
                        }
                      }}
                    >
                      <h4 className="font-bold text-slate-800 text-[13px] mb-2 flex items-center gap-2">
                        Thông tin người nhận
                        {order.TrangThai === 'CHO_XAC_NHAN' && (
                          <span className="text-[10px] font-medium text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Nhấn để sửa</span>
                        )}
                      </h4>
                      <div className="space-y-1.5 text-slate-600 text-xs">
                        <p><strong className="text-slate-500 font-medium">Người nhận:</strong> <span className="font-semibold text-slate-800">{order.TenNguoiNhan || user?.profile?.HoTen || user?.username || 'Chưa cập nhật'}</span></p>
                        <p><strong className="text-slate-500 font-medium">Số điện thoại:</strong> <span className="font-semibold text-slate-800">{order.SDTNguoiNhan || user?.profile?.SoDienThoai || 'Chưa cập nhật'}</span></p>
                        <div className="flex items-start gap-1">
                          <strong className="text-slate-500 font-medium shrink-0">Địa chỉ:</strong>
                          <span className="font-medium text-slate-800">{order.DiaChiGiaoHang === "Địa chỉ mặc định" ? (user?.profile?.DiaChi || "Chưa cập nhật") : (order.DiaChiGiaoHang || user?.profile?.DiaChi || 'Chưa cập nhật')}</span>
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Tổng tiền</p>
                  <p className="font-black text-lg text-slate-900">{order.TongTien?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="flex items-center gap-2">
                  {order.TrangThai === 'CHO_XAC_NHAN' && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-4 py-2 rounded-2xl text-xs font-bold border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  {order.TrangThai === 'DA_GIAO' && (
                    <button
                      onClick={() => setRequestModalOrder(order)}
                      className="px-4 py-2 rounded-2xl text-xs font-bold border border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all cursor-pointer"
                    >
                      Yêu cầu hỗ trợ (Đổi trả/Bảo hành)
                    </button>
                  )}
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

      {requestModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900 mb-4">Yêu cầu hỗ trợ đơn hàng #{requestModalOrder.MaDonHang}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Loại yêu cầu</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={requestForm.LoaiYeuCau}
                  onChange={e => setRequestForm({...requestForm, LoaiYeuCau: e.target.value})}
                >
                  <option value="Đổi trả">Đổi trả sản phẩm</option>
                  <option value="Bảo hành">Bảo hành</option>
                  <option value="Khiếu nại">Khiếu nại</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nội dung / Lý do</label>
                <textarea 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  rows={4}
                  placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                  value={requestForm.LyDo}
                  onChange={e => setRequestForm({...requestForm, LyDo: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hình ảnh thực tế (Lỗi/Hỏng/Sai màu)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {requestForm.HinhAnh.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={`https://gateway.pinata.cloud/ipfs/${url}`} alt={`Hình ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setRequestForm(prev => ({...prev, HinhAnh: prev.HinhAnh.filter((_, i) => i !== idx)}))}
                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer bg-slate-50 relative">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                    {isUploadingImage ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
                    <span className="text-[9px] font-bold mt-1 uppercase">Thêm</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">Giúp chúng tôi xử lý nhanh hơn bằng cách cung cấp hình ảnh rõ nét về tình trạng sản phẩm.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setRequestModalOrder(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border-none"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSubmitRequest} 
                disabled={isSubmittingRequest}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
              >
                {isSubmittingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
