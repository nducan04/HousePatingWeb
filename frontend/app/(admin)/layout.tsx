'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, FlaskConical, FileSignature, Palette, 
  QrCode, Settings, Bell, User, ChevronRight, Package, MessageSquare, FileUp
} from 'lucide-react';

const navItems = [
  { section: 'Quản lý', items: [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/rd-tracking', label: 'R&D Tracking', icon: FlaskConical },
    { href: '/contracts', label: 'Hợp đồng B2B', icon: FileSignature },
    { href: '/import', label: 'Nhập Dữ Liệu', icon: FileUp },
  ]},
  { section: 'B2C Portal', items: [
    { href: '/colors', label: 'Tra cứu Mã Màu', icon: Palette },
    { href: '/tracking', label: 'QR Tracking', icon: QrCode },
    { href: '/chatbot', label: 'AI Hỗ trợ', icon: MessageSquare },
  ]},
  { section: 'Hệ thống', items: [
    { href: '#', label: 'Cài đặt', icon: Settings },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
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
          {navItems.map((section) => (
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

        <div style={{ 
          padding: 'var(--spacing-md)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 'var(--radius-full)', 
            background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 'var(--font-sm)', color: '#fff'
          }}>PBM</div>
          <div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Phí Bình Minh</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Trưởng phòng KD</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-content">
        <header className="topbar">
          <div className="page-title">
            {pathname === '/dashboard' && '📊 Dashboard'}
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
            <div className="badge active" style={{ textTransform: 'none' }}>PKDS</div>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
