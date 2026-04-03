'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import api from '@/lib/utils/axiosAuth';
import { 
  BarChart3, FlaskConical, FileSignature, Palette, 
  QrCode, Settings, Bell, User, ChevronRight, Package, MessageSquare, FileUp,
  LogOut, Loader2
} from 'lucide-react';

/**
 * Ma trận phân quyền Sidebar theo BRD:
 * ───────────────────────────────────────
 * Admin:        Toàn bộ menu
 * NhanVien:     Dashboard, R&D, Hợp đồng, Nhập dữ liệu, Tra cứu, QR, AI
 * KhachHangB2B: Hợp đồng B2B, Tra cứu Mã Màu, AI Hỗ trợ
 * KhachHangB2C: Tra cứu Mã Màu, QR Tracking, AI Hỗ trợ
 */
const allNavItems = [
  { section: 'Quản lý', items: [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Admin', 'NhanVien'] },
    { href: '/rd-tracking', label: 'R&D Tracking', icon: FlaskConical, roles: ['Admin', 'NhanVien'] },
    { href: '/contracts', label: 'Hợp đồng B2B', icon: FileSignature, roles: ['Admin', 'NhanVien', 'KhachHangB2B'] },
    { href: '/import', label: 'Nhập Dữ Liệu', icon: FileUp, roles: ['Admin', 'NhanVien'] },
  ]},
  { section: 'Danh mục', items: [
    { href: '/san-pham', label: 'Sản phẩm Sơn', icon: Package, roles: ['Admin', 'NhanVien'] },
    { href: '/doi-tac', label: 'Đối tác', icon: User, roles: ['Admin', 'NhanVien'] },
    { href: '/nhan-vien', label: 'Nhân viên', icon: User, roles: ['Admin'] },
  ]},
  { section: 'B2C Portal', items: [
    { href: '/colors', label: 'Tra cứu Mã Màu', icon: Palette, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'] },
    { href: '/tracking', label: 'QR Tracking', icon: QrCode, roles: ['Admin', 'NhanVien', 'KhachHangB2C'] },
    { href: '/chatbot', label: 'AI Hỗ trợ', icon: MessageSquare, roles: ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C'] },
  ]},
  { section: 'Hệ thống', items: [
    { href: '#settings', label: 'Cài đặt', icon: Settings, roles: ['Admin'] },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logoutState } = useAuthStore();

  const userRole = user?.role || 'NhanVien';

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
            <div className="logo-icon">V</div>
            <div>
              <div className="logo-text">VTSC</div>
              <div className="logo-sub">PaintPro System</div>
            </div>
          </div>

          <nav>
            {filteredNav.map((section) => (
              <div key={section.section}>
                <div className="nav-section-title">{section.section}</div>
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
                      {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User Info + Đăng xuất */}
          <div style={{ 
            padding: 'var(--spacing-md)', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 'var(--radius-full)', 
              background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 'var(--font-sm)', color: '#fff',
              flexShrink: 0,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{displayRole}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ padding: 4, flexShrink: 0 }} title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="admin-content">
          <header className="topbar">
            <div className="page-title">
              {pathname === '/dashboard' && '📊 Dashboard'}
              {pathname?.startsWith('/san-pham') && '📦 Quản lý Sản phẩm Sơn'}
              {pathname?.startsWith('/doi-tac') && '🤝 Quản lý Đối tác'}
              {pathname?.startsWith('/nhan-vien') && '👥 Quản lý Nhân sự'}
              {pathname?.startsWith('/rd-tracking') && '🔬 R&D Tracking'}
              {pathname?.startsWith('/contracts') && '📝 Hợp đồng B2B'}
              {pathname === '/colors' && '🎨 Tra cứu Mã Màu'}
              {pathname === '/tracking' && '📦 QR Tracking'}
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
