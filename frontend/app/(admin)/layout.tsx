"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import ProtectedRoute from "@/lib/components/ProtectedRoute";
import api from "@/lib/utils/axiosAuth";
import ThemeToggle from "@/components/ThemeToggle";
import {
  BarChart3,
  FlaskConical,
  FileSignature,
  Palette,
  QrCode,
  PanelsRightBottom,
  SignalHigh,
  TrainFront,
  ReceiptRussianRuble,
  Settings,
  Clock,
  Bell,
  User,
  ChevronRight,
  ChevronDown,
  Package,
  MessageSquare,
  FileUp,
  CloudSync,
  LogOut,
  Loader2,
  ClipboardList,
  PackageOpen,
  DollarSign,
  ShoppingCart,
  ListOrdered,
  Users,
  Shield,
  Droplets,
  Home,
  Menu,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Activity,
  Bot
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  roles: string[];
  icon?: React.ComponentType<any>;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const allNavItems: NavSection[] = [
  {
    section: "Tổng quan",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard Điều hành",
        roles: ["Admin", "Director"],
        icon: BarChart3,
      },
      {
        href: "/dashboard",
        label: "Dashboard nghiệp vụ",
        roles: ["NhanVien"],
        icon: Activity,
      },
    ],
  },
  {
    section: "Quản lý hệ thống",
    items: [
      {
        href: "/taikhoan",
        label: "Quản lý tài khoản",
        roles: ["Admin"],
        icon: Users,
      },
      {
        href: "/thongtin",
        label: "Thông tin cá nhân",
        roles: [
          "Admin",
          "NhanVien",
          "KhachHangB2B",
          "KhachHangB2C",
          "NhaCungCap",
        ],
        icon: User,
      },
      {
        href: "/phanquyen",
        label: "Quản lý phân quyền",
        roles: ["Admin"],
        icon: Shield,
      },
    ],
  },
  {
    section: "Quản lý danh mục",
    items: [
      {
        href: "/quan-ly-san-pham",
        label: "Quản lý sản phẩm",
        roles: ["Admin", "NhanVien"],
        icon: Package,
      },
      {
        href: "/gia-thanh",
        label: "Quản lý giá thành",
        roles: ["Admin"],
        icon: DollarSign,
      },
      {
        href: "/kho",
        label: "Quản lý kho (WMS)",
        roles: ["Admin", "NhanVien"],
        icon: PackageOpen,
      },
      {
        href: "/nhan-vien",
        label: "Quản lý nhân viên",
        roles: ["Admin"],
        icon: ClipboardList,
      },
      {
        href: "/doi-tac",
        label: "Quản lý khách hàng",
        roles: ["Admin", "NhanVien"],
        icon: Users,
      },
      {
        href: "/nha-cung-cap",
        label: "Nhà cung cấp",
        roles: ["Admin", "NhanVien"],
        icon: PanelsRightBottom,
      },
      {
        href: "/colors",
        label: "Tra cứu mã màu",
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
        icon: Palette,
      },
    ],
  },
  {
    section: "Kinh doanh & Vận hành",
    items: [
      {
        href: "/tin-tuc",
        label: "Quảng bá & Tin tức",
        roles: ["Admin", "NhanVien"],
        icon: Sparkles,
      },
      {
        href: "/don-hang",
        label: "Quản lý đơn hàng",
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
        icon: ShoppingCart,
      },
      {
        href: "/quan-ly-thanh-toan",
        label: "Quản lý thanh toán",
        roles: ["Admin", "NhanVien"],
        icon: ReceiptRussianRuble,
      },
      {
        href: "/van-chuyen",
        label: "Theo dõi vận chuyển",
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
        icon: TrainFront,
      },
      {
        href: "/hieu-suat",
        label: "Theo dõi hiệu suất",
        roles: ["Admin", "NhanVien"],
        icon: SignalHigh,
      },
      {
        href: "/khuyen-mai",
        label: "Chính sách ưu đãi",
        roles: ["Admin", "NhanVien"],
        icon: Layers,
      },
      {
        href: "/chatbot",
        label: "Trợ lý AI hỗ trợ",
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
        icon: Bot,
      },
    ],
  },
  {
    section: "Pha chế & R&D",
    items: [
      {
        href: "/hop-dong-pha-che",
        label: "Hợp đồng B2B Web3",
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
        icon: FileSignature,
      },
      {
        href: "/rd-tracking",
        label: "Theo dõi pha chế sơn",
        roles: ["Admin", "NhanVien"],
        icon: FlaskConical,
      },
      {
        href: "/rd-tracking/new",
        label: "Yêu cầu mẫu thử R&D",
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
        icon: Droplets,
      },
      {
        href: "/thanh-toan-hd",
        label: "Thanh toán & Công nợ HĐ",
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
        icon: DollarSign,
      },
    ],
  },
  {
    section: "Báo cáo & Phân tích",
    items: [
      {
        href: "/bao-cao",
        label: "Báo cáo tổng hợp",
        roles: ["Admin", "Director"],
        icon: FileUp,
      },
      {
        href: "/thong-ke",
        label: "Thống kê chuyên sâu",
        roles: ["Admin", "Director"],
        icon: BarChart3,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logoutState } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = user?.role || "NhanVien";
  const isCustomer = userRole === "KhachHangB2B" || userRole === "KhachHangB2C";

  // Check permissions
  useEffect(() => {
    if (isLoading || !user) return;

    if (pathname === "/dashboard" && isCustomer) {
      router.push("/");
      return;
    }

    if (
      isCustomer &&
      pathname.startsWith("/rd-tracking/") &&
      pathname !== "/rd-tracking/new"
    ) {
      return;
    }

    const matchedItems: any[] = [];
    allNavItems.forEach((section) => {
      section.items.forEach((item) => {
        if (
          item.href &&
          (pathname === item.href || pathname.startsWith(item.href + "/"))
        ) {
          matchedItems.push(item);
        }
      });
    });

    if (matchedItems.length > 0) {
      const maxLength = Math.max(...matchedItems.map((item) => item.href.length));
      const bestMatches = matchedItems.filter(
        (item) => item.href.length === maxLength
      );
      const isAllowed = bestMatches.some((item) => item.roles.includes(userRole));
      if (!isAllowed) {
        if (isCustomer) {
          router.push("/");
        } else {
          router.push("/unauthorized");
        }
      }
    }
  }, [pathname, user, userRole, isLoading, router, isCustomer]);

  // Filter navigation items by role
  const filteredNav = allNavItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const matchesRole = item.roles.includes(userRole);
        const matchesSearch = searchQuery
          ? item.label.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        return matchesRole && matchesSearch;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignored
    }
    logoutState();
    router.push("/login");
  };

  const displayName =
    user?.profile?.HoTen ||
    user?.profile?.TenKhachHang ||
    user?.username ||
    "Người dùng";

  const displayRole =
    userRole === "Admin"
      ? "Quản trị viên"
      : userRole === "Director"
      ? "Giám đốc hệ thống"
      : userRole === "NhanVien"
      ? "Chuyên viên vận hành"
      : user?.profile?.ChucVu ||
        (userRole === "KhachHangB2B" ? "Đối tác B2B" : "Khách hàng");

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(-3)
    .toUpperCase();

  const getPageTitle = () => {
    if (pathname === "/dashboard") {
      return userRole === "NhanVien" ? "Bảng tin tác nghiệp" : "Bảng điều hành thông minh";
    }
    if (pathname?.startsWith("/quan-ly-san-pham")) return "Quản lý sản phẩm sơn";
    if (pathname?.startsWith("/kho")) return "Quản lý kho hàng & WMS";
    if (pathname?.startsWith("/doi-tac")) return "Quản lý đối tác khách hàng";
    if (pathname?.startsWith("/nhan-vien")) return "Quản trị nhân sự";
    if (pathname?.startsWith("/production")) return "Hệ thống sản xuất MES";
    if (pathname?.startsWith("/rd-tracking")) return "Theo dõi công thức & R&D";
    if (pathname?.startsWith("/hop-dong-pha-che")) return "Hợp đồng B2B & Chuỗi khối";
    if (pathname === "/colors") return "Tra cứu thư viện màu";
    if (pathname === "/van-chuyen") return "Giám sát lộ trình vận chuyển";
    if (pathname === "/don-hang") return "Quản lý đơn hàng & giao dịch";
    if (pathname === "/chatbot") return "Trợ lý AI VTSC Copilot";
    if (pathname === "/quan-ly-thanh-toan") return "Sổ cái thanh toán";
    if (pathname === "/hieu-suat") return "Đo lường hiệu suất & KPI";
    if (pathname === "/khuyen-mai") return "Chính sách chiết khấu & ưu đãi";
    if (pathname === "/bao-cao") return "Báo cáo quản trị doanh nghiệp";
    if (pathname === "/thong-ke") return "Thống kê phân tích dữ liệu";
    return "Hệ thống quản lý VTSC";
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-slate-200/80 dark:border-slate-800 select-none transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3.5 no-underline group"
        >
          <div className="w-11 h-11 bg-gradient-to-tr from-slate-900 via-blue-950 to-blue-900 rounded-2xl flex items-center justify-center p-2 shadow-md shadow-blue-950/20 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/vtsc.png"
              alt="VTSC Logo"
              className="w-full h-full object-contain brightness-125"
            />
          </div>
          <div>
            <div className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
              VTSC <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">ERP</span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
              <span>PaintPro System</span>
            </div>
          </div>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Search inside menu */}
      <div className="px-4 py-3 border-b border-slate-100/60 dark:border-slate-800">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh module..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar">
        {filteredNav.map((section) => (
          <div key={section.section} className="space-y-1">
            <div className="px-3 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                {section.section}
              </span>
              <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2.5"></div>
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon || Activity;
                const isActive =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href + "/") &&
                    !section.items.some(
                      (otherItem) =>
                        otherItem.href !== item.href &&
                        pathname.startsWith(otherItem.href)
                    ));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group no-underline relative ${
                      isActive
                        ? "bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold shadow-sm shadow-blue-500/5 border border-blue-100/70 dark:border-blue-900/50"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-105"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50/60 dark:group-hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="truncate flex-1">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Network & Node Status Badge */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sepolia Web3</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            ONLINE
          </span>
        </div>
      </div>

      {/* User Card, Theme Toggle & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[12px] font-bold text-white shadow-sm shadow-blue-600/20 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {displayName}
            </div>
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {displayRole}
            </div>
          </div>
          <ThemeToggle className="scale-90" />
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute
      allowedRoles={[
        "Admin",
        "Director",
        "NhanVien",
        "KhachHangB2B",
        "KhachHangB2C",
      ]}
    >
      <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#161e2e] font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Desktop Sidebar */}
        {!isCustomer && (
          <aside className="hidden md:flex w-[275px] flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 flex-col overflow-hidden shadow-[2px_0_12px_rgba(0,0,0,0.02)] z-20">
            {renderSidebarContent()}
          </aside>
        )}

        {/* Mobile Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={`fixed top-0 bottom-0 left-0 w-[285px] z-50 transform transition-transform duration-300 md:hidden shadow-2xl ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarContent()}
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-[74px] flex-shrink-0 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Mở menu"
              >
                <Menu size={22} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Hệ thống
                  </Link>
                  <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
                  <span className="text-blue-600 dark:text-blue-400 font-bold">VTSC PaintPro</span>
                </div>
                <h1 className="text-[19px] lg:text-[21px] font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Quick Status Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Trực tuyến</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">v2.4 Pro</span>
              </div>

              {/* Theme Toggle (Sáng / Tối) */}
              <ThemeToggle showLabel={false} />

              {/* Notification Bell */}
              <div className="relative">
                <button
                  className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-colors relative"
                  title="Thông báo hệ thống"
                >
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                </button>
              </div>

              <div className="h-7 w-[1px] bg-slate-200/80 dark:bg-slate-800 hidden sm:block"></div>

              {/* User profile avatar pill */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                    {displayName}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {displayRole}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/20 border-2 border-white dark:border-slate-800">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] dark:bg-[#161e2e] transition-colors duration-300">
            <div className="max-w-[1680px] mx-auto animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
