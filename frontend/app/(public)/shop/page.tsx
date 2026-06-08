"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  ArrowRight,
  Filter,
  Loader2,
  Package,
  Plus,
  Star,
  Facebook,
  Twitter,
  Instagram,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore, getGuestSessionId } from "@/lib/store/cartStore";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import CustomerProductModal from "@/components/CustomerProductModal";
import ProductImageCarousel from "@/components/ProductImageCarousel";

const ContactItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-900 group-hover:scale-110 transition-all duration-300">
      {icon}
    </div>
    <span className="text-slate-300 font-medium text-sm pt-2 group-hover:text-blue-400 transition-colors">{text}</span>
  </div>
);

const SocialLink = ({ icon, href }: { icon: React.ReactNode, href: string }) => (
  <Link href={href} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300">
    {icon}
  </Link>
);

export default function ShopPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Basic cart state mapping
  const { cartItems, addToCart: addToCartStore } = useCartStore();
  const [cartLoading, setCartLoading] = useState("");
  const [cartMessage, setCartMessage] = useState({ id: "", text: "" });
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const updateQuantity = (id: string, delta: number, maxQuantity?: number) => {
    setProductQuantities((prev) => {
      const current = prev[id] || 1;
      let next = Math.max(1, current + delta);
      if (maxQuantity !== undefined && next > maxQuantity) {
        next = maxQuantity;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleOpenPolicy = (type: string) => {
    alert("Vui lòng xem chính sách chi tiết tại trang chủ VTSC.");
  };

  const handleQuantityChange = (id: string, value: string, maxQuantity?: number) => {
    const val = parseInt(value);
    if (!isNaN(val) && val > 0) {
      let finalVal = val;
      if (maxQuantity !== undefined && finalVal > maxQuantity) {
        finalVal = maxQuantity;
      }
      setProductQuantities((prev) => ({ ...prev, [id]: finalVal }));
    } else if (value === "") {
      setProductQuantities((prev) => ({ ...prev, [id]: "" as unknown as number }));
    }
  };

  const handleQuantityBlur = (id: string) => {
    if (!productQuantities[id]) {
      setProductQuantities((prev) => ({ ...prev, [id]: 1 }));
    }
  };

  const getImageUrl = (path: any) => {
    return resolveImageUrl(
      path,
      "https://ui-avatars.com/api/?name=VTSC+Product&background=random"
    );
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/san-pham-son");
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = async (sp: any, colorCode?: string) => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để mua hàng");
      return false;
    }
    const qtyToAdd = productQuantities[sp._id] || 1;

    if (qtyToAdd > (sp.TongTonKho || 0)) {
      setCartMessage({ id: sp._id, text: `Kho chỉ còn ${sp.TongTonKho || 0}!` });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return false;
    }

    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || getGuestSessionId();
      await addToCartStore(sessionId, sp._id, qtyToAdd, colorCode || sp.DanhSachMaMau?.[0]?.MaMau || '');
      setCartMessage({ id: sp._id, text: "Đã thêm vào giỏ!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
      return true;
    } catch (err: any) {
      console.error(err);
      setCartMessage({ id: sp._id, text: err.response?.data?.error || "Lỗi!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return false;
    } finally {
      setCartLoading("");
    }
  };

  const categories = Array.from(new Set(products.map(p => p.PhanLoai))).filter(Boolean);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.PhanLoai === selectedCategory)
    : products;

  return (
    <>
    <div
      className="min-h-screen bg-slate-50 font-sans relative pb-20 text-slate-900"
    >
      {/* Header Space for floating effect */}
      <div className="pt-24 px-4 sm:px-8 max-w-[1500px] mx-auto">

        {/* Navigation Back & Cart */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all no-underline">
            ← Quay lại trang chủ
          </Link>
          <Link href="/cart" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-lg font-bold text-white shadow-lg hover:bg-blue-700 transition-all no-underline">
            <ShoppingCart size={20} /> 
            <span>Giỏ hàng {cartItems?.length > 0 && `(${cartItems.length})`}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 min-h-[80vh] flex flex-col md:flex-row gap-10">

          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Filter size={20} className="text-blue-600" /> Danh mục
            </h2>
            <div className="space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all border border-transparent ${!selectedCategory ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all border border-transparent ${selectedCategory === cat ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-100 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tight">SẢN PHẨM NỔI BẬT</h1>
              <div className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                Hiển thị {filteredProducts.length} sản phẩm
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={40} className="text-blue-600 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Package size={64} className="mb-4 text-slate-300 opacity-100" />
                <p className="text-lg font-bold text-slate-500">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((sp) => (
                  <div key={sp._id} className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col h-full hover:-translate-y-2">
                    <div
                      className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedProduct(sp)}
                    >
                      <ProductImageCarousel product={sp} />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${sp.TongTonKho > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {sp.TongTonKho > 0 ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 px-1">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{sp.PhanLoai}</div>
                      <h3
                        className="font-bold text-slate-900 text-lg mb-1 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => setSelectedProduct(sp)}
                      >
                        {sp.TenDongSon}
                      </h3>
                      {/* Bắt đầu phần Rating */}
                      {(() => {
                        const ratings = sp.DanhGia || [];
                        const avgRating = ratings.length > 0 ? Number((ratings.reduce((acc: number, r: any) => acc + (r.SoSao || 0), 0) / ratings.length).toFixed(1)) : 0;
                        return (
                          <div className="flex items-center gap-1 mb-2">
                            <Star size={14} className={avgRating > 0 ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                            <span className="text-[11px] text-slate-500 font-bold">{avgRating > 0 ? `${avgRating} (${ratings.length} đánh giá)` : "Chưa có đánh giá"}</span>
                          </div>
                        );
                      })()}
                      <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest mt-1">
                        {sp.ThuongHieu}
                      </p>
                      <p className="text-[12px] text-slate-500 font-medium mb-4">
                        Tồn kho: <span className="font-bold text-slate-700">{sp.TongTonKho}</span> {sp.DonViTinh || "Thùng"}
                      </p>
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-3">
                          <div className="flex flex-col">
                            <span className="text-emerald-600 font-bold text-xl">
                              {sp.DonGiaCoSo?.toLocaleString() || 0} ₫
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              / {sp.DonViTinh || "Thùng"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-center mt-2">
                          <button
                            onClick={() => (sp.DanhSachMaMau?.length > 0 ? setSelectedProduct(sp) : addToCart(sp))}
                            disabled={cartLoading === sp._id}
                            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md font-bold text-[13px] cursor-pointer ${cartMessage.id === sp._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500 text-white" : "bg-red-500 text-white text-[10px]") : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}
                          >
                            {cartLoading === sp._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : cartMessage.id === sp._id ? (
                              cartMessage.text === "Đã thêm vào giỏ!" ? <ShoppingCart size={16} /> : <span>{cartMessage.text}</span>
                            ) : (
                              <>
                                <ShoppingCart size={16} /> Thêm vào giỏ hàng
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={async (sp, qty, colorCode) => {
          setProductQuantities((prev) => ({ ...prev, [sp._id]: qty }));
          const success = await addToCart(sp, colorCode);
          if (success) {
            setSelectedProduct(null);
            router.push("/cart");
          }
        }}
        cartLoading={cartLoading}
      />
    </div>

    <footer
      id="footer"
      className="bg-slate-900 text-white pt-20 pb-10 scroll-mt-20 relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-illustration.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-slate-900/90 z-0"></div>
    <div className="max-w-[1300px] mx-auto px-10 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
        {/* Column 1: Company Info */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-[200px] h-[68px] flex-shrink-0 rounded-[16px] bg-white flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden px-4">
              <img src="/vtsc.png" alt="VTSC Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase text-white">
              CÔNG TY CP TMDV VOSCO (VTSC)
            </span>
          </div>
          <div className="space-y-5">
            <ContactItem
              icon={<MapPin size={20} className="text-blue-400" />}
              text="215 Lạch Tray, Phường Gia Viên, Thành phố Hải Phòng"
            />
            <ContactItem
              icon={<Phone size={20} className="text-blue-400" />}
              text="+84 (028) 3888 9999"
            />
            <ContactItem
              icon={<Mail size={20} className="text-blue-400" />}
              text="contact@vtscpaint.com"
            />
          </div>
          <div className="flex gap-4 mt-10">
            <SocialLink icon={<Facebook size={20} />} href="#" />
            <SocialLink icon={<Twitter size={20} />} href="#" />
            <SocialLink icon={<Instagram size={20} />} href="#" />
          </div>
        </div>

        {/* Column 2: Policies */}
        <div className="lg:col-span-3">
          <h4 className="text-sm font-bold mb-8 uppercase tracking-widest text-slate-400">
            CHÍNH SÁCH
          </h4>
          <ul className="space-y-4 text-slate-300 font-medium text-sm">
            <li>
              <button
                onClick={() => handleOpenPolicy("return")}
                className="hover:text-blue-400 transition-colors text-slate-300 bg-transparent border-none p-0 cursor-pointer text-left"
              >
                - Chính sách đổi trả
              </button>
            </li>
            <li>
              <button
                onClick={() => handleOpenPolicy("warranty")}
                className="hover:text-blue-400 transition-colors text-slate-300 bg-transparent border-none p-0 cursor-pointer text-left"
              >
                - Chính sách bảo hành
              </button>
            </li>
            <li>
              <button
                onClick={() => handleOpenPolicy("shipping")}
                className="hover:text-blue-400 transition-colors text-slate-300 bg-transparent border-none p-0 cursor-pointer text-left"
              >
                - Chính sách vận chuyển
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div className="lg:col-span-4">
          <h4 className="text-sm font-bold mb-8 uppercase tracking-widest text-slate-400">
            LIÊN KẾT NHANH
          </h4>
          <ul className="space-y-4 text-slate-300 font-medium text-sm">
            <li>
              <Link
                href="/theo-doi-don-hang"
                className="hover:text-blue-400 transition-colors no-underline text-slate-300"
              >
                - Theo dõi đơn hàng
              </Link>
            </li>
            <li>
              <Link
                href="/admin/contracts"
                className="hover:text-blue-400 transition-colors no-underline text-slate-300"
              >
                - Tra cứu hợp đồng
              </Link>
            </li>
            <li>
              <Link
                href="/admin/rd-tracking"
                className="hover:text-blue-400 transition-colors no-underline text-slate-300"
              >
                - Gửi yêu cầu R&D
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs font-medium">
        <p>© 2026 VTSC. Bản quyền thuộc về Nhóm dự án.</p>
        <div className="flex gap-8">
          <Link
            href="#"
            className="hover:text-white transition-colors no-underline text-slate-500"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="hover:text-white transition-colors no-underline text-slate-500"
          >
            Terms of Service
          </Link>
        </div>
      </div>
      </div>
    </footer>
    </>
  );
}
