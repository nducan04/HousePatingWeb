"use client";

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
  ArrowLeft,
  FileText,
  CreditCard,
  MessageCircle,
  RefreshCcw
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { paintColors } from "@/lib/data/colors-data";
import CustomerWarrantyHistoryModal from "@/components/CustomerWarrantyHistoryModal";

import { resolveImageUrl } from '@/lib/utils/imageUrl';
import ProductImageCarousel from "@/components/ProductImageCarousel";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; text: string }[]
  >([
    {
      role: "bot",
      text: "Xin chào! Tôi là trợ lý ảo VTSC. Tôi có thể giúp gì cho bạn?",
    },
  ]);
  const [sendingChat, setSendingChat] = useState(false);

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
  } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartView, setCartView] = useState<'cart' | 'vouchers' | 'messages' | 'message_detail'>('cart');
  const [vouchersData, setVouchersData] = useState<any[]>([]);
  const [ticketsData, setTicketsData] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
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
  const [isWarrantyHistoryOpen, setIsWarrantyHistoryOpen] = useState(false);
  const [selectedPolicyType, setSelectedPolicyType] = useState<
    "shopping_guide" | "payment" | "return" | "warranty" | "shipping" | null
  >(null);

  // Achievements Slider State
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartX === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStartX - clientX;

    if (diff > 50) {
      setCurrentAchievementIndex((prev) => (prev + 1) % 4); // 4 is ACHIEVEMENTS_DATA.length
    } else if (diff < -50) {
      setCurrentAchievementIndex((prev) => (prev === 0 ? 3 : prev - 1));
    }
    setDragStartX(null);
  };

  useEffect(() => {
    if (isCartOpen && cartView === 'vouchers' && vouchersData.length === 0) {
      api.get('/promotions').then(res => {
        if (res.data.success) setVouchersData(res.data.data.filter((v: any) => v.TrangThai === 'DANG_DIEN_RA'));
      }).catch(console.error);
    }
    if (isCartOpen && cartView === 'messages' && ticketsData.length === 0 && isAuthenticated) {
      Promise.all([api.get('/doi-tra'), api.get('/warranties')]).then(([ret, war]) => {
        const all = [];
        if (ret.data?.success) all.push(...ret.data.data.map((t: any) => ({ ...t, _type: 'RETURN' })));
        if (war.data?.success) all.push(...war.data.data.map((t: any) => ({ ...t, _type: 'WARRANTY' })));
        setTicketsData(all);
      }).catch(console.error);
    }
  }, [isCartOpen, cartView, isAuthenticated]);

  const ACHIEVEMENTS_DATA = [
    {
      id: 1,
      image: "/images/pandora.jpg",
      title: "DỰ ÁN PANDORA",
      subtitle: "Giải Pháp Màu Sắc Đương Đại",
      description: "VTSC PaintPro đồng hành cùng vẻ đẹp bền vững của các công trình nghệ thuật kiến trúc hiện đại."
    },
    {
      id: 2,
      image: "/images/phobac.jpg",
      title: "DỰ ÁN PHỐ BẮC",
      subtitle: "Dấu Ấn Đô Thị Tương Lai",
      description: "Sơn tĩnh điện chất lượng cao mang đến diện mạo hoàn hảo cho các khu đô thị mới."
    },
    {
      id: 3,
      image: "/images/phonam.jpg",
      title: "DỰ ÁN PHỐ NAM",
      subtitle: "Không Gian Sống Đẳng Cấp",
      description: "Sự kết hợp hoàn hảo giữa công nghệ bảo vệ bề mặt tiên tiến và thiết kế tinh tế."
    },
    {
      id: 4,
      image: "/images/tthanhchinh",
      title: "TRUNG TÂM HÀNH CHÍNH",
      subtitle: "Công Trình Trọng Điểm Quốc Gia",
      description: "Khẳng định uy tín và chất lượng qua những dự án mang tầm vóc biểu tượng."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAchievementIndex((prev) => (prev + 1) % ACHIEVEMENTS_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const POLICIES_DATA: any = {
    shopping_guide: {
      id: "shopping_guide",
      title: "Hướng dẫn mua hàng",
      icon: <ShoppingCart size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3 text-lg">Hướng dẫn mua hàng tại VTSC PaintPro</h4>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">Chúng tôi cung cấp quy trình mua hàng đơn giản, nhanh chóng và tiện lợi.</p>
            
            <div class="space-y-4">
              <div>
                <strong class="text-slate-900">Bước 1: Tìm kiếm sản phẩm</strong>
                <p class="text-slate-500 text-sm mt-1">Bạn có thể tìm kiếm sản phẩm theo tên, danh mục hoặc duyệt qua các bộ sưu tập của chúng tôi. Sử dụng bộ lọc để tìm sản phẩm phù hợp với nhu cầu.</p>
              </div>
              
              <div>
                <strong class="text-slate-900">Bước 2: Chọn sản phẩm</strong>
                <p class="text-slate-500 text-sm mt-1">Nhấn vào sản phẩm để xem chi tiết. Chọn biến thể (kích thước, màu sắc) phù hợp, sau đó thêm vào giỏ hàng hoặc mua ngay.</p>
              </div>
              
              <div>
                <strong class="text-slate-900">Bước 3: Đặt hàng</strong>
                <ul class="list-disc pl-5 mt-1 space-y-1 text-slate-500 text-sm">
                  <li>Vào giỏ hàng, chọn các sản phẩm muốn đặt</li>
                  <li>Nhấn Đặt hàng để vào trang thanh toán</li>
                  <li>Điền thông tin người nhận và địa chỉ giao hàng</li>
                  <li>Chọn phương thức thanh toán phù hợp</li>
                  <li>Nhấn xác nhận đặt hàng</li>
                </ul>
              </div>
              
              <div>
                <strong class="text-slate-900">Bước 4: Theo dõi đơn hàng</strong>
                <p class="text-slate-500 text-sm mt-1">Sau khi đặt hàng thành công, bạn có thể theo dõi trạng thái đơn hàng trong mục <strong>Đơn hàng của tôi</strong> (cần đăng nhập).</p>
              </div>
            </div>
            
            <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-6">
              <p class="text-amber-800 text-sm"><strong>Lưu ý:</strong> Để nhận được hỗ trợ tốt nhất, vui lòng đăng nhập trước khi đặt hàng. Bạn cũng có thể đặt hàng không cần tài khoản nhưng sẽ không theo dõi được đơn hàng online.</p>
            </div>
          </section>
        </div>
      `,
    },
    payment: {
      id: "payment",
      title: "Chính sách thanh toán",
      icon: <CreditCard size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3 text-lg">Chính sách thanh toán</h4>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">VTSC PaintPro chấp nhận nhiều hình thức thanh toán để phù hợp với nhu cầu của mọi khách hàng.</p>
            
            <div class="space-y-6">
              <div>
                <strong class="text-slate-900">1. Thanh toán khi nhận hàng (COD)</strong>
                <p class="text-slate-500 text-sm mt-1">Bạn thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được sản phẩm. Áp dụng cho tất cả đơn hàng trong nước.</p>
              </div>
              
              <div>
                <strong class="text-slate-900">2. Thanh toán chuyển khoản ngân hàng</strong>
                <p class="text-slate-500 text-sm mt-1">Quý khách vui lòng chuyển khoản theo thông tin tài khoản công ty. Đơn hàng sẽ được xử lý ngay sau khi hệ thống xác nhận thanh toán thành công.</p>
              </div>
            </div>
            
            <div class="mt-8 border-t border-slate-100 pt-6">
              <h4 class="text-slate-900 font-bold mb-3">Lưu ý quan trọng</h4>
              <ul class="list-disc pl-5 mt-2 space-y-2 text-slate-500 text-sm">
                <li>Giá niêm yết đã bao gồm VAT.</li>
                <li>Phí vận chuyển được tính riêng dựa trên địa chỉ giao hàng và khối lượng đơn.</li>
                <li>VTSC PaintPro không thu thêm bất kỳ phụ phí ẩn nào.</li>
                <li>Hóa đơn VAT được xuất theo yêu cầu.</li>
              </ul>
            </div>
          </section>
        </div>
      `,
    },
    shipping: {
      id: "shipping",
      title: "Chính sách giao hàng",
      icon: <Truck size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3 text-lg">Chính sách giao hàng</h4>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">VTSC PaintPro giao hàng trên toàn quốc và quốc tế thông qua đối tác vận chuyển uy tín.</p>
            
            <div class="mt-4">
              <strong class="text-slate-900">Khu vực giao hàng & Thời gian</strong>
              <div class="overflow-x-auto mt-2">
                <table class="w-full text-sm text-left border-collapse border border-slate-200">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="p-3 border border-slate-200">Khu vực</th>
                      <th class="p-3 border border-slate-200">Thời gian</th>
                      <th class="p-3 border border-slate-200">Phí ship cơ bản</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600">
                    <tr>
                      <td class="p-3 border border-slate-200">Nội thành Hà Nội / TP.HCM</td>
                      <td class="p-3 border border-slate-200">1 - 2 ngày</td>
                      <td class="p-3 border border-slate-200">Theo trọng lượng</td>
                    </tr>
                    <tr>
                      <td class="p-3 border border-slate-200">Các tỉnh thành khác</td>
                      <td class="p-3 border border-slate-200">3 - 5 ngày</td>
                      <td class="p-3 border border-slate-200">Theo trọng lượng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="mt-6">
              <strong class="text-slate-900">Phụ phí đặc biệt</strong>
              <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-500 text-sm">
                <li><strong>Hàng cồng kềnh:</strong> Phụ phí thêm theo quy định của đơn vị vận chuyển.</li>
                <li><strong>Giao nhanh / Hỏa tốc:</strong> Áp dụng trong nội thành, phụ phí thêm.</li>
              </ul>
            </div>
            
            <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-6">
              <p class="text-amber-800 text-sm"><strong>Lưu ý:</strong> Thời gian giao hàng có thể thay đổi vào các ngày lễ, Tết hoặc khi có sự cố thiên tai.</p>
            </div>
          </section>
        </div>
      `,
    },
    return: {
      id: "return",
      title: "Chính sách đổi trả",
      icon: <RefreshCcw size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3 text-lg">Chính sách đổi trả hàng</h4>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">VTSC PaintPro cam kết hỗ trợ đổi trả hàng trong các trường hợp hợp lý nhằm bảo vệ quyền lợi khách hàng.</p>
            
            <div class="space-y-4">
              <div>
                <strong class="text-slate-900">Điều kiện đổi trả</strong>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-500 text-sm">
                  <li>Sản phẩm bị lỗi kỹ thuật, hỏng hóc do lỗi sản xuất hoặc vận chuyển.</li>
                  <li>Giao sai sản phẩm, sai màu sắc hoặc sai số lượng so với đơn đặt hàng.</li>
                  <li>Sản phẩm còn nguyên bao bì, chưa qua sử dụng, còn đầy đủ tem mác.</li>
                </ul>
              </div>
              
              <div>
                <strong class="text-slate-900">Thời hạn đổi trả</strong>
                <p class="text-slate-500 text-sm mt-1">Khách hàng có <strong>07 ngày</strong> kể từ khi nhận hàng để thông báo yêu cầu đổi trả. Sau thời gian này, chúng tôi không thể giải quyết khiếu nại.</p>
              </div>
              
              <div>
                <strong class="text-slate-900">Quy trình đổi trả</strong>
                <ol class="list-decimal pl-5 mt-1 space-y-1 text-slate-500 text-sm">
                  <li>Chụp ảnh/video sản phẩm lỗi và gửi kèm mã đơn hàng.</li>
                  <li>Liên hệ hotline <strong>0329 835 725</strong> hoặc email để thông báo.</li>
                  <li>Nhân viên xác nhận và hướng dẫn gửi hàng về.</li>
                  <li>Sau khi nhận và kiểm tra, chúng tôi gửi hàng thay thế hoặc hoàn tiền.</li>
                </ol>
              </div>
              
              <div>
                <strong class="text-slate-900">Hoàn tiền</strong>
                <p class="text-slate-500 text-sm mt-1">Thời gian hoàn tiền: 3 - 5 ngày làm việc sau khi xác nhận đổi trả. Tiền được hoàn qua phương thức thanh toán ban đầu.</p>
              </div>
            </div>
          </section>
        </div>
      `,
    },
    warranty: {
      id: "warranty",
      title: "Chính sách bảo hành",
      icon: <ShieldCheck size={24} className="text-blue-600" />,
      content: `
        <div class="space-y-6">
          <section>
            <h4 class="text-slate-900 font-bold mb-3 text-lg">Chính sách bảo hành</h4>
            <p class="text-slate-500 leading-relaxed text-sm mb-4">VTSC PaintPro cung cấp chính sách bảo hành rõ ràng, minh bạch để bảo vệ quyền lợi khách hàng lâu dài.</p>
            
            <div class="mt-4">
              <strong class="text-slate-900">Thời gian bảo hành</strong>
              <div class="overflow-x-auto mt-2">
                <table class="w-full text-sm text-left border-collapse border border-slate-200">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="p-3 border border-slate-200">Loại sản phẩm</th>
                      <th class="p-3 border border-slate-200">Thời gian bảo hành</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-600">
                    <tr>
                      <td class="p-3 border border-slate-200">Sơn tĩnh điện ngoài trời cao cấp</td>
                      <td class="p-3 border border-slate-200">12 - 24 tháng</td>
                    </tr>
                    <tr>
                      <td class="p-3 border border-slate-200">Sơn tĩnh điện trong nhà</td>
                      <td class="p-3 border border-slate-200">12 tháng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="mt-6">
              <strong class="text-slate-900">Phạm vi bảo hành</strong>
              <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-500 text-sm">
                <li>Lỗi kỹ thuật từ nhà sản xuất (phai màu bất thường, bong tróc do chất lượng sơn).</li>
                <li>Biến dạng hoặc xuống cấp trong điều kiện sử dụng bình thường.</li>
              </ul>
            </div>
            
            <div class="mt-6">
              <strong class="text-slate-900">Không thuộc phạm vi bảo hành</strong>
              <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-500 text-sm">
                <li>Hư hỏng do va đập, cọ xát, hóa chất mạnh, hoặc sử dụng sai cách, sai quy trình kỹ thuật.</li>
                <li>Thi công trên bề mặt không đạt tiêu chuẩn.</li>
              </ul>
            </div>
          </section>
        </div>
      `,
    },
  };

  const handleOpenPolicy = (type: "shopping_guide" | "payment" | "return" | "warranty" | "shipping") => {
    setSelectedPolicyType(type);
    setIsPolicyOpen(true);
  };
  // Cart quantity state
  const [productQuantities, setProductQuantities] = useState<
    Record<string, number>
  >({});

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
        const sessionId = user?.id || "GUEST_SESSION";
        await fetchCart(sessionId);
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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setSendingChat(true);

    try {
      const sessionId = user?.id || "GUEST_SESSION";
      const res = await api.post("/chatbot/message", { sessionId, message: userMsg });
      if (res.data.success) {
        setChatHistory((prev) => [
          ...prev,
          { role: "bot", text: res.data.data.response },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "Không thể kết nối với máy chủ AI." },
      ]);
    } finally {
      setSendingChat(false);
    }
  };



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

  const addToCart = async (sp: any, maMau?: string) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    const qtyToAdd = productQuantities[sp._id] || 1;
    const existingItem = cartItems.find((item) => item.SanPham?._id === sp._id && (item.MaMau || 'N/A') === (maMau || 'N/A'));
    const newQty = existingItem ? existingItem.SoLuong + qtyToAdd : qtyToAdd;

    if (newQty > (sp.TongTonKho || 0)) {
      setCartMessage({ id: sp._id, text: `Kho chỉ còn ${sp.TongTonKho || 0}!` });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 3000);
      return;
    }

    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      await addToCartStore(sessionId, sp._id, newQty, maMau);
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


  const removeFromCart = async (sanPhamId: string, maMau?: string) => {
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      await removeFromCartStore(sessionId, sanPhamId, maMau);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const handleUpdateCartItemQuantity = async (sanPhamId: string, soLuong: number, maMau?: string) => {
    if (soLuong < 1) return;
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      await updateQuantityStore(sessionId, sanPhamId, soLuong, maMau);
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
      const res = await api.post("/orders/checkout", {
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
          router.push("/orders");
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
          if (redirectPath === 'WARRANTY_HISTORY') {
            setIsWarrantyHistoryOpen(true);
          } else {
            router.push(redirectPath);
          }
          setRedirectPath(null);
        } else if (role === "Admin" || role === "Director") {
          router.push("/dashboard");
        } else if (role === "NhanVien") {
          router.push("/products");
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
    if (product.DanhSachMaMau && product.DanhSachMaMau.length > 0) {
      setSelectedColor(product.DanhSachMaMau[0]);
    } else {
      setSelectedColor(null);
    }
    setMtoRequested(false);
    setIsViewOpen(true);
  };

  const getImageUrl = (path: any) => {
    return resolveImageUrl(path, 'https://ui-avatars.com/api/?name=VTSC+Product&background=random');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased">
      {/* ═══════ HEADER / NAVBAR ═══════ */}
      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-200/40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 no-underline group">
            <div className="w-[180px] h-[60px] rounded-[16px] bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transition-transform group-hover:scale-110 px-3">
              <img src="/images/vosco-logo.png" alt="VTSC Logo" className="w-full h-full object-contain" />
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
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('san-pham')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Sản phẩm
            </Link>
            <Link
              href="#bang-mau"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('bang-mau')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Bảng màu
            </Link>
            <Link
              href="/tracking"
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Theo dõi & Tra cứu
            </Link>
            <Link
              href="#quy-trinh"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('quy-trinh')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Quy trình
            </Link>
            <Link
              href="#tin-tuc"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('tin-tuc')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Tin tức
            </Link>
            <Link
              href="#footer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all duration-300 no-underline px-3 py-2 rounded-xl whitespace-nowrap"
            >
              Liên hệ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center w-[220px] bg-slate-100 rounded-lg px-4 h-10 border border-slate-200/50">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, màu sơn..."
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 ml-3 w-full placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div
              className="relative group cursor-pointer"
              onClick={async () => {
                const nextState = !isCartOpen;
                setIsCartOpen(nextState);
                if (nextState) {
                  // Refresh cart when opening
                  const sessionId = user?.id || "GUEST_SESSION";
                  fetchCart(sessionId);
                }
              }}
            >
              <ShoppingCart
                size={22}
                className={`transition-colors ${isCartOpen ? "text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
              />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              )}

              {/* Cart Dropdown */}
              {isCartOpen && (
                <div
                  className="absolute top-full right-0 mt-4 w-[350px] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[110]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingCart size={18} className="text-blue-600" /> Giỏ
                      hàng của bạn
                    </h4>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {cartItemCount} món
                    </span>
                  </div>

                  {/* Premium Horizontal Navigation */}
                  <div className="flex gap-2 py-3 px-4 bg-slate-50/60 border-b border-slate-100 overflow-x-auto scrollbar-none">
                    <Link
                      href={user && (user.role === 'KhachHangB2B' || user.role === 'KhachHangB2C') ? "/my-orders" : "/orders"}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-300 text-center no-underline cursor-pointer shadow-sm group min-w-[70px]"
                      onClick={(e) => {
                        setIsCartOpen(false);
                        if (!isAuthenticated) {
                          e.preventDefault();
                          handleServiceClick(user && (user.role === 'KhachHangB2B' || user.role === 'KhachHangB2C') ? "/my-orders" : "/orders");
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package size={14} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight">Đơn hàng</span>
                    </Link>

                    <Link
                      href="/tracking"
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all duration-300 text-center no-underline cursor-pointer shadow-sm group min-w-[70px]"
                      onClick={(e) => {
                        setIsCartOpen(false);
                        if (!isAuthenticated) {
                          e.preventDefault();
                          handleServiceClick("/tracking");
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck size={14} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight">Tracking</span>
                    </Link>

                    <Link
                      href="/payments"
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-300 text-center no-underline cursor-pointer shadow-sm group min-w-[70px]"
                      onClick={(e) => {
                        setIsCartOpen(false);
                        if (!isAuthenticated) {
                          e.preventDefault();
                          handleServiceClick("/payments");
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <QrCode size={14} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight">Thanh toán</span>
                    </Link>

                    <Link
                      href={user && (user.role === 'KhachHangB2B' || user.role === 'KhachHangB2C') ? "/tracking?tab=rd" : "/rd-tracking"}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all duration-300 text-center no-underline cursor-pointer shadow-sm group min-w-[70px]"
                      onClick={(e) => {
                        setIsCartOpen(false);
                        if (!isAuthenticated) {
                          e.preventDefault();
                          handleServiceClick(user && (user.role === 'KhachHangB2B' || user.role === 'KhachHangB2C') ? "/tracking?tab=rd" : "/rd-tracking");
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Beaker size={14} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight">R&D</span>
                    </Link>


                    <button
                      onClick={() => {
                        if (!isAuthenticated) return setIsLoginOpen(true);
                        setCartView('messages');
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-lg hover:border-pink-300 hover:shadow-sm transition-all duration-300 text-center cursor-pointer shadow-sm group min-w-[70px]"
                    >
                      <div className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight">Tin nhắn</span>
                    </button>
                  </div>

                  {cartView === 'cart' && (
                    <>
                      <div className="max-h-[350px] overflow-y-auto p-4 space-y-4">
                        {cartItems.length === 0 ? (
                          <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                              <Package size={32} />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">
                              Giỏ hàng đang trống
                            </p>
                          </div>
                        ) : (
                          cartItems.map((item: any, idx: number) => (
                            <div
                              key={item._id || idx}
                              className="flex gap-4 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                              <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                                <img
                                  src={getImageUrl(item.SanPham?.HinhAnh)}
                                  alt={item.SanPham?.TenDongSon}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h5 className="text-[13px] font-bold text-slate-900 truncate mb-0.5">
                                  {item.SanPham?.TenDongSon}
                                </h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {item.SanPham?.MaSanPham}
                                  </span>
                                  {item.MaMau && item.MaMau !== 'N/A' && (
                                    <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-tighter bg-emerald-50 px-1.5 rounded">
                                      Màu: {item.MaMau}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-tighter bg-blue-50 px-1.5 rounded">
                                    {item.SanPham?.PhanLoai}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                    <button
                                      onClick={() => handleUpdateCartItemQuantity(item.SanPham?._id, item.SoLuong - 1, item.MaMau)}
                                      className="w-5 h-5 rounded-md bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center font-bold shadow-sm text-xs"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.SoLuong}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) handleUpdateCartItemQuantity(item.SanPham?._id, val, item.MaMau);
                                      }}
                                      onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val) || val < 1) handleUpdateCartItemQuantity(item.SanPham?._id, 1, item.MaMau);
                                      }}
                                      className="w-8 text-[11px] font-bold text-blue-600 text-center bg-transparent border-none outline-none appearance-none"
                                    />
                                    <button
                                      onClick={() => handleUpdateCartItemQuantity(item.SanPham?._id, item.SoLuong + 1, item.MaMau)}
                                      className="w-5 h-5 rounded-md bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center font-bold shadow-sm text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[12px] font-bold text-slate-900">
                                      {(
                                        item.SanPham?.DonGiaCoSo * item.SoLuong
                                      )?.toLocaleString()}{" "}
                                      ₫
                                    </span>
                                    <button
                                      onClick={() =>
                                        removeFromCart(item.SanPham?._id, item.MaMau)
                                      }
                                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                      title="Xóa khỏi giỏ hàng"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {cartItems.length > 0 && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Tạm tính
                              </span>
                              <span className="text-sm font-bold text-slate-600">
                                {cartItems
                                  .reduce(
                                    (acc, item) =>
                                      acc + item.SanPham?.DonGiaCoSo * item.SoLuong,
                                    0,
                                  )
                                  .toLocaleString()}{" "}
                                ₫
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Thuế VAT (8%)
                              </span>
                              <span className="text-sm font-bold text-slate-600">
                                {((cartItems.reduce((acc, item) => acc + item.SanPham?.DonGiaCoSo * item.SoLuong, 0)) >= 5000000 ? (cartItems.reduce((acc, item) => acc + item.SanPham?.DonGiaCoSo * item.SoLuong, 0) * 0.08) : 0).toLocaleString()} ₫
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Tổng cộng
                              </span>
                              <span className="text-lg font-bold text-blue-600">
                                {((cartItems.reduce((acc, item) => acc + item.SanPham?.DonGiaCoSo * item.SoLuong, 0)) >= 5000000 ? (cartItems.reduce((acc, item) => acc + item.SanPham?.DonGiaCoSo * item.SoLuong, 0) * 1.08) : cartItems.reduce((acc, item) => acc + item.SanPham?.DonGiaCoSo * item.SoLuong, 0)).toLocaleString()} ₫
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleDirectCheckout}
                            disabled={isCheckingOut}
                            className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer border-none"
                          >
                            {isCheckingOut ? 'Đang xử lý...' : 'Đặt hàng ngay'} <ArrowRight size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  )}


                  {cartView === 'messages' && (
                    <div className="p-4 bg-slate-50 h-[450px] flex flex-col">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                        <button onClick={() => setCartView('cart')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                          <ArrowLeft size={16} />
                        </button>
                        <h4 className="font-bold text-slate-800 text-sm">Tin nhắn hỗ trợ</h4>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {ticketsData.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs font-medium">Bạn chưa có yêu cầu hỗ trợ nào.</div>
                        ) : (
                          ticketsData.map((t, i) => {
                            const title = t._type === 'WARRANTY' ? 'Bảo hành' : 'Đổi trả';
                            return (
                              <div key={i}
                                onClick={() => { setSelectedTicket(t); setCartView('message_detail'); }}
                                className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                  <Bot size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <div className="font-bold text-[13px] text-slate-800 truncate">{title} - {t.SanPham || 'Sản phẩm'}</div>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">{t.PhuongAnGiaiQuyet ? "VTSC: " + t.PhuongAnGiaiQuyet : "Bạn: " + (t.NoiDungLoi || t.LyDo)}</div>
                                </div>
                                {t.PhuongAnGiaiQuyet && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {cartView === 'message_detail' && selectedTicket && (
                    <div className="p-0 bg-slate-50 h-[450px] flex flex-col">
                      {/* Chat Header */}
                      <div className="flex items-center gap-3 p-3 bg-white border-b border-slate-100 shadow-sm z-10">
                        <button onClick={() => setCartView('messages')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                          <ArrowLeft size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Bot size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-slate-800 leading-tight">CSKH VTSC</div>
                          <div className="text-[10px] text-slate-400 font-medium">Hỗ trợ {selectedTicket._type === 'WARRANTY' ? 'Bảo hành' : 'Đổi trả'}</div>
                        </div>
                      </div>

                      {/* Chat Body */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="text-center text-[10px] text-slate-400 my-2">{new Date(selectedTicket.createdAt).toLocaleDateString('vi-VN')}</div>

                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-blue-600 text-white rounded-lg rounded-tr-sm p-3 shadow-sm">
                            <div className="text-[12px] whitespace-pre-wrap">{selectedTicket.NoiDungLoi || selectedTicket.LyDo}</div>
                            <div className="text-[9px] text-blue-200 mt-1 text-right">{new Date(selectedTicket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>

                        {/* System Status / Admin Reply */}
                        {selectedTicket.PhuongAnGiaiQuyet ? (
                          <div className="flex justify-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                              <Bot size={12} />
                            </div>
                            <div className="max-w-[85%] bg-white border border-slate-100 text-slate-700 rounded-lg rounded-tl-sm p-3 shadow-sm">
                              <div className="text-[12px] whitespace-pre-wrap">{selectedTicket.PhuongAnGiaiQuyet}</div>
                              <div className="text-[9px] text-slate-400 mt-1">{new Date(selectedTicket.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                              <Bot size={12} />
                            </div>
                            <div className="max-w-[85%] bg-slate-100 text-slate-500 rounded-lg rounded-tl-sm p-3 italic text-[11px]">
                              Hệ thống đang xử lý yêu cầu của bạn. Vui lòng chờ phản hồi từ CSKH...
                            </div>
                          </div>
                        )}

                        {/* Resolution actions if any */}
                        {['Đã hoàn tất', 'Đã hoàn tiền', 'Đã khắc phục'].includes(selectedTicket.TrangThai) && !selectedTicket.KhachHangDanhGia && (
                          <div className="flex flex-col items-center mt-4 p-3 bg-white border border-emerald-100 rounded-xl shadow-sm">
                            <div className="text-[11px] font-bold text-emerald-600 mb-2">Vấn đề đã được giải quyết?</div>
                            <Link href="/my-orders" className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors no-underline">
                              Đến đơn hàng để đánh giá
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Chat Input (Disabled just for show) */}
                      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input type="text" disabled placeholder="Cuộc trò chuyện đã đóng..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 text-[12px] disabled:opacity-70" />
                        <button disabled className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-50">
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg no-underline shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 w-fit"
              >
                Khám phá dịch vụ <ArrowRight size={22} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ DỊCH VỤ & THẾ MẠNH (Uniform Typography) ═══════ */}
      <section id="dich-vu" className="px-6 py-20 bg-white scroll-mt-8">
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
              href="/my-contracts"
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
              href="/tracking"
            />
            <ServiceCard
              icon={<ShieldCheck size={28} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title="Bảo hành chính hãng"
              desc="Hỗ trợ kỹ thuật 24/7 từ các chuyên gia sơn tĩnh điện hàng đầu Việt Nam."
              ctaText="Chi tiết"
              ctaColor="text-amber-600"
              href="/my-warranties"
              onClick={(e: any) => {
                e.preventDefault();
                handleServiceClick("/my-warranties");
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════ QUY TRÌNH PHA CHẾ SƠN (Mới) ═══════ */}
      <section id="quy-trinh" className="px-8 py-24 bg-slate-50 scroll-mt-2">
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
            <p className="text-slate-600 max-w-2xl mx-auto font-medium text-lg">
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
                    className={`w-20 h-20 ${item.color} rounded-[30px] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 duration-500 border border-white`}
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

          <div className="mt-20 p-8 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 flex-shrink-0">
                <MessageSquare size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">
                  Theo dõi quy trình xử lý và pha chế sơn
                </h4>
                <p className="text-slate-500 font-medium">
                  Đội ngũ kỹ thuật của VTSC sẵn sàng hỗ trợ bạn 24/7.
                </p>
              </div>
            </div>
            <button className="px-10 py-4 bg-slate-900 text-white rounded-lg font-bold text-base hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300 shadow-xl cursor-pointer border-none">
              Theo dõi yêu cầu R&D
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ BẢNG MÀU XU HƯỚNG ═══════ */}
      <section id="bang-mau" className="px-8 py-20 bg-white scroll-mt-8">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Palette className="text-blue-600" size={28} />
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                  Bảng màu xu hướng
                </h2>
              </div>
              <p className="text-slate-600 max-w-md font-medium text-base">
                Khám phá các mã màu thịnh hành nhất cho bề mặt kim loại và kiến
                trúc.
              </p>
            </div>
            <Link
              href="/colors"
              className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all duration-300 no-underline"
            >
              Tra cứu toàn bộ <ArrowRight size={18} />
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
                  className="w-full aspect-square rounded-xl shadow-sm border border-slate-200 mb-5 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl"
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

          <div className="mt-12 flex justify-center">
            <Link
              href="/colors"
              className="px-10 py-4 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition-all duration-300 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 w-fit no-underline"
            >
              Xem tất cả bảng màu <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCTS SECTION (Balanced) ═══════ */}
      <section id="san-pham" className="px-8 py-20 bg-white scroll-mt-8">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3 uppercase">
                Danh mục sản phẩm
              </h2>
              <p className="text-slate-500 max-w-md font-medium text-base">
                Khám phá các dòng sơn tĩnh điện cao cấp quốc tế.
              </p>
            </div>
            <Link
              href="/shop"
              className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all duration-300 no-underline"
            >
              Xem tất cả <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingProducts ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl h-[400px]"
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
              <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-100">
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
                    className="group bg-white rounded-xl border border-slate-100 p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300 relative"
                  >
                    <div
                      className="aspect-square rounded-lg overflow-hidden mb-6 bg-slate-50 relative cursor-pointer"
                      onClick={() => handleViewProduct(sp)}
                    >
                      <ProductImageCarousel product={sp} />
                      <div className="absolute top-4 left-4 bg-white/95 px-3 py-1 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-widest shadow-sm">
                        {sp.PhanLoai}
                      </div>
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl scale-75 group-hover:scale-100 transition-all duration-300 duration-300">
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
                        Tồn kho: <span className="font-bold text-slate-700">{sp.TongTonKho}</span> {sp.DonViTinh || "Kg"}
                      </p>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-emerald-600 font-bold text-xl">
                            {sp.DonGiaCoSo?.toLocaleString()} ₫
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            / {sp.DonViTinh || "Kg"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 h-10">
                          <button
                            onClick={() => updateQuantity(sp._id, -1, sp.TongTonKho)}
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300 font-bold cursor-pointer"
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
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => addToCart(sp)}
                          disabled={cartLoading === sp._id}
                          className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md font-bold text-[13px] cursor-pointer ${cartMessage.id === sp._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500 text-white" : "bg-red-500 text-white text-[10px]") : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}
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
              className="px-10 py-4 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition-all duration-300 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 w-fit no-underline"
            >
              Xem tất cả sản phẩm <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ THÀNH TỰU NỔI BẬT ═══════ */}
      <section
        className="relative h-[500px] sm:h-[600px] w-full overflow-hidden bg-slate-900 group select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {ACHIEVEMENTS_DATA.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentAchievementIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className={`max-w-4xl w-full text-center space-y-4 transition-all duration-300 duration-1000 ease-out ${idx === currentAchievementIndex ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <p className="text-blue-400 font-bold tracking-[0.2em] uppercase text-sm sm:text-base drop-shadow-md">{item.subtitle}</p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight shadow-black/50 drop-shadow-xl">
                  {item.title}
                </h2>
                <p className="text-slate-300 font-medium text-lg sm:text-xl max-w-2xl mx-auto drop-shadow-md pt-2">
                  {item.description}
                </p>
                <div className="pt-8">
                  <button className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-sm uppercase tracking-widest transition-all duration-300 cursor-pointer">
                    Khám phá ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-3">
          {ACHIEVEMENTS_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentAchievementIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 duration-500 cursor-pointer ${idx === currentAchievementIndex ? 'w-12 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════ TIN TỨC & KHUYẾN MÃI (Uniform) ═══════ */}
      <section id="tin-tuc" className="px-8 py-20 bg-slate-50 scroll-mt-8">
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
                  className="animate-pulse bg-slate-50 rounded-xl h-[400px]"
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
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => {
                    setSelectedNews(item);
                    setIsNewsOpen(true);
                  }}
                >
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={getImageUrl(item.HinhAnh)}
                      alt={item.TieuDe}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                    <button className="text-blue-600 font-bold text-xs flex items-center gap-2 hover:gap-3 transition-all duration-300 uppercase tracking-widest">
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
        className="relative text-white pt-20 pb-10 scroll-mt-8 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img src="/login-illustration.png" alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/95"></div>
        </div>

        <div className="relative z-10 max-w-[1300px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
            {/* Column 1: Company Info */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-[200px] h-[68px] flex-shrink-0 rounded-[16px] bg-white flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden px-4">
                  <img src="/images/vosco-logo.png" alt="VTSC Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-xl tracking-tight uppercase text-white">
                  CÔNG TY CP TMDV VOSCO (VTSC)
                </span>
              </div>
              <div className="space-y-5 text-white">
                <ContactItem
                  icon={<MapPin size={20} className="text-white" />}
                  text="215 Lạch Tray, Phường Gia Viên, Thành phố Hải Phòng"
                />
                <ContactItem
                  icon={<Phone size={20} className="text-white" />}
                  text="+84 (028) 3888 9999"
                />
                <ContactItem
                  icon={<Mail size={20} className="text-white" />}
                  text="contact@vtscpaint.com"
                />
              </div>
              <div className="flex gap-4 mt-10">
                <SocialLink icon={<Facebook size={20} color="blue" background-color="blue" />} href="https://facebook.com" />
                <SocialLink icon={<Twitter size={20} color="black" background-color="black" />} href="https://x.com" />
                <SocialLink icon={<Instagram size={20} color="pink" background-color="pink" />} href="https://instagram.com" />
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
                    onClick={() => handleOpenPolicy("shopping_guide")}
                    className="hover:text-blue-400 transition-colors text-slate-300 bg-transparent border-none p-0 cursor-pointer text-left"
                  >
                    - Hướng dẫn mua hàng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOpenPolicy("payment")}
                    className="hover:text-blue-400 transition-colors text-slate-300 bg-transparent border-none p-0 cursor-pointer text-left"
                  >
                    - Chính sách thanh toán
                  </button>
                </li>
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
                    href="/tracking"
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

      {/* ═══════ PRODUCT DETAIL MODAL (Refined Fonts) ═══════ */}
      {isViewOpen && selectedProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative">
            <button
              onClick={() => setIsViewOpen(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-all duration-300 flex items-center justify-center text-slate-950"
            >
              <X size={24} />
            </button>
            <div className="md:w-5/12 bg-slate-50 p-10 flex items-center justify-center">
              <div className="aspect-square w-full rounded-xl overflow-hidden shadow-xl bg-white border-8 border-white">
                <ProductImageCarousel product={selectedProduct} className="w-full h-full" />
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

                {selectedProduct.TruyXuatNguonGoc && (selectedProduct.TruyXuatNguonGoc.NgaySanXuat || selectedProduct.TruyXuatNguonGoc.HoaDonMuaSon) && (
                  <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <QrCode size={14} className="text-blue-600" /> Truy Xuất Nguồn Gốc
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedProduct.TruyXuatNguonGoc.NgaySanXuat && (
                        <div>
                          <span className="text-slate-500 font-bold text-[10px] uppercase block mb-0.5">Ngày SX</span>
                          <span className="font-semibold text-slate-800">{new Date(selectedProduct.TruyXuatNguonGoc.NgaySanXuat).toLocaleDateString("vi-VN")}</span>
                        </div>
                      )}
                      {selectedProduct.TruyXuatNguonGoc.HanSuDung && (
                        <div>
                          <span className="text-slate-500 font-bold text-[10px] uppercase block mb-0.5">Hạn SD</span>
                          <span className="font-semibold text-slate-800">{selectedProduct.TruyXuatNguonGoc.HanSuDung}</span>
                        </div>
                      )}
                      {selectedProduct.TruyXuatNguonGoc.QuyTrinhSanXuat && (
                        <div className="col-span-2">
                          <span className="text-slate-500 font-bold text-[10px] uppercase block mb-0.5">Quy trình</span>
                          <span className="font-semibold text-slate-800">{selectedProduct.TruyXuatNguonGoc.QuyTrinhSanXuat}</span>
                        </div>
                      )}
                      {selectedProduct.TruyXuatNguonGoc.HoaDonMuaSon && (
                        <div className="col-span-2 mt-1">
                          <a href={resolveImageUrl(selectedProduct.TruyXuatNguonGoc.HoaDonMuaSon)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                            <FileText size={14} /> Xem Hóa Đơn / Chứng Từ
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedProduct.DanhSachMaMau &&
                  selectedProduct.DanhSachMaMau.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Màu sắc sẵn có ({selectedProduct.DanhSachMaMau.length})
                      </h4>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {selectedProduct.DanhSachMaMau.map(
                          (m: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setSelectedColor(m)}
                              className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all duration-300 hover:bg-slate-50 text-left ${selectedColor?.MaMau === m.MaMau ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 shadow-sm'}`}
                            >
                              {m.HinhAnh ? (
                                <img src={getImageUrl(m.HinhAnh)} alt={m.TenMau} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm flex-shrink-0" style={{ background: m.HexCode }} />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{m.TenMau}</p>
                                <p className="text-[11px] font-semibold text-slate-500 uppercase">Mã: {m.MaMau}</p>
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      Số lượng
                    </span>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 w-32">
                      <button
                        onClick={() => updateQuantity(selectedProduct._id, -1, selectedProduct.TongTonKho)}
                        className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300 font-bold text-lg cursor-pointer"
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
                        className="flex-1 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300 font-bold text-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedProduct.DanhSachMaMau?.length > 0 && !selectedColor) {
                        alert("Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng");
                        return;
                      }
                      addToCart(selectedProduct, selectedColor?.MaMau);
                    }}
                    disabled={cartLoading === selectedProduct._id}
                    className={`w-full h-16 text-white rounded-lg font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50 cursor-pointer ${cartMessage.id === selectedProduct._id ? (cartMessage.text === "Đã thêm vào giỏ!" ? "bg-emerald-500" : "bg-red-500 text-sm") : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
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
                className="w-full h-40 rounded-lg shadow-inner border border-slate-200 mb-6"
                style={{ backgroundColor: selectedTrendingColor.hex }}
              />

              <div className="space-y-0 bg-slate-50 px-5 py-2 rounded-lg border border-slate-100">
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

      {/* AI CHAT BUBBLE */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white rounded-[32px] shadow-2xl w-[380px] h-[550px] mb-4 border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Bot size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Trợ lý VTSC</h4>
                  <p className="text-blue-100 text-xs font-bold animate-pulse">
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-lg text-[14px] font-medium shadow-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {sendingChat && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-lg shadow-sm text-blue-600 font-bold">
                    ...
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={handleSendChat}
              className="p-6 bg-white border-t border-slate-100 flex gap-3"
            >
              <input
                type="text"
                placeholder="Hỏi VTSC..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-5 py-3 text-sm font-medium outline-none"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button
                type="submit"
                className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-300"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all duration-300 relative"
        >
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>

      {isLoginOpen && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setIsLoginOpen(false);
                setIsRegisterMode(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all duration-300 cursor-pointer"
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
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Tên đăng nhập"
                    required
                  />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Email đã đăng ký"
                    required
                  />
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Mật khẩu mới"
                    required
                  />
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 border-none cursor-pointer"
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
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Tên đăng nhập"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
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
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 border-none cursor-pointer"
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

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold">
                      Hoặc
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    type="button"
                    className="w-full h-12 bg-[#0f172a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all duration-300 border-none cursor-pointer"
                  >
                    <img
                      src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png"
                      className="w-4 h-4"
                      alt="Apple"
                    />
                    Đăng nhập bằng Apple
                  </button>
                  <button
                    type="button"
                    className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png"
                      className="w-4 h-4"
                      alt="Google"
                    />
                    Đăng nhập bằng Google
                  </button>
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
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Tên đăng nhập"
                    required
                  />

                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Họ và tên đầy đủ / Tên doanh nghiệp"
                    required
                  />

                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
                    placeholder="Email"
                    required
                  />

                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300"
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
                      className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all duration-300 cursor-pointer"
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
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 border-none cursor-pointer"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsNewsOpen(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-slate-100 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center text-slate-950 cursor-pointer"
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
                    className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border-none"
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                  <span className="font-black text-slate-900 text-lg uppercase tracking-tight hidden sm:block">VTSC PaintPro</span>
                </div>
              </div>
              <button
                onClick={() => setIsPolicyOpen(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 font-medium text-sm cursor-pointer"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden bg-slate-50/50">
              {/* Sidebar */}
              <div className="w-72 border-r border-slate-100 bg-white shrink-0 overflow-y-auto hidden md:block">
                <div className="p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hỗ trợ khách hàng</h3>
                  <div className="space-y-1">
                    {Object.values(POLICIES_DATA).map((policy: any) => {
                      const isActive = selectedPolicyType === policy.id;
                      return (
                        <button
                          key={policy.id}
                          onClick={() => setSelectedPolicyType(policy.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <div className={isActive ? 'text-blue-600' : 'text-slate-400'}>{policy.icon}</div>
                          {policy.title}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 p-5 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Cần hỗ trợ thêm?</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-rose-500" />
                        <span className="font-semibold">0329 835 725</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span>contact@vtscpaint.com</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MessageCircle size={14} className="text-blue-500" />
                        <span>Chat Zalo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-6">
                    <span>Trang chủ</span>
                    <ChevronRight size={14} />
                    <span>Hỗ trợ</span>
                    <ChevronRight size={14} />
                    <span className="text-slate-900 font-bold">{POLICIES_DATA[selectedPolicyType].title}</span>
                  </div>

                  <div className="bg-blue-600 rounded-t-2xl p-8 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -right-4 -bottom-4 p-8 opacity-10 scale-150">
                      {POLICIES_DATA[selectedPolicyType].icon}
                    </div>
                    <div className="relative z-10 flex items-start gap-5">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md shadow-sm border border-white/10 shrink-0">
                        <div className="text-white scale-125">
                          {POLICIES_DATA[selectedPolicyType].icon}
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-2">Hỗ trợ khách hàng</div>
                        <h1 className="text-3xl font-black tracking-tight">{POLICIES_DATA[selectedPolicyType].title}</h1>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-8 sm:p-10 shadow-sm relative z-20 -mt-1">
                    <div
                      className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-p:text-slate-600 prose-li:text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: POLICIES_DATA[selectedPolicyType].content,
                      }}
                    />

                    <div className="mt-12 pt-8 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-4">Xem thêm</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.values(POLICIES_DATA)
                          .filter((p: any) => p.id !== selectedPolicyType)
                          .map((policy: any) => (
                            <button
                              key={policy.id}
                              onClick={() => setSelectedPolicyType(policy.id)}
                              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md transition-all duration-300 text-left group cursor-pointer"
                            >
                              <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                                {policy.icon}
                              </div>
                              <span className="font-semibold text-sm text-slate-700 group-hover:text-blue-700">{policy.title}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerWarrantyHistoryModal
        isOpen={isWarrantyHistoryOpen}
        onClose={() => setIsWarrantyHistoryOpen(false)}
      />
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
    <div className="flex flex-col bg-white p-10 rounded-xl border border-slate-100 no-underline text-inherit transition-all duration-300 duration-300 hover:shadow-xl hover:border-blue-100 h-full">
      <div
        className={`w-14 h-14 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-8 flex-shrink-0 transition-all duration-300 duration-300`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">
        {desc}
      </p>
      <span
        className={`inline-flex items-center gap-2 ${ctaColor} font-bold text-sm group-hover:gap-3 transition-all duration-300 uppercase tracking-wider`}
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
      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm"
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
