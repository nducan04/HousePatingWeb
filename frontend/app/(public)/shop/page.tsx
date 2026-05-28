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
  Star
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import CustomerProductModal from "@/components/CustomerProductModal";
import ProductImageCarousel from "@/components/ProductImageCarousel";

export default function ShopPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Basic cart state mapping
  const { addToCart: addToCartStore } = useCartStore();
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

  const addToCart = async (sp: any) => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để mua hàng");
      return;
    }
    const qtyToAdd = productQuantities[sp._id] || 1;

    if (qtyToAdd > (sp.TongTonKho || 0)) {
      setCartMessage({ id: sp._id, text: `Kho chỉ còn ${sp.TongTonKho || 0}!` });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return;
    }

    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      await addToCartStore(sessionId, sp._id, qtyToAdd, sp.DanhSachMaMau?.[0] || 'N/A');
      setCartMessage({ id: sp._id, text: "Đã thêm vào giỏ!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
    } catch (err: any) {
      console.error(err);
      setCartMessage({ id: sp._id, text: err.response?.data?.error || "Lỗi!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
    } finally {
      setCartLoading("");
    }
  };

  const categories = Array.from(new Set(products.map(p => p.PhanLoai))).filter(Boolean);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.PhanLoai === selectedCategory)
    : products;

  return (
    <div
      className="min-h-screen bg-transparent font-sans relative pb-20 text-white"
      style={{
        backgroundImage: 'url("/login-illustration.png")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      {/* Header Space for floating effect */}
      <div className="pt-24 px-4 sm:px-8 max-w-[1500px] mx-auto">

        {/* Navigation Back */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-lg font-bold text-blue-400 shadow-sm border border-white/20 hover:bg-white/20 hover:text-blue-300 transition-all no-underline">
            ← Quay lại trang chủ
          </Link>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-8 min-h-[80vh] flex flex-col md:flex-row gap-10">

          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Filter size={20} className="text-blue-400" /> Danh mục
            </h2>
            <div className="space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all border border-transparent ${!selectedCategory ? 'bg-blue-600 text-white shadow-lg border-blue-500/50' : 'text-slate-300 hover:bg-white/5 hover:border-white/10'}`}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all border border-transparent ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg border-blue-500/50' : 'text-slate-300 hover:bg-white/5 hover:border-white/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-white/10 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 uppercase tracking-tight">SẢN PHẨM NỔI BẬT</h1>
              <div className="text-sm font-bold text-slate-300 bg-white/10 px-4 py-2 rounded-xl">
                Hiển thị {filteredProducts.length} sản phẩm
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={40} className="text-blue-600 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Package size={64} className="mb-4 opacity-50" />
                <p className="text-lg font-bold">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((sp) => (
                  <div key={sp._id} className="bg-slate-800/60 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-white/10 group flex flex-col h-full">
                    <div 
                      className="relative aspect-square w-full rounded-lg overflow-hidden mb-4 bg-slate-900/50 cursor-pointer"
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
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{sp.PhanLoai}</div>
                      <h3 
                        className="font-bold text-white text-base mb-1 line-clamp-1 hover:text-blue-400 transition-colors cursor-pointer"
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
                            <Star size={14} className={avgRating > 0 ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
                            <span className="text-[11px] text-slate-300 font-bold">{avgRating > 0 ? `${avgRating} (${ratings.length} đánh giá)` : "Chưa có đánh giá"}</span>
                          </div>
                        );
                      })()}
                      <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest mt-1">
                        {sp.ThuongHieu}
                      </p>
                      <p className="text-[12px] text-slate-300 font-medium mb-4">
                        Tồn kho: <span className="font-bold text-white">{sp.TongTonKho}</span> {sp.DonViTinh || "Kg"}
                      </p>
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-3">
                          <div className="flex flex-col">
                            <span className="text-emerald-400 font-bold text-xl">
                              {sp.DonGiaCoSo?.toLocaleString() || 0} ₫
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              / {sp.DonViTinh || "Kg"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900/50 rounded-lg p-1 h-10 border border-white/5">
                            <button
                              onClick={() => updateQuantity(sp._id, -1, sp.TongTonKho)}
                              className="w-8 h-full flex items-center justify-center text-slate-300 hover:bg-white/10 hover:shadow-sm rounded-md transition-all font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={productQuantities[sp._id] || 1}
                              onChange={(e) => handleQuantityChange(sp._id, e.target.value, sp.TongTonKho)}
                              onBlur={() => handleQuantityBlur(sp._id)}
                              className="w-8 text-center bg-transparent border-none text-sm font-bold text-white outline-none appearance-none"
                            />
                            <button
                              onClick={() => updateQuantity(sp._id, 1, sp.TongTonKho)}
                              className="w-8 h-full flex items-center justify-center text-slate-300 hover:bg-white/10 hover:shadow-sm rounded-md transition-all font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => addToCart(sp)}
                            disabled={cartLoading === sp._id}
                            className={`flex-1 h-10 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md font-bold text-[13px] cursor-pointer ${cartMessage.id === sp._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500 text-white" : "bg-red-500 text-white text-[10px]") : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}
                          >
                            {cartLoading === sp._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : cartMessage.id === sp._id ? (
                              cartMessage.text === "Đã thêm vào giỏ!" ? <ShoppingCart size={16} /> : <span>{cartMessage.text}</span>
                            ) : (
                              <>
                                <Plus size={16} /> Thêm
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
        onAddToCart={(sp, qty) => {
          handleQuantityChange(sp._id, qty.toString(), sp.TongTonKho);
          addToCart(sp);
        }} 
        cartLoading={cartLoading} 
      />
    </div>
  );
}
