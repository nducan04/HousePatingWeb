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
        label: "Dashboard",
        roles: ["Admin", "Director"],
      },
      {
        href: "/quan-ly-san-pham",
        label: "Dashboard nghiệp vụ",
        roles: ["NhanVien"],
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
      },
      {
        href: "/phanquyen",
        label: "Quản lý phân quyền",
        roles: ["Admin"],
      },
    ],
  },
  {
    section: "Quản lý danh mục",
    items: [
      {
        href: "/quan-ly-san-pham",
        label: "Sản phẩm sơn",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/gia-thanh",
        label: "Quản lý giá thành",
        roles: ["Admin"],
      },
      {
        href: "/kho",
        label: "Quản lý kho",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/nhan-vien",
        label: "Quản lý nhân viên",
        roles: ["Admin"],
      },
      {
        href: "/doi-tac",
        label: "Quản lý khách hàng",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/nha-cung-cap",
        label: "Quản lý nhà cung cấp",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/colors",
        label: "Tra cứu mã màu",
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
      },
      {
        href: "/nhap-du-lieu",
        label: "Nhập dữ liệu",
        roles: ["Admin", "NhanVien"],
      },
    ],
  },
  {
    section: "Quản lý kinh doanh sơn",
    items: [
      {
        href: "/tin-tuc",
        label: "Quảng bá sản phẩm",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/don-hang",
        label: "Quản lý đơn hàng",
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
      },
      {
        href: "/quan-ly-thanh-toan",
        label: "Quản lý thanh toán",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/van-chuyen",
        label: "Theo dõi vận chuyển",
        roles: ["Admin", "NhanVien", "KhachHangB2C", "KhachHangB2B"],
      },
      {
        href: "/hieu-suat",
        label: "Theo dõi hiệu suất",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/doi-tra",
        label: "Trung Tâm Giải Quyết Khiếu Nại",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/khuyen-mai",
        label: "Quản lý khuyến mãi",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/chatbot",
        label: "AI hỗ trợ khách hàng",
        roles: ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C"],
      },
    ],
  },
  {
    section: "Quy trình pha chế sơn",
    items: [
      {
        href: "/hop-dong-pha-che",
        label: "Hợp đồng pha chế",
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
      },
      {
        href: "/rd-tracking",
        label: "R&D Tracking",
        roles: ["Admin", "NhanVien"],
      },
      {
        href: "/rd-tracking/new",
        label: "Yêu cầu mẫu thử",
        roles: ["KhachHangB2B", "KhachHangB2C"],
      },
      {
        href: "/thanh-toan-hd",
        label: "Thanh toán và công nợ HĐ",
        roles: ["Admin", "NhanVien", "KhachHangB2B"],
      },
    ],
  },
  {
    section: "BÁO CÁO & THỐNG KÊ",
    items: [
      {
        href: "/bao-cao",
        label: "Báo cáo",
        roles: ["Admin", "Director"],
      },
      {
        href: "/thong-ke",
        label: "Thống kê",
        roles: ["Admin", "Director"],
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
        router.push("/san-pham");
        return;
      }
      if (isCustomer) {
        router.push("/");
        return;
      }
      return;
    }

    // Ngoại lệ: Khách hàng được phép truy cập trang chi tiết R&D (layout không block, để cho page tự xử lý API backend)
    if (
      isCustomer &&
      pathname.startsWith("/rd-tracking/") &&
      pathname !== "/rd-tracking/new"
    ) {
      return;
    }

    // Tìm tất cả items khớp với pathname hiện tại
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
      // Lọc các items khớp có độ dài href lớn nhất
      const maxLength = Math.max(...matchedItems.map((item) => item.href.length));
      const bestMatches = matchedItems.filter((item) => item.href.length === maxLength);

      // Cho phép truy cập nếu có bất kỳ item nào chứa vai trò của user
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
    if (pathname?.startsWith("/quan-ly-san-pham"))
      return "📦 Quản lý Sản phẩm Sơn";
    if (pathname?.startsWith("/kho")) return "🏭 Quản lý Kho";
    if (pathname?.startsWith("/doi-tra"))
      return "🎯 Trung Tâm Giải Quyết Khiếu Nại";
    if (pathname?.startsWith("/doi-tac")) return "🤝 Quản lý Khách Hàng";
    if (pathname?.startsWith("/nhan-vien")) return "👥 Quản lý Nhân sự";
    if (pathname?.startsWith("/rd-tracking")) return "🔬 R&D Tracking";
    if (pathname?.startsWith("/hop-dong-pha-che")) return "📝 Hợp đồng B2B";
    if (pathname === "/colors") return "🎨 Tra cứu Mã Màu";
    if (pathname === "/van-chuyen") return "📦 Theo dõi vận chuyển";
    if (pathname === "/don-hang") return "📋 Quản lý Đơn hàng";
    if (pathname === "/chatbot") return "🤖 AI Hỗ trợ Khách hàng";
    if (pathname === "/quan-ly-thanh-toan") return "💳 Quản lý thanh toán";
    if (pathname === "/hieu-suat") return "📈 Theo dõi hiệu suất";
    if (pathname === "/khuyen-mai") return "🏷️ Quản lý khuyến mãi";
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
            <div className="px-8 py-7">
              <Link
                href="/"
                className="flex items-center gap-4 no-underline group"
              >
                <div className="w-12 h-12 bg-[#1A1A40] rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-blue-900/10 transition-transform group-hover:scale-105">
                  <img
                    src="/vtsc.png"
                    alt="Logo"
                    className="w-full h-full object-contain brightness-110"
                  />
                </div>
                <div>
                  <div className="text-[17px] font-black text-[#1A1A40] tracking-tight leading-none">
                    VTSC
                  </div>
                  <div className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mt-1">
                    PaintPro
                  </div>
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
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 group no-underline ${
                              isActive
                                ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {Icon && (
                              <div
                                className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                              >
                                <Icon
                                  size={20}
                                  strokeWidth={isActive ? 2.5 : 2}
                                />
                              </div>
                            )}
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
