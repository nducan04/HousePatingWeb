"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Filter,
  Loader2,
  Package,
  Plus,
  Star,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore, getGuestSessionId } from "@/lib/store/cartStore";
import CustomerProductModal from "@/components/CustomerProductModal";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function ShopPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");

  // Cart Store state
  const { cartItems, addToCart: addToCartStore } = useCartStore();
  const [cartLoading, setCartLoading] = useState("");
  const [cartMessage, setCartMessage] = useState({ id: "", text: "" });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
      router.push("/sign-in");
      return false;
    }

    if ((sp.TongTonKho || 0) <= 0) {
      setCartMessage({
        id: sp._id,
        text: "Hết hàng!",
      });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return false;
    }

    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || getGuestSessionId();
      await addToCartStore(
        sessionId,
        sp._id,
        1,
        colorCode || sp.DanhSachMaMau?.[0]?.MaMau || "",
      );
      setCartMessage({ id: sp._id, text: "Đã thêm!" });
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

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.PhanLoai))).filter(Boolean);
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.PhanLoai === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.TenDongSon?.toLowerCase().includes(q) ||
          p.PhanLoai?.toLowerCase().includes(q) ||
          p.ThuongHieu?.toLowerCase().includes(q) ||
          p.DanhSachMaMau?.some((m: any) =>
            m.MaMau?.toLowerCase().includes(q) || m.TenMau?.toLowerCase().includes(q)
          )
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => (a.DonGiaCoSo || 0) - (b.DonGiaCoSo || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.DonGiaCoSo || 0) - (a.DonGiaCoSo || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.TenDongSon || "").localeCompare(b.TenDongSon || ""));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const getDisplayPrice = (basePrice: number) => {
    if (!basePrice) return 0;
    const multiplier = user?.role === "KhachHangB2B" ? 1.2 : 1.3;
    return basePrice * multiplier;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Universal Public Header */}
      <PublicNavbar
        activeRoute="/shop"
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Breadcrumb & Hero Header */}
      <div className="bg-white dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 py-8 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline">
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 dark:text-slate-300">Sản phẩm sơn tĩnh điện</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
                <Sparkles size={14} /> Tiêu chuẩn AkzoNobel Interpon
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                Danh Mục Sản Phẩm Sơn Tĩnh Điện
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
                Cung cấp đầy đủ các dòng sơn sấy nhiệt, sơn ngoài trời kháng thời tiết, sơn cát, sơn nhăn và giải pháp phủ màng bảo vệ kim loại công nghiệp cao cấp.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-bold text-blue-600 dark:text-blue-400">{filteredAndSortedProducts.length}</span> sản phẩm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar / Filter Pane */}
          <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Filter size={16} className="text-blue-600 dark:text-blue-400" />
                Phân loại sơn
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 w-auto lg:w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border border-transparent cursor-pointer ${
                  !selectedCategory
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Tất cả sản phẩm ({products.length})
              </button>
              {categories.map((cat: any) => {
                const count = products.filter((p) => p.PhanLoai === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 w-auto lg:w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border border-transparent cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs ml-2 ${selectedCategory === cat ? 'text-blue-100' : 'text-slate-400'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Product Grid & Controls */}
          <section className="flex-1 w-full">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc tên sơn, mã màu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none border border-transparent focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ArrowUpDown size={14} /> Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 border border-transparent outline-none cursor-pointer focus:border-blue-500"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name">Tên sản phẩm A-Z</option>
                </select>
              </div>
            </div>

            {/* Products List State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse p-4"
                  />
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
                <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Hãy thử điều chỉnh từ khóa tìm kiếm hoặc chọn danh mục khác để xem thêm kết quả.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all border-none cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map((sp) => {
                  const ratings = sp.DanhGia || [];
                  const avgRating =
                    ratings.length > 0
                      ? Number(
                          (
                            ratings.reduce((acc: number, r: any) => acc + (r.SoSao || 0), 0) /
                            ratings.length
                          ).toFixed(1)
                        )
                      : 0;

                  return (
                    <div
                      key={sp._id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 group flex flex-col h-full"
                    >
                      {/* Product Image Carousel / Thumbnail */}
                      <div
                        className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                        onClick={() => setSelectedProduct(sp)}
                      >
                        <ProductImageCarousel product={sp} />
                        <div className="absolute top-3 left-3 z-10">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                              (sp.TongTonKho || 0) > 0
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {(sp.TongTonKho || 0) > 0 ? "Còn hàng" : "Hết hàng"}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-col flex-1">
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                          {sp.PhanLoai}
                        </div>
                        <h3
                          className="font-bold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          onClick={() => setSelectedProduct(sp)}
                          title={sp.TenDongSon}
                        >
                          {sp.TenDongSon}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Star
                            size={14}
                            className={avgRating > 0 ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                            {avgRating > 0 ? `${avgRating} (${ratings.length} đánh giá)` : "Chưa có đánh giá"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                          {sp.ThuongHieu || "AkzoNobel Interpon"}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                          Tồn kho:{" "}
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {sp.TongTonKho || 0}
                          </span>{" "}
                          {sp.DonViTinh || "Thùng"}
                        </p>

                        {/* Price & Action Button */}
                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-baseline justify-between mb-3">
                            <span className="text-blue-600 dark:text-blue-400 font-black text-xl">
                              {getDisplayPrice(sp.DonGiaCoSo).toLocaleString()} ₫
                            </span>
                            <span className="text-xs text-slate-400">
                              / {sp.DonViTinh || "Thùng"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                sp.DanhSachMaMau?.length > 0
                                  ? setSelectedProduct(sp)
                                  : addToCart(sp)
                              }
                              disabled={cartLoading === sp._id || (sp.TongTonKho || 0) <= 0}
                              className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs sm:text-sm cursor-pointer border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                cartMessage.id === sp._id
                                  ? cartMessage.text === "Đã thêm!"
                                    ? "bg-emerald-500 text-white"
                                    : "bg-rose-500 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white active:scale-98"
                              }`}
                            >
                              {cartLoading === sp._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : cartMessage.id === sp._id ? (
                                <span>{cartMessage.text}</span>
                              ) : (
                                <>
                                  <Plus size={16} /> Thêm vào giỏ
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Product Detail Modal */}
      <CustomerProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        cartLoading={cartLoading}
        onAddToCart={(sp, qty, colorCode) => {
          addToCart(sp, colorCode);
        }}
      />

      {/* Universal Public Footer */}
      <PublicFooter />
    </div>
  );
}
