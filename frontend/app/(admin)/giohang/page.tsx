'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Eye, Trash2, Box, AlertCircle, CheckCircle2, Tag, Trash, User, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

interface CartItem {
  _id: string;
  SanPham: { _id: string, MaSanPham: string, TenDongSon: string, DonGiaCoSo: number, HinhAnh?: string, TonKho?: number };
  SoLuong: number;
}

interface KhachHang {
  _id: string;
  TenKhachHang: string;
  SDT: string;
  DiaChi: string;
}

export default function GioHangPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
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

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchProducts();
      fetchCustomers();

      // Auto-select customer if current user is a customer
      if (!isAdminOrEmployee && user.profile) {
        setSelectedCustomerId(user.profile._id);
        setShippingAddress(user.profile.DiaChi || '');
      }
    }
  }, [user, sessionId]);

  const fetchCart = async () => {
    try {
      const res = await api.get(`/gio-hang/${sessionId}`);
      if (res.data.success) {
        setCartItems(res.data.data.Items || []);
        setCartTotal(res.data.data.TongTienTamTinh || 0);
      }
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

      const res = await api.post(`/gio-hang/${sessionId}`, { SanPhamId: sanPhamId, SoLuong: soLuong });
      if (res.data.success) {
        setCartItems(res.data.data.Items || []);
        setCartTotal(res.data.data.TongTienTamTinh || 0);
      }
    } catch (err) {
      console.error('Lỗi cập nhật', err);
    }
  };

  const clearCart = async () => {
    if (!confirm('Bạn có muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await api.delete(`/gio-hang/${sessionId}`);
      fetchCart();
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
      const res = await api.post('/don-hang/checkout', {
        sessionId: sessionId,
        khachHangId: selectedCustomerId,
        diaChiGiaoHang: shippingAddress,
        discountCode: discountInfo?.MaVoucher,
        ghiChu: `Đơn hàng từ giỏ hàng hệ thống - Người đặt: ${user?.username}`
      });

      if (res.data.success) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${res.data.data.MaDonHang}. Kho đã được cập nhật.`);
        router.push('/don-hang');
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
      const res = await api.post('/khuyen-mai/validate', { code: discountCode, cartTotal });
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 'var(--spacing-xl)', minHeight: '80vh', padding: '10px' }}>

      {/* Cột trái: Sản phẩm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>Danh mục sản phẩm</h2>
        <div className="search-box glass-card" style={{ padding: '0 15px', borderRadius: 12 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ background: 'transparent', border: 'none', padding: '15px 0' }}
            placeholder="Tìm kiếm dòng sơn..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid-2">
          {filteredProducts.map(sp => (
            <div key={sp._id} className="glass-card transition-hover" style={{ padding: '15px', display: 'flex', gap: 15, alignItems: 'center' }}>
              <div style={{ width: 70, height: 70, background: 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {sp.HinhAnh ? <img src={`http://localhost:5000${sp.HinhAnh}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Box size={24} color="#555" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{sp.TenDongSon}</div>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: 14 }}>{(sp.DonGiaCoSo || 0).toLocaleString()} ₫</div>
                <div style={{ fontSize: '11px', color: sp.TonKho > 0 ? 'var(--text-tertiary)' : 'var(--accent-rose)', marginTop: 4 }}>Tồn kho: {sp.TonKho || 0}</div>
              </div>
              <button
                onClick={() => {
                  const existing = cartItems.find(i => i.SanPham?._id === sp._id);
                  updateQuantity(sp._id, existing ? existing.SoLuong + 1 : 1);
                }}
                className="btn btn-primary"
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
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--spacing-xl)', borderRadius: 16, border: '1px solid var(--border-color)', position: 'sticky', top: 20, height: 'fit-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <ShoppingCart size={28} className="text-[var(--accent-cyan)]" /> Giỏ Hàng
          </h2>
          {cartItems.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ color: 'var(--accent-rose)' }}>
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
                  className="form-input pl-10"
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
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user?.profile?.TenKhachHang}</div>
                  <div className="text-xs text-slate-500">Đặt hàng cho tài khoản này</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Địa chỉ giao hàng</label>
            <div className="relative">
              <textarea
                className="form-input pl-10 py-3 min-h-[80px]"
                placeholder="Nhập địa chỉ giao hàng chi tiết..."
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
              />
              <MapPin className="absolute left-3 top-3 text-slate-600" size={16} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 25, paddingRight: 5 }}>
          {cartItems.map(item => (
            <div key={item._id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 60, height: 60, background: 'rgba(0,0,0,0.3)', borderRadius: 10, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.SanPham?.HinhAnh ? (
                  <img src={`http://localhost:5000${item.SanPham.HinhAnh}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <Box size={24} color="#333" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white', marginBottom: 2 }}>{item.SanPham?.TenDongSon}</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 14 }}>{(item.SanPham?.DonGiaCoSo || 0).toLocaleString()} ₫</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 8 }}>
                <button onClick={() => updateQuantity(item.SanPham._id, item.SoLuong - 1)} className="btn btn-ghost btn-xs text-slate-500 hover:text-white">-</button>
                <span style={{ fontSize: 15, fontWeight: 900, minWidth: 20, textAlign: 'center', color: 'white' }}>{item.SoLuong}</span>
                <button onClick={() => updateQuantity(item.SanPham._id, item.SoLuong + 1)} className="btn btn-ghost btn-xs text-slate-500 hover:text-white">+</button>
              </div>
            </div>
          ))}
          {cartItems.length === 0 && (
            <div style={{ textAlign: 'center', color: '#444', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ShoppingCart size={40} opacity={0.2} />
              <div style={{ fontStyle: 'italic', fontSize: 14 }}>Giỏ hàng của bạn đang trống</div>
            </div>
          )}
        </div>

        {/* Voucher */}
        <div style={{ padding: '20px 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="relative flex-1">
              <input
                type="text"
                className="form-input pl-10"
                style={{ textTransform: 'uppercase', fontSize: 12 }}
                placeholder="NHẬP MÃ GIẢM GIÁ..."
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            </div>
            <button
              onClick={handleApplyVoucher}
              className="btn btn-ghost"
              style={{ border: '1px solid var(--border-color)' }}
              disabled={applyingDiscount || !discountCode}
            >
              Áp dụng
            </button>
          </div>
          {discountInfo && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-emerald-soft)', padding: '8px 12px', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-emerald)', fontSize: 13, fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Giảm {discountInfo.DiscountAmount.toLocaleString()} ₫</span>
              </div>
              <button onClick={() => { setDiscountInfo(null); setDiscountCode(''); }} style={{ color: 'var(--accent-rose)' }}><Trash size={14} /></button>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tạm tính:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{cartTotal.toLocaleString()} ₫</span>
          </div>
          {discountInfo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--accent-rose)' }}>Giảm giá:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-rose)' }}>-{discountInfo.DiscountAmount.toLocaleString()} ₫</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 25 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>TỔNG CỘNG:</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-cyan)' }}>
              {(cartTotal - (discountInfo?.DiscountAmount || 0)).toLocaleString()} ₫
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isSubmitting}
            className={`btn w-full h-14 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${cartItems.length > 0 && !isSubmitting ? 'btn-primary shadow-blue-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" /> XỬ LÝ...</> : <><CheckCircle2 size={22} /> ĐẶT HÀNG NGAY</>}
          </button>
        </div>
      </div>

      <style jsx>{`
        .transition-hover {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .transition-hover:hover {
          transform: translateY(-4px);
          border-color: var(--accent-cyan-soft);
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
