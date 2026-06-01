'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Eye, Trash2, Box, AlertCircle, CheckCircle2, Tag, Trash, User, MapPin, Plus, Truck, ArrowRight, QrCode, Beaker, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore, CartItem, getGuestSessionId } from '@/lib/store/cartStore';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils/imageUrl';


interface KhachHang {
  _id: string;
  TenKhachHang: string;
  SDT: string;
  DiaChi: string;
}

const CartItemRow = ({ item, isSelected, onSelect, onRemove, products, updateQuantityStore, sessionId, getImageUrl }: any) => {
  const [localQty, setLocalQty] = React.useState(item.SoLuong);
  const timeoutRef = React.useRef<any>(null);
  
  React.useEffect(() => {
    setLocalQty(item.SoLuong);
  }, [item.SoLuong]);

  const sp = products.find((p: any) => p._id === item.SanPham._id);
  const stock = sp ? (sp.TongTonKho || sp.TonKho || 0) : 0;
  const unit = sp?.DonViTinh || 'Kg';

  const updateWithDebounce = (newQty: number) => {
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (newQty > stock) {
      alert(`Số lượng yêu cầu (${newQty}) vượt quá tồn kho (${stock})`);
      newQty = stock;
    }
    setLocalQty(newQty);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateQuantityStore(sessionId, item.SanPham._id, newQty);
    }, 400);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-4 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-xl px-2">
      <div className="col-span-6 flex items-center gap-4">
        <input 
          type="checkbox" 
          className="w-4 h-4 cursor-pointer accent-[#1c3c77]"
          checked={isSelected}
          onChange={() => onSelect(item.SanPham?._id)}
        />
        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
          {getImageUrl(item.SanPham?.HinhAnh) ? (
            <img src={getImageUrl(item.SanPham.HinhAnh)} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><Box size={24} /></div>
          )}
        </div>
        <div className="pr-4">
          <div className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.SanPham?.TenDongSon}</div>
          <div className="text-xs font-semibold text-slate-400 mt-1">{item.SanPham?.MaSanPham || 'SP0000'} - {item.SanPham?.PhanLoai || 'Sơn'}</div>
          {item.MaMau && item.MaMau !== 'N/A' && (
            <div className="text-[11px] font-bold text-[#1c3c77] mt-1 flex items-center gap-1 bg-blue-50 w-max px-2 py-0.5 rounded-md border border-blue-100">
              <Tag size={10} /> Mã màu: {item.MaMau}
            </div>
          )}
          <div className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
            <Box size={12} /> Tồn kho: {stock} {unit}
          </div>
        </div>
      </div>
      
      <div className="col-span-2 text-center text-sm font-bold text-slate-500">
        {(item.SanPham?.DonGiaCoSo || 0).toLocaleString()} ₫
      </div>
      
      <div className="col-span-2 flex justify-center">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 shadow-sm">
          <button onClick={() => updateWithDebounce(localQty - 1)} className="text-slate-500 hover:text-[#1c3c77] font-bold px-3 h-full border-r border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-l-lg transition-colors">-</button>
          <input
            type="number"
            min="1"
            value={localQty}
            onChange={(e) => setLocalQty(parseInt(e.target.value) || 1)}
            onBlur={(e) => updateWithDebounce(parseInt(e.target.value))}
            className="w-12 text-center text-xs font-bold text-slate-800 outline-none hide-spin-button"
          />
          <button onClick={() => updateWithDebounce(localQty + 1)} className="text-slate-500 hover:text-[#1c3c77] font-bold px-3 h-full border-l border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-r-lg transition-colors">+</button>
        </div>
      </div>
      
      <div className="col-span-2 flex items-center justify-end gap-3">
        <span className="text-sm font-black text-rose-600">
          {((item.SanPham?.DonGiaCoSo || 0) * localQty).toLocaleString()} ₫
        </span>
        <button onClick={() => onRemove(item.SanPham?._id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-50">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default function GioHangPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cartItems, cartTotal, fetchCart, updateQuantity: updateQuantityStore, clearCart: clearCartStore, initializeCart } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thêm state cho các sản phẩm được chọn (để hiển thị theo UI ảnh mẫu)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const sessionId = useMemo(() => user?.id || getGuestSessionId(), [user]);
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

  // No longer auto-selecting all items on load as requested by user.

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item: any) => item.SanPham?._id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const fetchCartItems = async () => {
    try {
      await initializeCart(user?.id);
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
    // This function is kept for the bottom POS section, but the main cart items use debounced updates via CartItemRow.
    if (soLuong < 1 || isNaN(soLuong)) return;
    try {
      const sp = products.find(p => p._id === sanPhamId);
      const stock = sp ? (sp.TongTonKho || sp.TonKho || 0) : 0;
      if (sp && soLuong > stock) {
        alert(`Số lượng yêu cầu (${soLuong}) vượt quá tồn kho (${stock})`);
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
    if (selectedItems.size === 0) return alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
    
    // Store selected items to session storage for the checkout page
    sessionStorage.setItem('checkoutItems', JSON.stringify(Array.from(selectedItems)));
    if (discountInfo) {
      sessionStorage.setItem('checkoutDiscount', JSON.stringify(discountInfo));
    }
    
    // Navigate to checkout page
    router.push('/checkout');
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

  const selectedTotal = cartItems
    .filter((item: any) => selectedItems.has(item.SanPham?._id))
    .reduce((acc: number, item: any) => acc + (item.SanPham?.DonGiaCoSo || 0) * item.SoLuong, 0);

  const finalTotal = selectedTotal - (discountInfo?.DiscountAmount || 0);

  return (
    <div className="min-h-screen font-sans pb-20 relative text-slate-800" style={{ backgroundColor: '#f0f4f8' }}>
      
      {/* HEADER (Giống ảnh mẫu, nhưng dùng logo VTSC PaintPro) */}
      <header className="bg-white px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-[150px] h-[40px] flex items-center justify-center overflow-hidden">
            <img src="/vtsc.png" alt="VTSC Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-black text-[#1c3c77] tracking-tight leading-none uppercase">VTSC PaintPro</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hệ Thống Sơn Tĩnh Điện</p>
          </div>
        </Link>
        <Link href="/shop" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2 no-underline px-4 py-2 hover:bg-slate-50 rounded-lg">
          <ArrowRight size={16} className="rotate-180" /> Tiếp tục mua sắm
        </Link>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 mt-8 relative z-10">
        {/* BANNER "Giỏ Hàng Của Bạn" */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center justify-between mb-8 border border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#1c3c77] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#1c3c77]/20">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1c3c77]">Giỏ Hàng Của Bạn</h2>
              <p className="text-sm text-slate-500 mt-1">Kiểm tra sản phẩm đã chọn trước khi tiến hành thanh toán</p>
            </div>
          </div>
          <div className="bg-[#1c3c77] text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-3 shadow-lg">
            <span className="bg-yellow-400 text-[#1c3c77] px-3 py-1 rounded-full text-xs font-black">{cartItems.length}</span>
            Sản phẩm
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: CART ITEMS TABLE */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 h-full">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer accent-[#1c3c77]"
                  checked={cartItems.length > 0 && selectedItems.size === cartItems.length}
                  onChange={handleSelectAll}
                />
                <span className="text-sm font-bold text-slate-700">Chọn tất cả ({cartItems.length} loại)</span>
              </div>

              {/* TABLE HEADER */}
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
                <div className="col-span-6">SẢN PHẨM</div>
                <div className="col-span-2 text-center">ĐƠN GIÁ</div>
                <div className="col-span-2 text-center">SỐ LƯỢNG</div>
                <div className="col-span-2 text-right pr-2">THÀNH TIỀN</div>
              </div>

              {/* ITEM LIST */}
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <CartItemRow
                    key={item._id}
                    item={item}
                    isSelected={selectedItems.has(item.SanPham?._id)}
                    onSelect={handleSelectItem}
                    onRemove={handleRemoveItem}
                    products={products}
                    updateQuantityStore={updateQuantityStore}
                    sessionId={sessionId}
                    getImageUrl={getImageUrl}
                  />
                ))}

                {cartItems.length === 0 && (
                  <div className="text-center py-20 flex flex-col items-center">
                    <ShoppingCart size={48} className="text-slate-200 mb-4" />
                    <div className="text-slate-400 font-bold text-lg">Giỏ hàng của bạn đang trống</div>
                    <Link href="/shop" className="mt-4 text-[#1c3c77] font-bold underline">Khám phá sản phẩm</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY & FUNCTIONS */}
          <div className="lg:col-span-4">
            <div className="sticky top-[100px] space-y-6">
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-[#1c3c77] mb-6">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Sản phẩm đã chọn:</span>
                  <span className="text-sm font-bold text-slate-800">{selectedItems.size} món</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Tạm tính:</span>
                  <span className="text-sm font-bold text-slate-800">{selectedTotal.toLocaleString()} ₫</span>
                </div>
                {discountInfo && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-sm">Giảm giá:</span>
                    <span className="text-sm font-bold">-{discountInfo.DiscountAmount.toLocaleString()} ₫</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Phí giao hàng:</span>
                  <span className="text-sm text-slate-400 italic">Tính khi thanh toán</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-black text-slate-800">Tổng cộng:</span>
                  <span className="text-xl font-black text-rose-600">{finalTotal.toLocaleString()} ₫</span>
                </div>
              </div>

              {/* CUSTOMER & VOUCHER FORM */}
              <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Thông tin giao hàng</label>
                {isAdminOrEmployee ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1c3c77] transition-all"
                    value={selectedCustomerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.TenKhachHang}</option>)}
                  </select>
                ) : (
                  <div className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> {user?.profile?.TenKhachHang}
                  </div>
                )}
                
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1c3c77] transition-all min-h-[80px]"
                  placeholder="Nhập địa chỉ giao hàng..."
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                />

                <div className="flex gap-2 pt-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-9 text-sm uppercase text-slate-800 outline-none focus:border-[#1c3c77]"
                      placeholder="MÃ GIẢM GIÁ"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button onClick={handleApplyVoucher} className="px-5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors">Áp dụng</button>
                </div>
                {discountInfo && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                    <div className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Đã áp dụng mã giảm giá</div>
                    <button onClick={() => { setDiscountInfo(null); setDiscountCode(''); }} className="text-rose-500 hover:text-rose-700"><Trash size={14}/></button>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={selectedItems.size === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedItems.size > 0 && !isSubmitting 
                  ? 'bg-gradient-to-r from-[#1c3c77] to-blue-800 text-white hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'ĐANG XỬ LÝ...' : `TIẾN HÀNH THANH TOÁN (${finalTotal.toLocaleString()} đ)`}
              </button>
            </div>

            {/* CÁC CHỨC NĂNG THEO YÊU CẦU: Đơn hàng, Tracking, Thanh toán, R&D */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link href={isAdminOrEmployee ? "/don-hang" : "/my-orders"} className="bg-white p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 no-underline group border border-slate-100 hover:border-blue-200">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Package size={18} /></div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Đơn hàng</span>
              </Link>
              <Link href="/tracking" className="bg-white p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 no-underline group border border-slate-100 hover:border-emerald-200">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><Truck size={18} /></div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-600">Tracking</span>
              </Link>
              <Link href={isAdminOrEmployee ? "/quan-ly-thanh-toan" : "/my-payments"} className="bg-white p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 no-underline group border border-slate-100 hover:border-indigo-200">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><QrCode size={18} /></div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">Thanh toán</span>
              </Link>
              <Link href={isAdminOrEmployee ? "/rd-tracking" : "/tracking?tab=rd"} className="bg-white p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 no-underline group border border-slate-100 hover:border-purple-200">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all"><Beaker size={18} /></div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-purple-600">R&D</span>
              </Link>
            </div>
            </div>
          </div>
        </div>


      </div>

    </div>
  );
}
