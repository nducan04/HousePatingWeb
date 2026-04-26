import Link from "next/link";
import AuthNav from "@/lib/components/AuthNav";
import {
  Search,
  QrCode,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden font-[Inter,sans-serif]">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] blur-[40px]" />
        <div className="absolute -bottom-24 -left-16 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] blur-[40px]" />
      </div>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="sticky top-0 z-50 bg-white/88 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-8 py-3.5 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline text-inherit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-base text-white shadow-lg shadow-blue-600/30 flex-shrink-0">
              V
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              VTSC PaintPro
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-7">
            <Link href="/colors" className="text-sm font-semibold text-slate-500 no-underline hover:text-blue-600 transition-colors">
              Tra cứu Màu
            </Link>
            <Link href="/tracking" className="text-sm font-semibold text-slate-500 no-underline hover:text-blue-600 transition-colors">
              QR Tracking
            </Link>
            <div className="border-l border-slate-200 pl-5">
              <AuthNav />
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-20 lg:py-24 relative z-[1]">
        <div className="text-center max-w-[800px] mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/90 border border-blue-200 mb-8">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-[13px] font-semibold text-blue-700">
              Đại lý phân phối cấp 1 — AkzoNobel Interpon
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight text-slate-900 mb-6">
            Hệ thống Quản lý
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Sơn Tĩnh Điện VTSC
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-[580px] mx-auto mb-10">
            Nền tảng giao thương B2B tích hợp Hợp đồng thông minh Smart Contract
            và Cổng tra cứu B2C dành cho khách hàng toàn quốc.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base no-underline shadow-lg shadow-blue-600/35 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Truy cập Quản trị
              <ArrowRight className="w-[18px] h-[18px]" />
            </Link>
            <Link
              href="/colors"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-600 border-[1.5px] border-slate-300 rounded-2xl font-bold text-base no-underline shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              Tra cứu Mã Màu
              <Search className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </main>

      {/* ═══════ SERVICES ═══════ */}
      <section className="px-8 py-20 bg-white/85 backdrop-blur-sm border-t border-slate-100 relative z-[1]">
        <div className="max-w-[1200px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Tiện ích dành cho Khách hàng
            </h2>
            <p className="text-base text-slate-500 max-w-[520px] mx-auto leading-relaxed">
              Trải nghiệm dịch vụ số hóa hoàn toàn tự động, minh bạch và an toàn — không cần đăng ký tài khoản.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard
              icon={<Search size={28} strokeWidth={1.5} />}
              iconBg="bg-blue-50" iconColor="text-blue-600"
              title="Tra cứu Bộ Màu"
              desc="Hàng ngàn mã màu tĩnh điện AkzoNobel chuẩn xác với mã Hex và hình ảnh thực tế."
              ctaText="Trải nghiệm ngay" ctaColor="text-blue-600"
              href="/colors"
            />
            <ServiceCard
              icon={<QrCode size={28} strokeWidth={1.5} />}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
              title="QR Tracking"
              desc="Quét mã QR trên thùng sơn để kiểm tra hàng chính hãng và lộ trình giao hàng trực tuyến."
              ctaText="Bắt đầu tra cứu" ctaColor="text-emerald-600"
              href="/tracking"
            />
            <ServiceCard
              icon={<MessageSquare size={28} strokeWidth={1.5} />}
              iconBg="bg-purple-50" iconColor="text-purple-600"
              title="Trợ lý ảo AI"
              desc="Giải đáp thắc mắc kỹ thuật pha chế, khiếu nại và tư vấn mua hàng hoạt động 24/7."
              ctaText="Trò chuyện ngay" ctaColor="text-purple-600"
              href="#"
            />
            <ServiceCard
              icon={<ShieldCheck size={28} strokeWidth={1.5} />}
              iconBg="bg-amber-50" iconColor="text-amber-600"
              title="Hợp đồng Web3"
              desc="Ký kết hợp đồng B2B hoàn toàn trực tuyến và lưu trữ vĩnh viễn trên Blockchain."
              ctaText="Tìm hiểu thêm" ctaColor="text-amber-600"
              href="#"
            />
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="px-8 py-7 border-t border-slate-200 bg-white relative z-[1]">
        <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-3 text-sm text-slate-400">
          <p className="font-medium">
            © 2026 Hệ thống VTSC PaintPro. Đồ án tốt nghiệp - Nhóm 41.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-slate-400 no-underline hover:text-slate-600 transition-colors text-sm">Điều khoản</Link>
            <Link href="#" className="text-slate-400 no-underline hover:text-slate-600 transition-colors text-sm">Bảo mật</Link>
            <Link href="#" className="text-slate-400 no-underline hover:text-slate-600 transition-colors text-sm">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Service Card Component ── */
function ServiceCard({
  icon, iconBg, iconColor, title, desc, ctaText, ctaColor, href,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; desc: string; ctaText: string; ctaColor: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col bg-white p-7 rounded-2xl border border-slate-200 no-underline text-inherit transition-all duration-300 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300 flex flex-col bg-white p-7 rounded-2xl border border-slate-200 no-underline text-inherit transition-all duration-300 relative overflow-hidden group"
    >
      {/* Icon */}
      <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center mb-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-[17px] font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{desc}</p>
      <span className={`inline-flex items-center gap-1 ${ctaColor} font-semibold text-sm`}>
        {ctaText}
        <ChevronRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
