import Link from 'next/link';
import AuthNav from '@/lib/components/AuthNav';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Navbar */}
      <nav className="store-navbar">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-100">
            V
          </div>
          <span className="font-bold text-lg text-slate-900">VTSC PaintPro</span>
        </div>

        <ul className="nav-links flex items-center">
          <li><Link href="/colors" className="active mr-4">Tra cứu Màu</Link></li>
          <li><Link href="/tracking" className="mr-4">QR Tracking</Link></li>
          <li><AuthNav /></li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 md:p-12 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03)_0%,transparent_50%)]">
        <div className="text-center max-w-3xl mx-auto">

          <div className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 tracking-wide border border-blue-100 shadow-sm">
            🎨 Đại lý phân phối cấp 1 — AkzoNobel Interpon
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-8 tracking-tight text-slate-900">
            Hệ thống Quản lý<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Sơn Tĩnh Điện VTSC
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto font-medium">
            Dashboard sản lượng & doanh thu, R&D Tracking, Smart Contract trên Blockchain
            và cổng tra cứu mã màu chuyên nghiệp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login" className="btn btn-primary btn-lg w-full sm:w-auto shadow-xl shadow-blue-200">
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
        <p className="font-medium text-slate-500">© 2024 Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC) — Hơn 25 năm đồng hành cùng AkzoNobel</p>
      </footer>
    </div>
  );
}