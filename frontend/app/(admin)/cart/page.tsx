'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Eye, Trash2, Box, AlertCircle, CheckCircle2, Tag, Trash, User, MapPin, Plus, Truck, ArrowRight, QrCode, Beaker, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore, CartItem } from '@/lib/store/cartStore';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils/imageUrl';


interface KhachHang {
  _id: string;
  TenKhachHang: string;
  SDT: string;
  DiaChi: string;
}

export default function GioHangPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cartItems, cartTotal, fetchCart, updateQuantity: updateQuantityStore, clearCart: clearCartStore } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionId = useMemo(() => user?.id || 'GUEST_SESSION', [user]);
  const isAdminOrEmployee = user?.role === 'Admin' || user?.role === 'NhanVien';

  const getImageUrl = (path: any) => {
    return resolveImageUrl(path);
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
      fetchProducts();
      fetchCustomers();

      // Auto-select customer if current user is a customer
      if (!isAdminOrEmployee && user.profile) {
        setSelectedCustomerId(user.profile._id);
        setShippingAddress(user.profile.DiaChi || '');
      }
    }
  }, [user, sessionId]);

  const fetchCartItems = async () => {
    try {
      await fetchCart(sessionId);
    } catch (err) {
      console.error('Lỗi tải giỏ hàng', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/san-pham-son`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const endpoint = isAdminOrEmployee ? '/khach-hang' : `/khach-hang/${user?.profile?._id}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        setCustomers(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
      }
    } catch (err) {
      console.error('Lỗi tải khách hàng', err);
    }
  };

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const kh = customers.find(c => c._id === id);
    if (kh) {
      setShippingAddress(kh.DiaChi || '');
    }
  };

  const updateQuantity = async (sanPhamId: string, soLuong: number) => {
    try {
      const sp = products.find(p => p._id === sanPhamId);
      if (sp && soLuong > sp.TonKho) {
        alert(`Số lượng yêu cầu (${soLuong}) vượt quá tồn kho (${sp.TonKho})`);
        return;
      }

      await updateQuantityStore(sessionId, sanPhamId, soLuong);
    } catch (err) {
      console.error('Lỗi cập nhật', err);
    }
  };

  const handleRemoveItem = async (sanPhamId: string) => {
    if (!confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
    try {
      await updateQuantityStore(sessionId, sanPhamId, 0);
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm', err);
    }
  };

  const clearCart = async () => {
    if (!confirm('Bạn có muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await clearCartStore(sessionId);
      setDiscountCode('');
      setDiscountInfo(null);
      alert('Đã xóa giỏ hàng');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert('Giỏ hàng trống');
    if (!selectedCustomerId) return alert('Vui lòng chọn khách hàng');
    if (!shippingAddress) return alert('Vui lòng nhập địa chỉ giao hàng');

    setIsSubmitting(true);
    try {
      const res = await api.post('/orders/checkout', {
        sessionId: sessionId,
        khachHangId: selectedCustomerId,
        diaChiGiaoHang: shippingAddress,
        discountCode: discountInfo?.MaVoucher,
        ghiChu: `Đơn hàng từ giỏ hàng hệ thống - Người đặt: ${user?.username}`
      });

      if (res.data.success) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${res.data.data.MaDonHang}. Kho đã được cập nhật.`);
        router.push(isAdminOrEmployee ? '/orders' : '/my-orders');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!discountCode) return;
    setApplyingDiscount(true);
    try {
      const res = await api.post('/promotions/validate', { code: discountCode, cartTotal });
      if (res.data.success) {
        setDiscountInfo(res.data.data);
        alert('Áp dụng mã giảm giá thành công!');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi áp dụng voucher');
      setDiscountInfo(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const filteredProducts = products.filter(p => p.TenDongSon.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: '2.25rem', minHeight: '80vh', padding: '10px' }}>

      {/* Cột trái: Sản phẩm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>Danh mục sản phẩm</h2>
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '0 15px', borderRadius: 12 }}>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            style={{ background: 'transparent', border: 'none', padding: '15px 0' }}
            placeholder="Tìm kiếm dòng sơn..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map(sp => (
            <div key={sp._id} className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden transition-hover" style={{ padding: '15px', display: 'flex', gap: 15, alignItems: 'center' }}>
              <div style={{ width: 70, height: 70, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                {getImageUrl(sp.HinhAnh) ? <img src={getImageUrl(sp.HinhAnh)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Box size={24} color="#555" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{sp.TenDongSon}</div>
                <div style={{ color: '#2563eb', fontWeight: 800, fontSize: 14 }}>{(sp.DonGiaCoSo || 0).toLocaleString()} ₫</div>
                <div style={{ fontSize: '11px', color: sp.TonKho > 0 ? '#94a3b8' : '#e11d48', marginTop: 4 }}>Tồn kho: {sp.TonKho || 0}</div>
              </div>
              <button
                onClick={() => {
                  const existing = cartItems.find(i => i.SanPham?._id === sp._id);
                  updateQuantity(sp._id, existing ? existing.SoLuong + 1 : 1);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{ height: 35, padding: '0 12px', fontSize: 12 }}
                disabled={sp.TonKho <= 0}
              >
                {sp.TonKho > 0 ? '+ Thêm' : 'Hết'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cột phải: Checkout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', padding: '2.25rem', borderRadius: 16, border: '1px solid #e2e8f0', position: 'sticky', top: 20, height: 'fit-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, color: '#1e293b' }}>
            <ShoppingCart size={28} className="text-[#2563eb]" /> Giỏ Hàng
          </h2>
          {cartItems.length > 0 && (
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" onClick={clearCart} style={{ color: '#e11d48' }}>
              <Trash2 size={18} /> Xóa hết
            </button>
          )}
        </div>

        {/* Thông tin khách hàng & Giao hàng */}
        <div className="space-y-4 mb-6">
          {isAdminOrEmployee ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chọn Khách Hàng</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pl-10"
                  style={{ background: '#fffefeff' }}
                  value={selectedCustomerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.TenKhachHang} - {c.SDT}</option>)}
                </select>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{user?.profile?.TenKhachHang}</div>
                  <div className="text-xs text-slate-500">Đặt hàng cho tài khoản này</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Địa chỉ giao hàng</label>
            <div className="relative">
              <textarea
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pl-10 py-3 min-h-[80px]"
                placeholder="Nhập địa chỉ giao hàng chi tiết..."
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
              />
              <MapPin className="absolute left-3 top-3 text-slate-600" size={16} />
            </div>
          </div>
        </div>

        {/* Premium Horizontal Navigation Slider */}
        <div className="flex gap-2.5 overflow-x-auto py-3 px-4 bg-slate-50/60 border border-slate-100 rounded-2xl mb-4 scrollbar-none whitespace-nowrap">
          <Link
            href={isAdminOrEmployee ? "/orders" : "/my-orders"}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all text-center no-underline cursor-pointer shadow-sm shrink-0 group"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Package size={14} />
            </div>
            <span className="text-[11px] font-black text-slate-800 tracking-tight">Đơn hàng của tôi</span>
          </Link>

          <Link
            href="/tracking"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all text-center no-underline cursor-pointer shadow-sm shrink-0 group"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck size={14} />
            </div>
            <span className="text-[11px] font-black text-slate-800 tracking-tight">Theo dõi vận chuyển</span>
          </Link>

          <Link
            href="/payments"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all text-center no-underline cursor-pointer shadow-sm shrink-0 group"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <QrCode size={14} />
            </div>
            <span className="text-[11px] font-black text-slate-800 tracking-tight">Thanh toán</span>
          </Link>

          <Link
            href={isAdminOrEmployee ? "/rd-tracking" : "/tracking?tab=rd"}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-2xl hover:border-purple-300 hover:shadow-sm transition-all text-center no-underline cursor-pointer shadow-sm shrink-0 group"
          >
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Beaker size={14} />
            </div>
            <span className="text-[11px] font-black text-slate-800 tracking-tight">Theo dõi R&D</span>
          </Link>
        </div>

        <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 25, paddingRight: 5 }}>
          {cartItems.map(item => (
            <div key={item._id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <div style={{ width: 60, height: 60, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getImageUrl(item.SanPham?.HinhAnh) ? (
                  <img src={getImageUrl(item.SanPham.HinhAnh)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <Box size={24} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-800 text-sm truncate">{item.SanPham?.TenDongSon}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                    {item.SanPham?.MaSanPham || 'SP0000'}
                  </span>
                  <span className="text-[9px] font-black text-blue-600/70 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-lg">
                    {item.SanPham?.PhanLoai || 'SƠN NƯỚC'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center bg-slate-100/80 px-2 py-1 rounded-xl border border-slate-200/40">
                    <button 
                      onClick={() => updateQuantity(item.SanPham._id, item.SoLuong - 1)} 
                      className="border-none bg-transparent text-slate-500 font-extrabold text-sm px-2 cursor-pointer hover:text-slate-800 transition-colors"
                    >-</button>
                    <span className="text-xs font-black text-slate-800 min-w-[20px] text-center">{item.SoLuong}</span>
                    <button 
                      onClick={() => updateQuantity(item.SanPham._id, item.SoLuong + 1)} 
                      className="border-none bg-transparent text-slate-500 font-extrabold text-sm px-2 cursor-pointer hover:text-slate-800 transition-colors"
                    >+</button>
                  </div>
                  <div className="font-extrabold text-blue-600 text-[13px]">
                    {((item.SanPham?.DonGiaCoSo || 0) * item.SoLuong).toLocaleString()} ₫
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(item.SanPham?._id)}
                className="text-slate-400 hover:text-rose-500 transition-colors bg-transparent border-none p-1 cursor-pointer absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                title="Xóa sản phẩm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {cartItems.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ShoppingCart size={40} className="opacity-20 animate-pulse" />
              <div style={{ fontStyle: 'italic', fontSize: 13, fontWeight: 'medium' }}>Giỏ hàng của bạn đang trống</div>
            </div>
          )}
        </div>

        {/* Voucher */}
        <div style={{ padding: '20px 0', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pl-10"
                style={{ textTransform: 'uppercase', fontSize: 12, height: 45 }}
                placeholder="NHẬP MÃ GIẢM GIÁ..."
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <button
              onClick={handleApplyVoucher}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
              disabled={applyingDiscount || !discountCode}
            >
              Áp dụng
            </button>
          </div>
          {discountInfo && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5, 150, 105, 0.08)', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontSize: 13, fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Giảm {discountInfo.DiscountAmount.toLocaleString()} ₫</span>
              </div>
              <button onClick={() => { setDiscountInfo(null); setDiscountCode(''); }} style={{ color: '#e11d48' }}><Trash size={14} /></button>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tạm tính:</span>
            <span className="text-sm font-extrabold text-slate-700">{cartTotal.toLocaleString()} ₫</span>
          </div>
          {discountInfo && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Giảm giá:</span>
              <span className="text-sm font-extrabold text-rose-500">-{discountInfo.DiscountAmount.toLocaleString()} ₫</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thuế VAT (8%):</span>
            <span className="text-sm font-extrabold text-slate-700">
              {((cartTotal - (discountInfo?.DiscountAmount || 0)) >= 5000000 ? (cartTotal - (discountInfo?.DiscountAmount || 0)) * 0.08 : 0).toLocaleString()} ₫
            </span>
          </div>
          <div className="flex justify-between items-center mt-4 mb-6">
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">TỔNG CỘNG:</span>
            <span className="text-2xl font-black text-blue-600">
              {((cartTotal - (discountInfo?.DiscountAmount || 0)) >= 5000000 ? (cartTotal - (discountInfo?.DiscountAmount || 0)) * 1.08 : (cartTotal - (discountInfo?.DiscountAmount || 0))).toLocaleString()} ₫
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isSubmitting}
            className={`w-full h-14 rounded-3xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all border border-transparent shadow-xl transition-all cursor-pointer ${cartItems.length > 0 && !isSubmitting ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {isSubmitting ? 'ĐANG ĐẶT HÀNG...' : 'Đặt hàng ngay'} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .transition-hover {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .transition-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.08);
        }
        .Loader2 {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
