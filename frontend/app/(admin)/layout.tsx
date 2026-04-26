'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import api from '@/lib/utils/axiosAuth';
import {
  BarChart3, FlaskConical, FileSignature, Palette,
  QrCode, Settings, Clock, Bell, User, ChevronRight, ChevronDown, Package, MessageSquare, FileUp, CloudSync, QrCodeIcon,
  LogOut, Loader2, ClipboardList, PackageOpen, DollarSign, ShoppingCart, ListOrdered, PanelsRightBottomIcon, SignalHighIcon, TrainFrontIcon,
  Users, Shield,
  ReceiptRussianRubleIcon
} from 'lucide-react';

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
    section: 'Quản lý hệ thống', items: [
      { href: '/taikhoan', label: 'Quản lý tài khoản', icon: User, roles: ['Admin'] },
      { href: '/thongtin', label: 'Thông tin cá nhân', icon: Users, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'NhaCungCap'] },
      { href: '/phanquyen', label: 'Quản lý phân quyền', icon: Users, roles: ['Admin'] },
      { href: '#settings', label: 'Cài đặt', icon: Settings, roles: ['Admin'] },
      { href: '#data-period', label: 'Đồng bộ hệ thống', icon: CloudSync, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'NhaCungCap'] },
    ]
  },
  {
    section: 'Quản lý danh mục', items: [
      { href: '/san-pham', label: 'Sản phẩm Sơn', icon: Package, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'] },
      { href: '/colors', label: 'Tra cứu Mã Màu', icon: Palette, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'] },
      { href: '/gia-thanh', label: 'Quản lý giá thành', icon: DollarSign, roles: ['Admin'] },
      { href: '/kho', label: 'Quản lý kho', icon: ClipboardList, roles: ['Admin', 'NhanVien'] },
      { href: '/nhan-vien', label: 'Quản lý nhân viên', icon: User, roles: ['Admin'] },
      { href: '/doi-tac', label: 'Quản lý khách hàng', icon: User, roles: ['Admin', 'NhanVien'] },
      { href: '/nha-cung-cap', label: 'Quản lý nhà cung cấp', icon: User, roles: ['Admin', 'NhanVien'] },
      { href: '/import', label: 'Nhập Dữ Liệu', icon: FileUp, roles: ['Admin', 'NhanVien'] },
    ]
  },
  {
    section: 'Quản lý kinh doanh sơn', items: [
      { href: '/tin-tuc', label: 'Quảng bá sản phẩm', icon: Package, roles: ['Admin', 'NhanVien'] },
      { href: '/don-hang', label: 'Quản lý đơn hàng', icon: ListOrdered, roles: ['Admin', 'NhanVien', 'KhachHangB2C', 'KhachHangB2B'] },
      { href: '/giohang', label: 'Quản lý giỏ hàng', icon: ShoppingCart, roles: ['Admin', 'NhanVien', 'KhachHangB2C', 'KhachHangB2B'] },
      { href: '/thanh-toan', label: 'Quản lý thanh toán', icon: QrCodeIcon, roles: ['Admin', 'NhanVien', 'KhachHangB2C', 'KhachHangB2B'] },
      { href: '/van-chuyen', label: 'Theo dõi vận chuyển', icon: TrainFrontIcon, roles: ['Admin', 'NhanVien', 'KhachHangB2C', 'KhachHangB2B'] },
      { href: '/hieu-suat', label: 'Theo dõi hiệu suất', icon: SignalHighIcon, roles: ['Admin', 'NhanVien'] },
      { href: '/doi-tra', label: 'Quản lý đổi trả', icon: ReceiptRussianRubleIcon, roles: ['Admin', 'NhanVien'] },
      { href: '/bao-hanh', label: 'Bảo hành & Hậu mãi', icon: Shield, roles: ['Admin', 'NhanVien'] },
      { href: '/khuyen-mai', label: 'Quản lý khuyến mãi', icon: PanelsRightBottomIcon, roles: ['Admin', 'NhanVien'] },
      { href: '/chatbot', label: 'AI Hỗ trợ khách hàng', icon: MessageSquare, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'] },
    ]
  },
  {
    section: 'Quy trình pha chế sơn', items: [
      { href: '/contracts', label: 'Hợp đồng pha chế', icon: FileSignature, roles: ['Admin', 'NhanVien', 'KhachHangB2B'] },
      { href: '/rd-tracking', label: 'R&D Tracking', icon: FlaskConical, roles: ['Admin', 'NhanVien'] },
      { href: '/quy-trinh', label: 'Quản lý quy trình gói đơn hàng', icon: QrCodeIcon, roles: ['Admin', 'NhanVien', 'KhachHangB2C', 'KhachHangB2B'] },
      { href: '/thanh-toan-hd', label: 'Thanh toán & Công nợ HĐ', icon: DollarSign, roles: ['Admin', 'NhanVien', 'KhachHangB2B'] },
    ]
  },
  {
    section: 'BÁO CÁO & THỐNG KÊ', items: [
      { href: '/bao-cao', label: 'Báo cáo', icon: FileSignature, roles: ['Admin', 'NhanVien', 'KhachHangB2B'] },
      { href: '/thong-ke', label: 'Thống kê', icon: FlaskConical, roles: ['Admin', 'NhanVien'] },
    ]
  },
  {
    section: 'Hệ thống', items: [

    ]
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logoutState } = useAuthStore();

  const userRole = user?.role || 'NhanVien';

  // Khởi tạo state để mở tab có chứa trang hiện tại
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    allNavItems.forEach(section => {
      if (typeof window !== 'undefined') {
        const hasActive = section.items.some(item => window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '/'));
        if (hasActive) initialState[section.section] = true;
      }
    });
    return initialState;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Lọc menu theo vai trò người dùng
  const filteredNav = allNavItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(userRole)),
    }))
    .filter(section => section.items.length > 0);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Bỏ qua lỗi — xóa state là đủ
    }
    logoutState();
    router.push('/login');
  };

  // Lấy thông tin hiển thị từ profile
  const displayName = user?.profile?.HoTen || user?.profile?.TenKhachHang || user?.username || 'Người dùng';
  const displayRole = user?.profile?.ChucVu ||
    (userRole === 'Admin' ? 'Quản trị viên' :
      userRole === 'NhanVien' ? 'Nhân viên' :
        userRole === 'KhachHangB2B' ? 'Đối tác B2B' : 'Khách hàng');
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(-3).toUpperCase();

  // Map pathname to page title
  const getPageTitle = () => {
    if (pathname === '/dashboard') return '📊 Dashboard';
    if (pathname?.startsWith('/san-pham')) return '📦 Quản lý Sản phẩm Sơn';
    if (pathname?.startsWith('/kho')) return '🏭 Quản lý Kho';
    if (pathname?.startsWith('/doi-tac')) return '🤝 Quản lý Đối tác';
    if (pathname?.startsWith('/nhan-vien')) return '👥 Quản lý Nhân sự';
    if (pathname?.startsWith('/rd-tracking')) return '🔬 R&D Tracking';
    if (pathname?.startsWith('/contracts')) return '📝 Hợp đồng B2B';
    if (pathname === '/colors') return '🎨 Tra cứu Mã Màu';
    if (pathname === '/tracking') return '📦 QR Tracking';
    if (pathname === '/don-hang') return '📋 Quản lý Đơn hàng';
    if (pathname === '/chatbot') return '🤖 AI Hỗ trợ Khách hàng';
    if (pathname === '/import') return '📤 Nhập Dữ Liệu (Excel/CSV)';
    return '📊 Tổng quan';
  };

  return (
    <ProtectedRoute allowedRoles={['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C']}>
      <div className="flex h-screen bg-slate-50 font-[Inter,sans-serif]">
        {/* ═══════ Sidebar ═══════ */}
        <aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <a href="/dashboard" className="block w-10 h-10 flex-shrink-0">
              <img src="/vtsc.png" alt="VTSC Logo" className="w-full h-full object-contain" />
            </a>
            <div>
              <div className="text-sm font-bold text-slate-800 tracking-tight">VTSC</div>
              <div className="text-[10px] text-slate-400 font-medium">PaintPro System</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {filteredNav.filter(s => s.section !== 'Hệ thống').map((section) => (
              <div key={section.section}>
                {/* Section Title */}
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-3 py-2 mt-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors select-none cursor-pointer"
                >
                  {section.section}
                  {expandedSections[section.section]
                    ? <ChevronDown size={12} />
                    : <ChevronRight size={12} className="opacity-50" />}
                </button>

                {/* Nav Items */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: expandedSections[section.section] ? '1000px' : '0px' }}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline mb-0.5 ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' }`}
                      >
                        <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Info + Logout at bottom */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md shadow-blue-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{displayName}</div>
              <div className="text-xs text-slate-400">{displayRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ═══════ Main Content ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h1 className="text-lg font-bold text-slate-800">{getPageTitle()}</h1>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              </button>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {userRole === 'Admin' ? 'Admin' : userRole === 'KhachHangB2B' ? 'B2B' : 'PKDS'}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
