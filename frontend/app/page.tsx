"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthNav from "@/lib/components/AuthNav";
import {
  Search,
  QrCode,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Send,
  X,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Eye,
  Star,
  Package,
  Plus,
  Truck,
  FlaskConical,
  Settings,
  Newspaper,
  Palette,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { paintColors } from "@/lib/data/colors-data";

const BACKEND_URL = "http://localhost:5000";

export default function HomePage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([
    { role: "bot", text: "Xin chào! Tôi là trợ lý ảo VTSC. Tôi có thể giúp gì cho bạn?" },
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState("");
  const [cartMessage, setCartMessage] = useState({ id: "", text: "" });

  // Trending Color Modal state
  const [selectedTrendingColor, setSelectedTrendingColor] = useState<any | null>(null);

  // Cart quantity state
  const [cartItemCount, setCartItemCount] = useState(0);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await api.get("/san-pham-son");
        if (productRes.data.success) {
          setProducts(productRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoadingProducts(false);
      }

      try {
        const newsRes = await api.get("/tin-tuc");
        if (newsRes.data.success) {
          setNews(newsRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoadingNews(false);
      }

      try {
        const sessionId = user?.id || "GUEST_SESSION";
        const cartRes = await api.get(`/gio-hang/${sessionId}`);
        if (cartRes.data.success && cartRes.data.data?.items) {
          const totalItems = cartRes.data.data.items.reduce((acc: number, item: any) => acc + item.SoLuong, 0);
          setCartItemCount(totalItems);
        }
      } catch (err) {
        // Ignore errors if cart doesn't exist yet
      }
    };

    fetchData();
  }, [user?.id]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setSendingChat(true);

    try {
      const res = await api.post("/chatbot/message", { message: userMsg });
      if (res.data.success) {
        setChatHistory((prev) => [...prev, { role: "bot", text: res.data.reply }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "bot", text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau." }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [...prev, { role: "bot", text: "Không thể kết nối với máy chủ AI." }]);
    } finally {
      setSendingChat(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setProductQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleQuantityChange = (id: string, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val > 0) {
      setProductQuantities(prev => ({ ...prev, [id]: val }));
    } else if (value === "") {
      setProductQuantities(prev => ({ ...prev, [id]: "" as unknown as number }));
    }
  };

  const handleQuantityBlur = (id: string) => {
    if (!productQuantities[id]) {
      setProductQuantities(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const addToCart = async (sp: any) => {
    setCartLoading(sp._id);
    const qty = productQuantities[sp._id] || 1;
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      const res = await api.post(`/gio-hang/${sessionId}`, {
        SanPhamId: sp._id,
        SoLuong: qty,
      });
      if (res.data.success) {
        setCartMessage({ id: sp._id, text: "Đã thêm vào giỏ!" });
        setCartItemCount(prev => prev + qty);
        setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
      }
    } catch (err) {
      console.error(err);
      setCartMessage({ id: sp._id, text: "Lỗi!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
    } finally {
      setCartLoading("");
    }
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setIsViewOpen(true);
  };

  const getImageUrl = (path: string) => {
    if (!path || path === "undefined") return "https://ui-avatars.com/api/?name=VTSC+Product&background=random";
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-blue-100 selection:text-blue-900 font-sans text-slate-900 antialiased">

      {/* ═══════ HEADER / NAVBAR ═══════ */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-600/20">V</div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">VTSC PaintPro</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-[15px] font-bold text-blue-600 no-underline">Trang chủ</Link>
            <Link href="#san-pham" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors no-underline">Sản phẩm</Link>
            <Link href="/colors" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors no-underline">Bảng màu</Link>
            <Link href="#dich-vu" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors no-underline">Dịch vụ</Link>
            <Link href="#tin-tuc" className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors no-underline">Tin tức</Link>
          </nav>

          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"><Search size={22} /></button>
            <div className="relative group cursor-pointer">
              <ShoppingCart size={22} className="text-slate-400 group-hover:text-blue-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white">{cartItemCount}</span>
              )}
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <AuthNav />
          </div>
        </div>
      </header>

      {/* ═══════ HERO BANNER (Balanced Fonts) ═══════ */}
      <section className="relative h-[550px] sm:h-[650px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/paint_factory_exterior_1778742118407.png" alt="VTSC Factory" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-10 flex flex-col justify-center items-start text-white">
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-blue-600/20 backdrop-blur-md border border-blue-400/30 rounded-lg">
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Hệ thống VTSC Paint Technology</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight uppercase">
              Đại lý phân phối
              <br />
              <span className="text-blue-500">Sơn tĩnh điện</span>
              <br />
              hàng đầu Việt Nam
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 font-medium leading-relaxed max-w-2xl">
              Giải pháp sơn tĩnh điện AkzoNobel Interpon chuyên nghiệp.
              Đảm bảo chất lượng bền bỉ, thẩm mỹ cao cho mọi bề mặt kim loại.
            </p>
            <div className="pt-6">
              <Link href="#dich-vu" className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg no-underline shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 w-fit">
                Khám phá dịch vụ <ArrowRight size={22} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ DỊCH VỤ & THẾ MẠNH (Uniform Typography) ═══════ */}
      <section id="dich-vu" className="px-6 py-20 bg-white">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Settings className="text-blue-600" size={28} />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                Dịch vụ & Thế mạnh của VTSC
              </h2>
            </div>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-base">
              Cam kết chất lượng và sự hài lòng tuyệt đối cho mọi khách hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<FlaskConical size={28} />}
              iconBg="bg-blue-50" iconColor="text-blue-600"
              title="Pha chế sơn theo mẫu"
              desc="Nhận yêu cầu R&D mẫu màu sơn theo yêu cầu của dự án, đảm bảo chính xác tuyệt đối."
              ctaText="Gửi mẫu" ctaColor="text-blue-600"
              href="#"
            />
            <ServiceCard
              icon={<Truck size={28} />}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
              title="Giao hàng toàn quốc"
              desc="Theo dõi lộ trình giao nhận hàng minh bạch, đảm bảo tiến độ công trình của bạn."
              ctaText="Tra cứu" ctaColor="text-emerald-600"
              href="/tracking"
            />
            <ServiceCard
              icon={<ShieldCheck size={28} />}
              iconBg="bg-amber-50" iconColor="text-amber-600"
              title="Bảo hành chính hãng"
              desc="Hỗ trợ kỹ thuật 24/7 từ các chuyên gia sơn tĩnh điện hàng đầu Việt Nam."
              ctaText="Chi tiết" ctaColor="text-amber-600"
              href="#"
            />
          </div>
        </div>
      </section>

      {/* ═══════ BẢNG MÀU XU HƯỚNG ═══════ */}
      <section id="bang-mau" className="px-8 py-20 bg-slate-50">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Palette className="text-blue-600" size={28} />
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                  Bảng Màu Xu Hướng
                </h2>
              </div>
              <p className="text-slate-500 max-w-md font-medium text-base">
                Khám phá các mã màu thịnh hành nhất cho bề mặt kim loại và kiến trúc.
              </p>
            </div>
            <Link href="/colors" className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all no-underline">
              Tra Cứu Toàn Bộ <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {paintColors.slice(0, 12).map((color) => (
              <div onClick={() => setSelectedTrendingColor(color)} key={color.code} className="group flex flex-col items-center no-underline cursor-pointer">
                <div
                  className="w-full aspect-square rounded-3xl shadow-sm border border-slate-200 mb-5 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <div className="text-center w-full">
                  <div className="text-[15px] font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{color.name}</div>
                  <div className="text-[13px] font-bold text-slate-400 mt-1">{color.code}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{color.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCTS SECTION (Balanced) ═══════ */}
      <section id="san-pham" className="px-8 py-20 bg-white">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3 uppercase">
                Danh Mục Sản Phẩm
              </h2>
              <p className="text-slate-500 max-w-md font-medium text-base">
                Khám phá các dòng sơn tĩnh điện cao cấp quốc tế.
              </p>
            </div>
            <Link href="/san-pham" className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all no-underline">
              Xem tất cả <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingProducts ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-3xl h-[400px]"></div>
              ))
            ) : (
              products.map((sp) => (
                <div key={sp._id} className="group bg-white rounded-3xl border border-slate-100 p-5 transition-all hover:shadow-xl hover:-translate-y-2 relative">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-slate-50 relative cursor-pointer" onClick={() => handleViewProduct(sp)}>
                    <img src={getImageUrl(sp.HinhAnh)} alt={sp.TenDongSon} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/95 px-3 py-1 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-widest shadow-sm">{sp.PhanLoai}</div>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl scale-75 group-hover:scale-100 transition-all duration-300"><Eye size={24} /></div>
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1" onClick={() => handleViewProduct(sp)}>{sp.TenDongSon}</h3>
                    <p className="text-[11px] text-slate-400 font-bold mb-6 uppercase tracking-widest">{sp.ThuongHieu}</p>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-bold text-xl">{sp.DonGiaCoSo?.toLocaleString()} ₫</span>
                        <span className="text-xs text-slate-400 font-medium">/ {sp.DonViTinh || 'Kg'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 h-10">
                        <button onClick={() => updateQuantity(sp._id, -1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold cursor-pointer">-</button>
                        <input type="number" min="1" value={productQuantities[sp._id] || 1} onChange={(e) => handleQuantityChange(sp._id, e.target.value)} onBlur={() => handleQuantityBlur(sp._id)} className="w-8 text-center bg-transparent border-none text-sm font-bold text-slate-800 outline-none appearance-none" />
                        <button onClick={() => updateQuantity(sp._id, 1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold cursor-pointer">+</button>
                      </div>
                      <button onClick={() => addToCart(sp)} disabled={cartLoading === sp._id} className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md font-bold text-[13px] cursor-pointer ${cartMessage.id === sp._id ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}>
                        {cartLoading === sp._id ? <Loader2 size={16} className="animate-spin" /> : cartMessage.id === sp._id ? <ShoppingCart size={16} /> : <><Plus size={16} /> Thêm</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════ TIN TỨC & KHUYẾN MÃI (Uniform) ═══════ */}
      <section id="tin-tuc" className="px-8 py-20 bg-slate-50">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Newspaper className="text-blue-600" size={28} />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                Tin tức & Khuyến mãi
              </h2>
            </div>
            <p className="text-slate-500 max-w-lg mx-auto font-medium text-base">
              Cập nhật xu hướng công nghệ sơn và ưu đãi hấp dẫn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingNews ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-50 rounded-3xl h-[400px]"></div>
              ))
            ) : (
              news.map((item) => (
                <div key={item._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
                  <div className="h-56 overflow-hidden relative">
                    <img src={getImageUrl(item.HinhAnh)} alt={item.TieuDe} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-blue-600 px-3 py-1 rounded-md">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.TieuDe}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">{item.Abstract || "Thông tin kỹ thuật mới nhất..."}</p>
                    <button className="text-blue-600 font-bold text-xs flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-widest">
                      Chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-[1300px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white">V</div>
                <span className="font-bold text-2xl tracking-tight uppercase">VTSC PaintPro</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-10 max-w-sm text-[15px] font-medium">Đại lý cấp 1 AkzoNobel Interpon. Tiên phong giải pháp bề mặt công nghiệp thông minh.</p>
              <div className="flex gap-4">
                <SocialLink icon={<Facebook size={20} />} href="#" />
                <SocialLink icon={<Twitter size={20} />} href="#" />
                <SocialLink icon={<Instagram size={20} />} href="#" />
              </div>
            </div>
            <div className="lg:col-span-3">
              <h4 className="text-sm font-bold mb-8 uppercase tracking-widest text-slate-300">Hệ thống</h4>
              <ul className="space-y-4 text-slate-400 font-medium text-sm">
                <li><Link href="/colors" className="hover:text-blue-500 transition-colors no-underline">Bảng màu sơn</Link></li>
                <li><Link href="/tracking" className="hover:text-blue-500 transition-colors no-underline">QR Tracking</Link></li>
                <li><Link href="/login" className="hover:text-blue-500 transition-colors no-underline">Đối tác B2B</Link></li>
              </ul>
            </div>
            <div className="lg:col-span-4">
              <h4 className="text-sm font-bold mb-8 uppercase tracking-widest text-slate-300">Liên hệ</h4>
              <div className="space-y-5">
                <ContactItem icon={<Mail size={20} className="text-blue-500" />} text="contact@vtscpaint.com" />
                <ContactItem icon={<Phone size={20} className="text-blue-500" />} text="+84 (028) 3888 9999" />
                <ContactItem icon={<MapPin size={20} className="text-blue-500" />} text="Landmark 81, Quận Bình Thạnh, TP. Hồ Chí Minh" />
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-10 text-slate-500 text-xs font-medium text-center sm:text-left">
            © 2026 VTSC PaintPro. All rights reserved. Đồ án Nhóm 41.
          </div>
        </div>
      </footer>

      {/* ═══════ PRODUCT DETAIL MODAL (Refined Fonts) ═══════ */}
      {isViewOpen && selectedProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative">
            <button onClick={() => setIsViewOpen(false)} className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center text-slate-950"><X size={24} /></button>
            <div className="md:w-5/12 bg-slate-50 p-10 flex items-center justify-center">
              <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-xl bg-white border-8 border-white"><img src={getImageUrl(selectedProduct.HinhAnh)} alt={selectedProduct.TenDongSon} className="w-full h-full object-cover" /></div>
            </div>
            <div className="md:w-7/12 p-10 sm:p-14 overflow-y-auto">
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center px-4 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white uppercase tracking-widest mb-4">{selectedProduct.PhanLoai}</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">{selectedProduct.TenDongSon}</h2>
                  <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">{selectedProduct.ThuongHieu}</p>
                </div>
                <div className="flex items-center gap-8 py-6 border-y border-slate-100">
                  <div><p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Giá đề xuất</p><p className="text-3xl font-bold text-emerald-600">{selectedProduct.DonGiaCoSo?.toLocaleString()} ₫</p></div>
                  <div className="h-12 w-px bg-slate-100"></div>
                  <div><p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Quy cách</p><p className="text-2xl font-bold text-slate-800">{selectedProduct.DonViTinh || 'Kg'}</p></div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Mô tả sản phẩm</h4>
                  <p className="text-slate-500 text-base leading-relaxed font-medium">{selectedProduct.MoTa || "Dòng sơn tĩnh điện AkzoNobel cao cấp..."}</p>
                </div>
                {selectedProduct.DanhSachMaMau && selectedProduct.DanhSachMaMau.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Màu sắc sẵn có ({selectedProduct.DanhSachMaMau.length})</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.DanhSachMaMau.map((m: any, i: number) => (
                        <div key={i} className="group/item relative">
                          <div className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-110" style={{ background: m.HexCode }} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/item:opacity-100 transition-all whitespace-nowrap pointer-events-none">{m.MaMau} — {m.TenMau}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Số lượng</span>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 w-32">
                      <button onClick={() => updateQuantity(selectedProduct._id, -1)} className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg cursor-pointer">-</button>
                      <input type="number" min="1" value={productQuantities[selectedProduct._id] || 1} onChange={(e) => handleQuantityChange(selectedProduct._id, e.target.value)} onBlur={() => handleQuantityBlur(selectedProduct._id)} className="w-12 text-center bg-transparent border-none text-base font-bold text-slate-900 outline-none appearance-none" />
                      <button onClick={() => updateQuantity(selectedProduct._id, 1)} className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg cursor-pointer">+</button>
                    </div>
                  </div>
                  <button onClick={() => addToCart(selectedProduct)} disabled={cartLoading === selectedProduct._id} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50 cursor-pointer">
                    {cartLoading === selectedProduct._id ? <Loader2 className="animate-spin" size={24} /> : <><ShoppingCart size={24} />{cartMessage.id === selectedProduct._id ? "Đã vào giỏ!" : "Thêm vào giỏ hàng"}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TRENDING COLOR MODAL ═══════ */}
      {selectedTrendingColor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedTrendingColor.name}</h3>
                <p className="text-sm font-semibold text-blue-600">{selectedTrendingColor.code}</p>
              </div>
              <button onClick={() => setSelectedTrendingColor(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div
                className="w-full h-40 rounded-2xl shadow-inner border border-slate-200 mb-6"
                style={{ backgroundColor: selectedTrendingColor.hex }}
              />

              <div className="space-y-0 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
                <DetailRow label="Mã Màu" value={selectedTrendingColor.code} />
                <DetailRow label="HEX" value={selectedTrendingColor.hex} />
                <DetailRow label="Danh mục" value={selectedTrendingColor.category} />
                <DetailRow label="Độ bóng" value={selectedTrendingColor.gloss} />
                <DetailRow label="Bề mặt" value={selectedTrendingColor.surface} />
                <DetailRow label="Ứng dụng" value={selectedTrendingColor.application} />
                <DetailRow label="Độ phủ lý thuyết" value={selectedTrendingColor.coverage} />
                <DetailRow label="Quy cách đóng gói" value={selectedTrendingColor.packaging} />
                <div className="flex justify-between items-start pt-3 border-t border-slate-200 mt-0 pb-3">
                  <span className="font-semibold text-blue-600 text-sm w-1/3">Quy trình pha chế</span>
                  <span className="font-bold text-slate-900 text-sm text-right w-2/3 leading-relaxed">{selectedTrendingColor.mixing}</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer">
                <Sparkles size={16} /> Yêu cầu mẫu thử
              </button>
              <button onClick={() => setSelectedTrendingColor(null)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CHAT BUBBLE */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white rounded-[32px] shadow-2xl w-[380px] h-[550px] mb-4 border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"><Bot size={24} /></div><div><h4 className="text-white font-bold text-sm">Trợ lý VTSC</h4><p className="text-blue-100 text-xs font-bold animate-pulse">Online</p></div></div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] p-4 rounded-2xl text-[14px] font-medium shadow-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}>{msg.text}</div></div>
              ))}
              {sendingChat && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600 font-bold">...</div></div>}
            </div>
            <form onSubmit={handleSendChat} className="p-6 bg-white border-t border-slate-100 flex gap-3">
              <input type="text" placeholder="Hỏi VTSC..." className="flex-1 bg-slate-100 border-none rounded-xl px-5 py-3 text-sm font-medium outline-none" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
              <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"><Send size={20} /></button>
            </form>
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all relative">
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>
    </div>
  );
}

function ServiceCard({
  icon, iconBg, iconColor, title, desc, ctaText, ctaColor, href,
}: any) {
  return (
    <Link href={href} className="flex flex-col bg-white p-10 rounded-3xl border border-slate-100 no-underline text-inherit transition-all duration-300 hover:shadow-xl hover:border-blue-100">
      <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-8 flex-shrink-0 transition-all duration-300`}>{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">{desc}</p>
      <span className={`inline-flex items-center gap-2 ${ctaColor} font-bold text-sm group-hover:gap-3 transition-all uppercase tracking-wider`}>{ctaText}<ChevronRight size={18} /></span>
    </Link>
  );
}

function SocialLink({ icon, href }: any) {
  return <Link href={href} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">{icon}</Link>;
}

function ContactItem({ icon, text }: any) {
  return <div className="flex items-start gap-4"><div className="mt-1 flex-shrink-0">{icon}</div><p className="text-slate-400 font-medium text-base leading-relaxed">{text}</p></div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-3 last:border-0 last:pb-0 pt-3 first:pt-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}
