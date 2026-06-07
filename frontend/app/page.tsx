"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthNav from "@/lib/components/AuthNav";
import {
  Search,
  QrCode,
  Beaker,
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
  Trash2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore, getGuestSessionId } from "@/lib/store/cartStore";
import { paintColors } from "@/lib/data/colors-data";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import { QRCodeCanvas } from "qrcode.react";

const BACKEND_URL = "http://localhost:5000";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Achievement slider state
  const [activeAchievement, setActiveAchievement] = useState(0);
  const achievements = [
    { title: "Tòa nhà hành chính mới Hải Phòng", img: "/images/tthanhchinh" },
    { title: "Phố Nam", img: "/images/phonam.jpg" },
    { title: "Trung tâm tổ chức tiệc cưới và sự kiện Pandora", img: "/images/pandora.jpg" },
    { title: "Phố Bắc", img: "/images/phobac.jpg" },
    { title: "Dự án tương lai", img: "/images/gemini.jpg" },
  ];



  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [cartLoading, setCartLoading] = useState("");
  const [cartMessage, setCartMessage] = useState({ id: "", text: "" });

  // Full cart data from store
  const {
    cartItems,
    cartItemCount,
    fetchCart,
    addToCart: addToCartStore,
    removeFromCart: removeFromCartStore,
    updateQuantity: updateQuantityStore,
    initializeCart,
  } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("KhachHangB2C");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Trending Color Modal state
  const [selectedTrendingColor, setSelectedTrendingColor] = useState<
    any | null
  >(null);

  // News detail modal state
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  // Policy modal state
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [selectedPolicyType, setSelectedPolicyType] = useState<
    "return" | "warranty" | "shipping" | null
  >(null);

  const POLICIES_DATA = {
    return: {
      title: "Chính sách đổi trả",
      icon: <ArrowRight size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3">1. Điều kiện đổi trả</h4>
            <p class="text-slate-500 leading-relaxed text-sm">Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu:</p>
            <ul class="list-disc pl-5 mt-2 space-y-2 text-slate-500 text-sm">
              <li>Sản phẩm bị lỗi kỹ thuật do nhà sản xuất (AkzoNobel).</li>
              <li>Sản phẩm giao không đúng mã màu, chủng loại khách hàng đã đặt.</li>
              <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển của VTSC.</li>
              <li>Sản phẩm còn nguyên bao bì, tem nhãn và chưa qua sử dụng.</li>
            </ul>
          </section>
          <section>
            <h4 class="text-slate-900 font-bold mb-3">2. Quy trình đổi trả</h4>
            <p class="text-slate-500 leading-relaxed text-sm">Quý khách vui lòng liên hệ hotline: <strong>+84 (028) 3888 9999</strong> hoặc gửi email về <strong>contact@vtscpaint.com</strong> kèm theo hóa đơn và hình ảnh sản phẩm để được hỗ trợ xử lý trong 24h.</p>
          </section>
        </div>
      `,
    },
    warranty: {
      title: "Chính sách bảo hành",
      icon: <ShieldCheck size={24} className="text-emerald-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3">1. Thời hạn bảo hành</h4>
            <p class="text-slate-500 leading-relaxed text-sm">Tất cả các dòng sơn tĩnh điện AkzoNobel Interpon do VTSC cung cấp được bảo hành từ 12 - 24 tháng tùy dòng sản phẩm theo tiêu chuẩn của nhà sản xuất.</p>
          </section>
          <section>
            <h4 class="text-slate-900 font-bold mb-3">2. Phạm vi bảo hành</h4>
            <ul class="list-disc pl-5 mt-2 space-y-2 text-slate-500 text-sm">
              <li>Bảo hành độ bền màu theo tiêu chuẩn ISO của AkzoNobel.</li>
              <li>Bảo hành độ bám dính bề mặt khi thi công đúng quy trình kỹ thuật.</li>
              <li>Hỗ trợ kỹ thuật kiểm tra mẫu tại phòng lab VTSC nếu có khiếu nại.</li>
            </ul>
          </section>
          <section>
            <h4 class="text-slate-900 font-bold mb-3">3. Trường hợp từ chối bảo hành</h4>
            <p class="text-slate-500 leading-relaxed text-sm">Hư hỏng do sử dụng sai quy trình kỹ thuật, pha trộn tạp chất, hoặc do các tác động ngoại lực, môi trường khắc nghiệt vượt ngoài khuyến cáo kỹ thuật.</p>
          </section>
        </div>
      `,
    },
    shipping: {
      title: "Chính sách vận chuyển",
      icon: <Truck size={24} className="text-amber-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3">1. Khu vực vận chuyển</h4>
            <p class="text-slate-500 leading-relaxed text-sm">VTSC cung cấp dịch vụ giao hàng chuyên nghiệp trên toàn lãnh thổ Việt Nam.</p>
          </section>
          <section>
            <h4 class="text-slate-900 font-bold mb-3">2. Chi phí & Thời gian</h4>
            <ul class="list-disc pl-5 mt-2 space-y-2 text-slate-500 text-sm">
              <li><strong>Nội thành Hải Phòng:</strong> Miễn phí giao hàng cho đơn từ 100kg. Thời gian: 24h.</li>
              <li><strong>Các tỉnh thành khác:</strong> Hỗ trợ phí vận chuyển ra chành xe hoặc sử dụng dịch vụ chuyển phát nhanh theo yêu cầu. Thời gian: 1-3 ngày.</li>
            </ul>
          </section>
          <section>
            <h4 class="text-slate-900 font-bold mb-3">3. Kiểm tra hàng hóa</h4>
            <p class="text-slate-500 leading-relaxed text-sm">Khách hàng vui lòng kiểm tra tình trạng bao bì và số lượng ngay khi nhận hàng từ nhân viên giao nhận.</p>
          </section>
        </div>
      `,
    },
  };

  const handleOpenPolicy = (type: "return" | "warranty" | "shipping") => {
    setSelectedPolicyType(type);
    setIsPolicyOpen(true);
  };
  // Cart quantity state
  const [productQuantities, setProductQuantities] = useState<
    Record<string, number>
  >({});

  // Auto-slide achievements every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAchievement((prev) => (prev + 1) % achievements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [achievements.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await api.get("/san-pham-son");
        if (productRes.data.success) {
          setProducts(productRes.data.data);
        }
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setFetchError(err.message || String(err));
      } finally {
        setLoadingProducts(false);
      }

      try {
        const newsRes = await api.get("/tin-tuc");
        if (newsRes.data.success) {
          setNews(newsRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoadingNews(false);
      }

      try {
        await initializeCart(user?.id);
      } catch (err) {
        // Ignore errors if cart doesn't exist yet
      }
    };

    fetchData();
  }, [user?.id]);

  // Click outside to close cart dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCartOpen && !target.closest(".relative.group.cursor-pointer")) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartOpen]);





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
      setProductQuantities((prev) => ({
        ...prev,
        [id]: "" as unknown as number,
      }));
    }
  };

  const handleQuantityBlur = (id: string) => {
    if (!productQuantities[id]) {
      setProductQuantities((prev) => ({ ...prev, [id]: 1 }));
    }
  };

  const router = useRouter();

  const addToCart = async (sp: any) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    const qtyToAdd = productQuantities[sp._id] || 1;
    const existingItem = cartItems.find((item) => item.SanPham?._id === sp._id);
    const newQty = existingItem ? existingItem.SoLuong + qtyToAdd : qtyToAdd;

    if (newQty > (sp.TongTonKho || 0)) {
      setCartMessage({ id: sp._id, text: `Kho chỉ còn ${sp.TongTonKho || 0}!` });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return;
    }

    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || getGuestSessionId();
      await addToCartStore(sessionId, sp._id, newQty);
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


  const removeFromCart = async (sanPhamId: string) => {
    try {
      const sessionId = user?.id || getGuestSessionId();
      await removeFromCartStore(sessionId, sanPhamId);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const handleUpdateCartItemQuantity = async (sanPhamId: string, soLuong: number) => {
    if (soLuong < 1) return;
    try {
      const sessionId = user?.id || getGuestSessionId();
      await updateQuantityStore(sessionId, sanPhamId, soLuong);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const handleServiceClick = (path: string) => {
    if (!isAuthenticated) {
      setRedirectPath(path);
      setIsLoginOpen(true);
    } else {
      router.push(path);
    }
  };

  const handleDirectCheckout = async () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (cartItems.length === 0) return;

    try {
      setIsCheckingOut(true);
      const sessionId = user?.id;
      const res = await api.post("/don-hang/checkout", {
        sessionId: sessionId,
        khachHangId: user?.id,
        diaChiGiaoHang: user?.profile?.DiaChi || "Địa chỉ mặc định",
        ghiChu: "Khách hàng đặt nhanh từ trang chủ",
      });

      if (res.data.success) {
        setIsCartOpen(false);
        useCartStore.setState({
          cartItems: [],
          cartItemCount: 0,
          cartTotal: 0,
        });

        alert("Đặt hàng thành công!");
        if (user?.role === "KhachHangB2B" || user?.role === "KhachHangB2C") {
          router.push("/my-orders");
        } else {
          router.push("/don-hang");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const { loginState } = useAuthStore.getState();
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const res = await api.post("/auth/login", {
        TenDangNhap: loginEmail,
        MatKhau: loginPassword,
      });
      if (res.data.success) {
        loginState(res.data.user, res.data.accessToken);
        setIsLoginOpen(false);

        const role = res.data.user.role;
        if (redirectPath) {
          router.push(redirectPath);
          setRedirectPath(null);
        } else if (role === "NhanVien" || role === "Admin" || role === "Director") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePageRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registerUsername ||
      !registerFullName ||
      !registerEmail ||
      !registerPassword ||
      !registerRole
    ) {
      setRegisterError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setRegisterLoading(true);
      setRegisterError(null);
      const res = await api.post("/auth/register", {
        TenDangNhap: registerUsername,
        HoTen: registerFullName,
        Email: registerEmail,
        MatKhau: registerPassword,
        VaiTro: registerRole,
      });

      if (res.data.success) {
        setRegisterSuccess(true);
        setTimeout(() => {
          setIsRegisterMode(false);
          setRegisterSuccess(false);
          setLoginEmail(registerUsername);
        }, 2000);
      }
    } catch (err: any) {
      setRegisterError(err.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !forgotUsername ||
      !forgotEmail ||
      !forgotNewPassword ||
      !forgotConfirmPassword
    ) {
      setForgotError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setIsResetting(true);
      setForgotError(null);
      const res = await api.post("/auth/reset-password", {
        TenDangNhap: forgotUsername,
        Email: forgotEmail,
        MatKhauMoi: forgotNewPassword,
      });

      if (res.data.success) {
        setForgotSuccess(true);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotSuccess(false);
          setForgotUsername("");
          setForgotEmail("");
          setForgotNewPassword("");
          setForgotConfirmPassword("");
          setLoginEmail(forgotUsername);
        }, 2000);
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsResetting(false);
    }
  };

  const [mtoRequested, setMtoRequested] = useState(false); // Add state for Production Request/MTO

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedColor(null);
    setMtoRequested(false);
    setIsViewOpen(true);
  };

  const getImageUrl = (path: any) => {
    return resolveImageUrl(
      path,
      "https://ui-avatars.com/api/?name=VTSC+Product&background=random"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased">
      {/* ═══════ HEADER / NAVBAR ═══════ */}
      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-200/40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 no-underline group">
            <div className="w-[180px] h-[60px] rounded-[16px] bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transition-transform group-hover:scale-110 px-3">
              <img src="/vtsc.png" alt="VTSC Logo" className="w-full h-full object-contain" />
            </div>

          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            <Link
              href="/"
              className="text-[13px] font-bold text-blue-600 no-underline px-3 py-2 rounded-xl bg-blue-50 whitespace-nowrap"
            >
              Trang chủ
            </Link>
            <Link
              href="#san-pham"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Sản phẩm
            </Link>
            <Link
              href="#bang-mau"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-2 xl:px-2.5 2xl:px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Bảng màu
            </Link>
            <Link
              href="/tracking"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-2 xl:px-2.5 2xl:px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Theo dõi & Tra cứu
            </Link>
            <Link
              href="#quy-trinh"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Quy trình
            </Link>
            <Link
              href="#tin-tuc"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Tin tức
            </Link>
            <Link
              href="#footer"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Liên hệ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center w-[220px] bg-slate-100 rounded-2xl px-4 h-10 border border-slate-200/50">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, màu sơn..."
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 ml-3 w-full placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link
              href="/cart"
              className="relative group cursor-pointer no-underline"
            >
              <ShoppingCart
                size={22}
                className="transition-colors text-slate-400 group-hover:text-blue-600"
              />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <AuthNav onOpenLogin={() => setIsLoginOpen(true)} />
          </div>
        </div>
      </header>

      {/* ═══════ HERO BANNER (Balanced Fonts) ═══════ */}
      <section className="relative h-[550px] sm:h-[650px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/paint_factory_exterior_1778742118407.png"
            alt="VTSC Factory"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-10 flex flex-col justify-center items-start">
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Hệ thống VTSC Paint Technology
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight uppercase text-slate-900">
              Đại lý phân phối
              <br />
              <span className="text-blue-600">Sơn tĩnh điện</span>
              <br />
              hàng đầu Việt Nam
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              Giải pháp sơn tĩnh điện AkzoNobel Interpon chuyên nghiệp. Đảm bảo
              chất lượng bền bỉ, thẩm mỹ cao cho mọi bề mặt kim loại.
            </p>
            <div className="pt-6">
              <Link
                href="#dich-vu"
                className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg no-underline shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 w-fit"
              >
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ServiceCard
              icon={<FlaskConical size={28} />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              title="Pha chế sơn theo mẫu"
              desc="Nhận yêu cầu R&D mẫu màu sơn theo yêu cầu của dự án, đảm bảo chính xác tuyệt đối."
              ctaText="Gửi mẫu"
              ctaColor="text-blue-600"
              onClick={() => {
                if (!isAuthenticated) {
                  setRedirectPath("/rd-tracking/new");
                  setIsLoginOpen(true);
                } else {
                  router.push("/rd-tracking/new");
                }
              }}
            />
            <ServiceCard
              icon={<Newspaper size={28} />}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              title="Hợp đồng nguyên tắc mua bán sơn"
              desc="Tạo và ký kết hợp đồng nguyên tắc mua bán sơn với VTSC."
              ctaText="Quản lý hợp đồng"
              ctaColor="text-red-600"
              href="/hop-dong-cua-toi"
              onClick={(e: any) => {
                e.preventDefault();
                handleServiceClick("/my-contracts");
              }}
            />
            <ServiceCard
              icon={<Truck size={28} />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              title="Giao hàng toàn quốc"
              desc="Theo dõi lộ trình giao nhận hàng minh bạch, đảm bảo tiến độ công trình của bạn."
              ctaText="Tra cứu"
              ctaColor="text-emerald-600"
              href="/theo-doi-don-hang"
            />
            <ServiceCard
              icon={<ShieldCheck size={28} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title="Bảo hành chính hãng"
              desc="Hỗ trợ kỹ thuật 24/7 từ các chuyên gia sơn tĩnh điện hàng đầu Việt Nam."
              ctaText="Chi tiết"
              ctaColor="text-amber-600"
              href="my-warranties"
            />
          </div>
        </div>
      </section>

      {/* ═══════ QUY TRÌNH PHA CHẾ SƠN (Mới) ═══════ */}
      <section id="quy-trinh" className="px-8 py-24 bg-slate-50 scroll-mt-[25px]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <Beaker size={18} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Tiêu chuẩn AkzoNobel
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase mb-6">
              Quy trình <span className="text-blue-600">Pha chế mẫu</span>{" "}
              chuyên nghiệp
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
              Giải pháp R&D hàng đầu giúp hiện thực hóa mọi ý tưởng màu sắc cho
              công trình của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Steps with Connectors (visible on desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0" />

            {[
              {
                step: "01",
                title: "Tiếp nhận",
                desc: "Gửi mẫu vật lý hoặc mã màu RAL/Interpon yêu cầu.",
                icon: <Send className="text-blue-600" />,
                color: "bg-blue-50",
              },
              {
                step: "02",
                title: "Phân tích Lab",
                desc: "Chuyên gia phân tích hạt màu & đặc tính kỹ thuật bề mặt.",
                icon: <FlaskConical className="text-emerald-600" />,
                color: "bg-emerald-50",
              },
              {
                step: "03",
                title: "Lab Mixing",
                desc: "Pha chế mẫu thử chính xác bằng thiết bị R&D hiện đại.",
                icon: <Beaker className="text-purple-600" />,
                color: "bg-purple-50",
              },
              {
                step: "04",
                title: "Kiểm định",
                desc: "Test độ bám dính, độ bền va đập & KCS nghiêm ngặt.",
                icon: <ShieldCheck className="text-amber-600" />,
                color: "bg-amber-50",
              },
              {
                step: "05",
                title: "Duyệt mẫu",
                desc: "Bàn giao tấm test cho khách duyệt trước khi sản xuất.",
                icon: <Sparkles className="text-rose-600" />,
                color: "bg-rose-50",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 group">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-20 h-20 ${item.color} rounded-[30px] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 border border-white`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-blue-600 mb-2 tracking-[0.2em] uppercase">
                    Bước {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 p-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 flex-shrink-0">
                <MessageSquare size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">
                  Cần màu sơn độc bản cho dự án?
                </h4>
                <p className="text-slate-500 font-medium">
                  Đội ngũ kỹ thuật của VTSC sẵn sàng hỗ trợ bạn 24/7.
                </p>
              </div>
            </div>
            <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-base hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-xl cursor-pointer border-none">
              Gửi yêu cầu R&D ngay
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ BẢNG MÀU XU HƯỚNG ═══════ */}
      <section id="bang-mau" className="px-8 py-20 bg-slate-50 scroll-mt-[40px]">
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
                Khám phá các mã màu thịnh hành nhất cho bề mặt kim loại và kiến
                trúc.
              </p>
            </div>
            <Link
              href="/colors"
              className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all no-underline"
            >
              Tra Cứu Toàn Bộ <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {paintColors.slice(0, 12).map((color) => (
              <div
                onClick={() => setSelectedTrendingColor(color)}
                key={color.code}
                className="group flex flex-col items-center no-underline cursor-pointer"
              >
                <div
                  className="w-full aspect-square rounded-3xl shadow-sm border border-slate-200 mb-5 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <div className="text-center w-full">
                  <div className="text-[15px] font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {color.name}
                  </div>
                  <div className="text-[13px] font-bold text-slate-400 mt-1">
                    {color.code}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                    {color.hex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCTS SECTION (Balanced) ═══════ */}
      <section id="san-pham" className="px-8 py-20 bg-white scroll-mt-[40px]">
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
            <Link
              href="/shop"
              className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all no-underline"
            >
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingProducts ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-3xl h-[400px]"
                ></div>
              ))
            ) : products.filter((sp) => {
              const search = searchTerm.toLowerCase();
              return (
                sp.TenDongSon?.toLowerCase().includes(search) ||
                sp.MaSanPham?.toLowerCase().includes(search) ||
                sp.PhanLoai?.toLowerCase().includes(search) ||
                sp.ThuongHieu?.toLowerCase().includes(search)
              );
            }).length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-[40px] border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p className="text-slate-500 font-medium">
                  Vui lòng thử lại với từ khóa khác như "màu đỏ", "sơn bóng",
                  "RAL..."
                </p>
              </div>
            ) : (
              products
                .filter((sp) => {
                  const search = searchTerm.toLowerCase();
                  return (
                    sp.TenDongSon?.toLowerCase().includes(search) ||
                    sp.MaSanPham?.toLowerCase().includes(search) ||
                    sp.PhanLoai?.toLowerCase().includes(search) ||
                    sp.ThuongHieu?.toLowerCase().includes(search)
                  );
                })
                .slice(0, 8)
                .map((sp) => (
                  <div
                    key={sp._id}
                    className="group bg-white rounded-3xl border border-slate-100 p-5 transition-all hover:shadow-xl hover:-translate-y-2 relative"
                  >
                    <div
                      className="aspect-square rounded-2xl overflow-hidden mb-6 bg-slate-50 relative cursor-pointer"
                      onClick={() => handleViewProduct(sp)}
                    >
                      <img
                        src={getImageUrl(sp.HinhAnh)}
                        alt={sp.TenDongSon}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-white/95 px-3 py-1 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-widest shadow-sm">
                        {sp.PhanLoai}
                      </div>
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl scale-75 group-hover:scale-100 transition-all duration-300">
                          <Eye size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="px-1">
                      <h3
                        className="text-lg font-bold text-slate-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                        onClick={() => handleViewProduct(sp)}
                      >
                        {sp.TenDongSon}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">
                        {sp.ThuongHieu}
                      </p>
                      <p className="text-[12px] text-slate-500 font-medium mb-4">
                        Tồn kho: <span className="font-bold text-slate-700">{sp.TongTonKho}</span> {sp.DonViTinh || "Thùng"}
                      </p>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-emerald-600 font-bold text-xl">
                            {sp.DonGiaCoSo?.toLocaleString()} ₫
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            / {sp.DonViTinh || "Thùng"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 h-10">
                          <button
                            onClick={() => updateQuantity(sp._id, -1, sp.TongTonKho)}
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={productQuantities[sp._id] || 1}
                            onChange={(e) =>
                              handleQuantityChange(sp._id, e.target.value, sp.TongTonKho)
                            }
                            onBlur={() => handleQuantityBlur(sp._id)}
                            className="w-8 text-center bg-transparent border-none text-sm font-bold text-slate-800 outline-none appearance-none"
                          />
                          <button
                            onClick={() => updateQuantity(sp._id, 1, sp.TongTonKho)}
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => addToCart(sp)}
                          disabled={cartLoading === sp._id}
                          className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md font-bold text-[13px] cursor-pointer ${cartMessage.id === sp._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500 text-white" : "bg-red-500 text-white text-[10px]") : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}
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
                ))
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-[14px] transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 flex items-center gap-2 no-underline"
            >
              Xem tất cả sản phẩm <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ THÀNH TỰU NỔI BẬT (SLIDER) ═══════ */}
      <section id="thanh-tuu" className="relative w-full h-[80vh] min-h-[500px] overflow-hidden bg-slate-900 group">
        {achievements.map((project, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeAchievement === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img
              src={project.img}
              alt={project.title}
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${activeAchievement === idx ? "scale-110" : "scale-100"
                }`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4">
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 uppercase tracking-wide"
                style={{ textShadow: '2px 4px 8px rgba(0,0,0,0.6)' }}
              >
                {project.title}
              </h2>
              <p
                className="text-base md:text-lg text-white font-medium max-w-2xl mb-10 tracking-wide"
                style={{ textShadow: '1px 2px 4px rgba(0,0,0,0.8)' }}
              >
                Nơi Nghệ Thuật Giao Thoa Cùng Chất Lượng Vượt Trội
              </p>
              <button className="px-8 py-3.5 bg-[#c49a45] hover:bg-[#b0883b] text-white font-bold text-sm uppercase tracking-wider shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition-all hover:scale-105 cursor-pointer">
                Khám phá ngay
              </button>
            </div>
          </div>
        ))}

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-30">
          {achievements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveAchievement(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${activeAchievement === idx ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "w-4 bg-white/40 hover:bg-white/80"
                }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════ TIN TỨC & KHUYẾN MÃI (Uniform) ═══════ */}
      <section id="tin-tuc" className="px-8 py-20 bg-slate-50 scroll-mt-[40px]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Newspaper className="text-blue-600" size={28} />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                Bản tin & Quảng bá sản phẩm
              </h2>
            </div>
            <p className="text-slate-500 max-w-lg mx-auto font-medium text-base">
              Cập nhật xu hướng công nghệ sơn, dự án mới và các sản phẩm nổi bật
              từ VTSC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingNews ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-slate-50 rounded-3xl h-[400px]"
                ></div>
              ))
            ) : news.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-red-50 text-red-600 font-bold rounded-xl border border-red-100">
                Không thể tải danh sách tin tức. Lỗi:{" "}
                {fetchError || "API trả về mảng rỗng hoặc undefined!"}
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedNews(item);
                    setIsNewsOpen(true);
                  }}
                >
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={getImageUrl(item.HinhAnh)}
                      alt={item.TieuDe}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-blue-600 px-3 py-1 rounded-md">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.TieuDe}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                      {item.Abstract || "Thông tin kỹ thuật mới nhất..."}
                    </p>
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
      <footer
        id="footer"
        className="relative text-white pt-20 pb-10 scroll-mt-[40px] bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.94)), url('/login-illustration.png')`
        }}
      >
        <div className="max-w-[1300px] mx-auto px-10">
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
                    href="/my-contracts"
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

      {isViewOpen && selectedProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative">
            <button
              onClick={() => setIsViewOpen(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center text-slate-950"
            >
              <X size={24} />
            </button>
            <div className="md:w-5/12 bg-slate-50 p-10 flex items-center justify-center">
              <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-xl bg-white border-8 border-white">
                <img
                  src={getImageUrl(selectedProduct.HinhAnh)}
                  alt={selectedProduct.TenDongSon}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:w-7/12 p-10 sm:p-14 overflow-y-auto">
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center px-4 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white uppercase tracking-widest mb-4">
                    {selectedProduct.PhanLoai}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">
                    {selectedProduct.TenDongSon}
                  </h2>
                  <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">
                    {selectedProduct.ThuongHieu}
                  </p>
                </div>
                <div className="flex items-center gap-8 py-6 border-y border-slate-100">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Giá đề xuất
                    </p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {selectedProduct.DonGiaCoSo?.toLocaleString()} ₫
                    </p>
                  </div>
                  <div className="h-12 w-px bg-slate-100"></div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Quy cách
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {selectedProduct.DonViTinh || "Kg"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                    Mô tả sản phẩm
                  </h4>
                  <p className="text-slate-500 text-base leading-relaxed font-medium">
                    {selectedProduct.MoTa ||
                      "Dòng sơn tĩnh điện AkzoNobel cao cấp..."}
                  </p>
                </div>
                {selectedProduct.DanhSachMaMau &&
                  selectedProduct.DanhSachMaMau.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Màu sắc sẵn có ({selectedProduct.DanhSachMaMau.length})
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.DanhSachMaMau.map(
                          (m: any, i: number) => (
                            <div key={i} className="group/item relative">
                              <div
                                className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-110"
                                style={{ background: m.HexCode }}
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/item:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                                {m.MaMau} — {paintColors.find((c) => c.code === m.MaMau)?.name || m.TenMau}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* QR Code Truy xuất nguồn gốc */}
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                    <QRCodeCanvas
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace/${selectedProduct._id}`}
                      size={70}
                      bgColor={"#ffffff"}
                      fgColor={"#0f172a"}
                      level={"Q"}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <QrCode size={16} className="text-blue-500" />
                      Truy xuất nguồn gốc
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      Khách hàng có thể quét mã QR này để xem thông tin hóa đơn, ngày sản xuất, hạn sử dụng và quy trình.
                    </p>
                    <a
                      href={`/trace/${selectedProduct._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      Xem trước trang truy xuất ↗
                    </a>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      Số lượng
                    </span>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 w-32">
                      <button
                        onClick={() => updateQuantity(selectedProduct._id, -1, selectedProduct.TongTonKho)}
                        className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={productQuantities[selectedProduct._id] || 1}
                        onChange={(e) =>
                          handleQuantityChange(
                            selectedProduct._id,
                            e.target.value,
                            selectedProduct.TongTonKho
                          )
                        }
                        onBlur={() => handleQuantityBlur(selectedProduct._id)}
                        className="w-12 text-center bg-transparent border-none text-base font-bold text-slate-900 outline-none appearance-none"
                      />
                      <button
                        onClick={() => updateQuantity(selectedProduct._id, 1, selectedProduct.TongTonKho)}
                        className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold text-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    disabled={cartLoading === selectedProduct._id}
                    className={`w-full h-16 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 cursor-pointer ${cartMessage.id === selectedProduct._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500" : "bg-red-500 text-sm") : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"}`}
                  >
                    {cartLoading === selectedProduct._id ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : cartMessage.id === selectedProduct._id ? (
                      cartMessage.text === "Đã thêm vào giỏ!" ? (
                        <>
                          <ShoppingCart size={24} />
                          Đã vào giỏ!
                        </>
                      ) : (
                        <span>{cartMessage.text}</span>
                      )
                    ) : (
                      <>
                        <ShoppingCart size={24} />
                        Thêm vào giỏ hàng
                      </>
                    )}
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
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedTrendingColor.name}
                </h3>
                <p className="text-sm font-semibold text-blue-600">
                  {selectedTrendingColor.code}
                </p>
              </div>
              <button
                onClick={() => setSelectedTrendingColor(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
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
                <DetailRow
                  label="Danh mục"
                  value={selectedTrendingColor.category}
                />
                <DetailRow
                  label="Độ bóng"
                  value={selectedTrendingColor.gloss}
                />
                <DetailRow
                  label="Bề mặt"
                  value={selectedTrendingColor.surface}
                />
                <DetailRow
                  label="Ứng dụng"
                  value={selectedTrendingColor.application}
                />
                <DetailRow
                  label="Độ phủ lý thuyết"
                  value={selectedTrendingColor.coverage}
                />
                <DetailRow
                  label="Quy cách đóng gói"
                  value={selectedTrendingColor.packaging}
                />
                <div className="flex justify-between items-start pt-3 border-t border-slate-200 mt-0 pb-3">
                  <span className="font-semibold text-blue-600 text-sm w-1/3">
                    Quy trình pha chế
                  </span>
                  <span className="font-bold text-slate-900 text-sm text-right w-2/3 leading-relaxed">
                    {selectedTrendingColor.mixing}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setRedirectPath("/rd-tracking/new");
                    setIsLoginOpen(true);
                  } else {
                    router.push("/rd-tracking/new");
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} /> Yêu cầu mẫu thử
              </button>
              <button
                onClick={() => setSelectedTrendingColor(null)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}



      {isLoginOpen && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setIsLoginOpen(false);
                setIsRegisterMode(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              Chào Mừng Trở Lại
            </h2>

            {isForgotMode ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={16} /> {forgotError}
                  </div>
                )}
                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
                    <ShieldCheck size={16} /> Đặt lại mật khẩu thành công!
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Tên đăng nhập"
                    required
                  />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Email đã đăng ký"
                    required
                  />
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Mật khẩu mới"
                    required
                  />
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {isResetting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Cập Nhật Mật Khẩu"
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            ) : !isRegisterMode ? (
              <form onSubmit={handlePageLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={16} /> {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Tên đăng nhập"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="••••••"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên Mật Khẩu?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Đăng Nhập"
                    )}
                  </button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(true)}
                      className="text-blue-600 font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Đăng kí ngay
                    </button>
                  </p>
                </div>

              </form>
            ) : (
              <form onSubmit={handlePageRegister} className="space-y-4">
                {registerError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={16} /> {registerError}
                  </div>
                )}
                {registerSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
                    <ShieldCheck size={16} /> Đăng ký thành công! Đang chuyển
                    sang đăng nhập...
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Tên đăng nhập"
                    required
                  />

                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Họ và tên đầy đủ / Tên doanh nghiệp"
                    required
                  />

                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Email"
                    required
                  />

                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Mật khẩu"
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Loại khách hàng
                    </label>
                    <select
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value)}
                      className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all cursor-pointer"
                    >
                      <option value="KhachHangB2C">Khách hàng cá nhân</option>
                      <option value="KhachHangB2B">
                        Khách hàng doanh nghiệp
                      </option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {registerLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Đăng Ký Tài Khoản"
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Đã có tài khoản? Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ═══════ NEWS DETAIL MODAL ═══════ */}
      {isNewsOpen && selectedNews && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsNewsOpen(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-950 cursor-pointer"
            >
              <X size={24} />
            </button>

            <div className="h-[300px] sm:h-[400px] w-full relative overflow-hidden">
              <img
                src={getImageUrl(selectedNews.HinhAnh)}
                alt={selectedNews.TieuDe}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              <div className="absolute bottom-10 left-10 right-10">
                <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white uppercase tracking-widest mb-4">
                  {new Date(selectedNews.createdAt).toLocaleDateString(
                    "vi-VN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                  {selectedNews.TieuDe}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 sm:p-14 bg-white">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="prose prose-slate prose-lg max-w-none">
                  {selectedNews.NoiDung ? (
                    <div
                      className="text-slate-600 leading-relaxed font-medium space-y-4 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: selectedNews.NoiDung }}
                    />
                  ) : (
                    <p className="text-slate-500 font-medium leading-relaxed italic">
                      {selectedNews.Abstract ||
                        "Thông tin đang được cập nhật..."}
                    </p>
                  )}
                </div>

                <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      V
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Ban biên tập VTSC
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Chuyên trang quảng bá sản phẩm
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNewsOpen(false)}
                    className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all cursor-pointer border-none"
                  >
                    Đóng bài viết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ POLICY MODAL ═══════ */}
      {isPolicyOpen && selectedPolicyType && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  {POLICIES_DATA[selectedPolicyType].icon}
                </div>
                {POLICIES_DATA[selectedPolicyType].title}
              </h2>
              <button
                onClick={() => setIsPolicyOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{
                  __html: POLICIES_DATA[selectedPolicyType].content,
                }}
              />
            </div>
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-end">
              <button
                onClick={() => setIsPolicyOpen(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  ctaText,
  ctaColor,
  href,
  onClick,
}: any) {
  const CardContent = (
    <div className="flex flex-col bg-white p-10 rounded-3xl border border-slate-100 no-underline text-inherit transition-all duration-300 hover:shadow-xl hover:border-blue-100 h-full">
      <div
        className={`w-14 h-14 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-8 flex-shrink-0 transition-all duration-300`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">
        {desc}
      </p>
      <span
        className={`inline-flex items-center gap-2 ${ctaColor} font-bold text-sm group-hover:gap-3 transition-all uppercase tracking-wider`}
      >
        {ctaText}
        <ChevronRight size={18} />
      </span>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer h-full">
        {CardContent}
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      className="no-underline text-inherit h-full block"
    >
      {CardContent}
    </Link>
  );
}

function SocialLink({ icon, href }: any) {
  return (
    <Link
      href={href}
      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
    >
      {icon}
    </Link>
  );
}

function ContactItem({ icon, text }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0">{icon}</div>
      <p className="text-slate-500 font-medium text-base leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-3 last:border-0 last:pb-0 pt-3 first:pt-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}
