import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)'
    }}>
      {/* Hero */}
      <nav className="store-navbar">
        <div className="flex items-center gap-md">
          <div style={{ 
            width: 36, height: 36, borderRadius: 'var(--radius-md)', 
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.875rem', color: '#fff'
          }}>V</div>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>VTSC PaintPro</span>
        </div>
        <ul className="nav-links">
          <li><Link href="/colors" className="active">Tra cứu Màu</Link></li>
          <li><Link href="/tracking">QR Tracking</Link></li>
          <li><Link href="/dashboard">Dashboard</Link></li>
        </ul>
      </nav>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
        <div style={{ textAlign: 'center', maxWidth: 700 }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '6px 16px', 
            borderRadius: 'var(--radius-full)', 
            background: 'var(--accent-cyan-soft)', 
            color: 'var(--accent-cyan)', 
            fontSize: 'var(--font-xs)', 
            fontWeight: 600, 
            marginBottom: 'var(--spacing-lg)',
            letterSpacing: '0.04em'
          }}>
            🎨 Đại lý phân phối cấp 1 — AkzoNobel Interpon
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: 900, 
            lineHeight: 1.1, 
            marginBottom: 'var(--spacing-lg)',
            letterSpacing: '-0.03em'
          }}>
            Hệ thống Quản lý<br />
            <span style={{ 
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Sơn Tĩnh Điện</span> VTSC
          </h1>
          <p style={{ 
            fontSize: 'var(--font-lg)', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.7, 
            marginBottom: 'var(--spacing-xl)' 
          }}>
            Dashboard sản lượng & doanh thu, R&D Tracking, Smart Contract trên Blockchain 
            và cổng tra cứu mã màu cho khách hàng B2C.
          </p>
          <div className="flex items-center gap-md" style={{ justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Vào Dashboard →
            </Link>
            <Link href="/colors" className="btn btn-secondary btn-lg">
              Tra cứu Mã Màu
            </Link>
          </div>
        </div>
      </main>

      <footer className="store-footer">
        <p>© 2024 Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC) — Hơn 25 năm đồng hành cùng AkzoNobel</p>
      </footer>
    </div>
  );
}
