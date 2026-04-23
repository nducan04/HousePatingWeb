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
      // { href: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Admin', 'NhanVien'] },
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
      // { href: '/khach-hang', label: 'Quản lý khách hàng B2C', icon: User, roles: ['Admin', 'NhanVien'] },
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

  return (
    <ProtectedRoute allowedRoles={['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C']}>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-container">
            <div className="logo-icon">
              <a href="/dashboard" style={{ display: 'block', width: '100%', height: '100%' }}>
                <img src="/vtsc.png" alt="VTSC Logo" style={{ width: '200%', height: '200%', marginTop: -30, marginLeft: -5, objectFit: 'contain' }} />
              </a>
            </div>
            {/* Ẩn chữ đi vì logo ảnh đã có chữ
            <div>
              <div className="logo-text">VTSC</div>
              <div className="logo-sub">PaintPro System</div>
            </div> 
            */}
          </div>

          <nav>
            {filteredNav.filter(s => s.section !== 'Hệ thống').map((section) => (
              <div key={section.section}>
                <div
                  className="nav-section-title"
                  onClick={() => toggleSection(section.section)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  {section.section}
                  {expandedSections[section.section] ? <ChevronDown size={14} /> : <ChevronRight size={14} opacity={0.5} />}
                </div>

                <div style={{
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  maxHeight: expandedSections[section.section] ? '1000px' : '0px'
                }}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon className="nav-icon" size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Ghim cứng thư mục Hệ thống ở góc dưới cùng */}
          {filteredNav.find(s => s.section === 'Hệ thống') && (() => {
            const systemNav = filteredNav.find(s => s.section === 'Hệ thống')!;
            return (
              <div style={{ padding: '0 var(--spacing-md) var(--spacing-md) var(--spacing-md)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
                <div
                  className="nav-section-title"
                  onClick={() => toggleSection(systemNav.section)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    marginTop: 0
                  }}
                >
                  {systemNav.section}
                  {expandedSections[systemNav.section] ? <ChevronDown size={14} /> : <ChevronRight size={14} opacity={0.5} />}
                </div>

                <div style={{
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  maxHeight: expandedSections[systemNav.section] ? '1000px' : '0px'
                }}>
                  {systemNav.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon className="nav-icon" size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* User Info + Đăng xuất */}
          <div style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '13px', color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{displayRole}</div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="admin-content">
          <header className="topbar">
            <div className="page-title">
              {pathname === '/dashboard' && '📊 Dashboard'}
              {pathname?.startsWith('/san-pham') && '📦 Quản lý Sản phẩm Sơn'}
              {pathname?.startsWith('/kho') && '🏭 Quản lý Kho'}
              {pathname?.startsWith('/doi-tac') && '🤝 Quản lý Đối tác'}
              {pathname?.startsWith('/nhan-vien') && '👥 Quản lý Nhân sự'}
              {pathname?.startsWith('/rd-tracking') && '🔬 R&D Tracking'}
              {pathname?.startsWith('/contracts') && '📝 Hợp đồng B2B'}
              {pathname === '/colors' && '🎨 Tra cứu Mã Màu'}
              {pathname === '/tracking' && '📦 QR Tracking'}
              {pathname === '/don-hang' && '📋 Quản lý Đơn hàng'}
              {pathname === '/chatbot' && '🤖 AI Hỗ trợ Khách hàng'}
              {pathname === '/import' && '📤 Nhập Dữ Liệu (Excel/CSV)'}
            </div>
            <div className="topbar-actions">
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                <Bell size={18} />
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                  borderRadius: '50%', background: 'var(--accent-rose)'
                }} />
              </button>
              <div className="badge active" style={{ textTransform: 'none' }}>
                {userRole === 'Admin' ? 'Admin' : userRole === 'KhachHangB2B' ? 'B2B' : 'PKDS'}
              </div>
            </div>
          </header>
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
