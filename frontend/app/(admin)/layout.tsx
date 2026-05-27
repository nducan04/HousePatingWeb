"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import ProtectedRoute from "@/lib/components/ProtectedRoute";
import api from "@/lib/utils/axiosAuth";
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
} from "lucide-react";

/**
 * Ma trận phân quyền Sidebar theo BRD:
 * ───────────────────────────────────────
 * Admin:        Tài khoản, Toàn bộ menu
 * NhanVien:     Tài khoản, Dashboard, R&D, Hợp đồng, Nhập dữ liệu, Tra cứu, QR, AI
 * KhachHangB2B: Tài khoản, Hợp đồng B2B, Tra cứu Mã Màu, AI Hỗ trợ, Tra cứu
 * KhachHangB2C: Tài khoản, Tra cứu Mã Màu, QR Tracking, AI Hỗ trợ,
 */
const allNavItems = [
  {
    section: "Quản lý hệ thống",
    items: [
      {
        href: "/accounts",
        label: "Quản lý tài khoản",
        icon: User,
        roles: ["Admin"],
      },
      {
        href: "/profile",
        label: "Thông tin cá nhân",
        icon: Users,
        roles: [
          "Admin",
          "NhanVien",
          "KhachHangB2B",
          "KhachHangB2C",
          "NhaCungCap",
        ],
      },
      {
        href: "/roles",
        label: "Quản lý phân quyền",
        icon: Users,
        roles: ["Admin"],
      },
    ],
  },
  {
    section: "Quản lý danh mục",
    items: [
      {
        href: "/products",
        label: "Sản phẩm sơn",
        icon: Package,
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
      },
      {
        href: "/cost-analysis",
        label: "Quản lý giá thành",
        icon: DollarSign,
        roles: ["Admin"],
      },
      {
        href: "/inventory",
        label: "Quản lý kho",
        icon: ClipboardList,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/staff",
        label: "Quản lý nhân viên",
        icon: User,
        roles: ["Admin"],
      },
      {
        href: "/partners",
        label: "Quản lý khách hàng",
        icon: User,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/suppliers",
        label: "Quản lý nhà cung cấp",
        icon: User,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/colors",
        label: "Tra cứu mã màu",
        icon: Palette,
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
      },
      {
        href: "/import",
        label: "Nhập dữ liệu",
        icon: FileUp,
        roles: ["Admin", "NhanVien"],
      },
    ],
  },
  {
    section: "Quản lý kinh doanh sơn",
    items: [
      {
        href: "/news",
        label: "Quảng bá sản phẩm",
        icon: Package,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/orders",
        label: "Quản lý đơn hàng",
        icon: ListOrdered,
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
      },
      {
        href: "/payments",
        label: "Quản lý thanh toán",
        icon: QrCode,
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
      },
      {
        href: "/shipping",
        label: "Theo dõi vận chuyển",
        icon: TrainFront,
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
      },
      {
        href: "/performance",
        label: "Theo dõi hiệu suất",
        icon: SignalHigh,
        roles: ["Admin", "Director"],
      },
      {
        href: "/promotions",
        label: "Quản lý khuyến mãi",
        icon: PanelsRightBottom,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/chatbot",
        label: "AI hỗ trợ khách hàng",
        icon: MessageSquare,
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
      },
    ],
  },
  {
    section: "Quy trình pha chế sơn",
    items: [
      {
        href: "/contracts",
        label: "Hợp đồng pha chế",
        icon: FileSignature,
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
      },
      {
        href: "/rd-tracking",
        label: "R&D Tracking",
        icon: FlaskConical,
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/rd-tracking/new",
        label: "Yêu cầu mẫu thử",
        icon: Droplets,
        roles: ["KhachHangB2B", "KhachHangB2C"],
      },
      {
        href: "/contract-payments",
        label: "Thanh toán và công nợ HĐ",
        icon: DollarSign,
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
      },
    ],
  },
  {
    section: "BÁO CÁO & THỐNG KÊ",
    items: [
      {
        href: "/reports",
        label: "Báo cáo",
        icon: FileSignature,
        roles: ["Admin", "Director"],
      },
      {
        href: "/statistics",
        label: "Thống kê",
        icon: FlaskConical,
        roles: ["Admin", "Director"],
      },
    ],
  },
  {
    section: "Hệ thống",
    items: [],
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

  const userRole = user?.role || "NhanVien";
  const isCustomer = userRole === "KhachHangB2B" || userRole === "KhachHangB2C";

  // Khởi tạo state để mở tab có chứa trang hiện tại
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    allNavItems.forEach((section) => {
      if (typeof window !== "undefined") {
        const hasActive = section.items.some(
          (item) =>
            window.location.pathname === item.href ||
            window.location.pathname.startsWith(item.href + "/"),
        );
        if (hasActive) initialState[section.section] = true;
      }
    });
    return initialState;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Chặn truy cập trái phép ở cấp giao diện dựa trên allNavItems và dashboard
  React.useEffect(() => {
    if (isLoading || !user) return;

    // Phân quyền cho trang Dashboard
    if (pathname === "/dashboard") {
      if (userRole === "NhanVien") {
        router.push("/products");
        return;
      }
      if (isCustomer) {
        router.push("/");
        return;
      }
      return;
    }

    // Tìm item khớp với pathname hiện tại (chọn item có href dài nhất để xử lý chính xác các trang con như /rd-tracking/new)
    let matchedItem: any = null;
    allNavItems.forEach((section) => {
      section.items.forEach((item) => {
        if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
          if (!matchedItem || item.href.length > matchedItem.href.length) {
            matchedItem = item;
          }
        }
      });
    });

    if (matchedItem) {
      if (!matchedItem.roles.includes(userRole)) {
        if (isCustomer) {
          router.push("/");
        } else {
          router.push("/unauthorized");
        }
      }
    }
  }, [pathname, user, userRole, isLoading, router, isCustomer]);

  // Lọc menu theo vai trò người dùng
  const filteredNav = allNavItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((section) => section.items.length > 0);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Bỏ qua lỗi — xóa state là đủ
    }
    logoutState();
    router.push("/login");
  };

  // Lấy thông tin hiển thị từ profile
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
          ? "Nhân viên công ty"
          : user?.profile?.ChucVu ||
          (userRole === "KhachHangB2B" ? "Đối tác B2B" : "Khách hàng");
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(-3)
    .toUpperCase();

  // Map pathname to page title
  const getPageTitle = () => {
    if (pathname === "/dashboard") {
      return userRole === "NhanVien" ? "📦 Quản lý nghiệp vụ" : "📊 Dashboard";
    }
    if (pathname?.startsWith("/products")) return "📦 Quản lý Sản phẩm Sơn";
    if (pathname?.startsWith("/inventory")) return "🏭 Quản lý Kho";
    if (pathname?.startsWith("/doi-tra"))
      return "🎯 Trung Tâm Giải Quyết Khiếu Nại";
    if (pathname?.startsWith("/partners")) return "🤝 Quản lý Khách Hàng";
    if (pathname?.startsWith("/staff")) return "👥 Quản lý Nhân sự";
    if (pathname?.startsWith("/rd-tracking")) return "🔬 R&D Tracking";
    if (pathname?.startsWith("/contracts")) return "📝 Hợp đồng B2B";
    if (pathname === "/colors") return "🎨 Tra cứu Mã Màu";
    if (pathname === "/tracking") return "📦 QR Tracking";
    if (pathname === "/orders") return "📋 Quản lý Đơn hàng";
    if (pathname === "/chatbot") return "🤖 AI Hỗ trợ Khách hàng";
    if (pathname === "/import") return "📤 Nhập Dữ Liệu (Excel/CSV)";
    return "Quản lý nghiệp vụ";
  };

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
      <div className="flex h-screen bg-[#F8FAFC] font-sans">
        {/* ═══════ Sidebar ═══════ */}
        {!isCustomer && (
          <aside className="w-[280px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Logo Area */}
            <div className="px-8 py-7 flex items-center justify-center">
              <Link href="/" className="block no-underline group">
                <div className="w-[180px] h-[60px] rounded-[16px] bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transition-transform group-hover:scale-105 px-3">
                  <img src="/images/vosco-logo.png" alt="VTSC Logo" className="w-full h-full object-contain" />
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
              {filteredNav
                .filter((s) => s.section !== "Hệ thống")
                .map((section) => (
                  <div key={section.section} className="space-y-1.5">
                    {/* Section Title */}
                    <div className="px-4 mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                        {section.section}
                      </span>
                      <div className="h-[1px] flex-1 bg-slate-50 ml-3 opacity-50"></div>
                    </div>

                    {/* Nav Items */}
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          pathname === item.href ||
                          pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 group no-underline ${isActive
                              ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                          >
                            <div
                              className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                            >
                              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="truncate">{item.label}</span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-50 mt-auto bg-slate-50/30">
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-[12px] font-bold text-white shadow-md">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Tài Khoản
                  </div>
                  <div className="text-[14px] font-black text-slate-800 truncate">
                    {displayName}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ═══════ Main Content ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-[88px] flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl text-[13px] font-bold transition-all no-underline shadow-sm border border-slate-200 cursor-pointer mr-2"
              >
                <Home size={16} />
                Về Trang Chủ
              </Link>
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                {(() => {
                  const currentItem = allNavItems
                    .flatMap((s) => s.items)
                    .find(
                      (i) =>
                        pathname === i.href ||
                        (i.href !== "/" && pathname?.startsWith(i.href + "/")),
                    );
                  const Icon = currentItem?.icon || BarChart3;
                  return <Icon size={24} strokeWidth={2.5} />;
                })()}
              </div>
              <div>
                <h1 className="text-[22px] font-black text-slate-900 tracking-tight">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-10 w-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] leading-none mb-1 opacity-70">
                    Tài Khoản
                  </div>
                  <div className="text-[15px] font-black text-slate-900 leading-tight">
                    {displayName}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl border-2 border-white shadow-md shadow-slate-200 overflow-hidden bg-slate-100">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                    {initials}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
