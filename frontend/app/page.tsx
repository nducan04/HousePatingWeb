import Link from 'next/link';
import AuthNav from '@/lib/components/AuthNav';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_20%_50%,rgba(0,212,255,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.06)_0%,transparent_50%)]">
      
      {/* Navbar */}
      <nav className="store-navbar">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-black text-sm text-white">
            V
          </div>
          <span className="font-bold text-lg">VTSC PaintPro</span>
        </div>
        
        <ul className="nav-links flex items-center">
          <li><Link href="/colors" className="active mr-4">Tra cứu Màu</Link></li>
          <li><Link href="/tracking" className="mr-4">QR Tracking</Link></li>
          <AuthNav />
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="text-center max-w-3xl mx-auto">
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-6 tracking-wide">
            🎨 Đại lý phân phối cấp 1 — AkzoNobel Interpon
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
            Hệ thống Quản lý<br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Sơn Tĩnh Điện
            </span> VTSC
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            Dashboard sản lượng & doanh thu, R&D Tracking, Smart Contract trên Blockchain 
            và cổng tra cứu mã màu cho khách hàng B2C.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn btn-primary btn-lg w-full sm:w-auto">
              Truy cập Hệ thống →
            </Link>
            <Link href="/colors" className="btn btn-secondary btn-lg w-full sm:w-auto">
              Tra cứu Mã Màu
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="store-footer">
        <p>© 2024 Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC) — Hơn 25 năm đồng hành cùng AkzoNobel</p>
      </footer>
    </div>
  );
}