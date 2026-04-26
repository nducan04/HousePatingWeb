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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Background decorative blobs ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* ══════════════════════════ NAVBAR ══════════════════════════ */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "16px",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                flexShrink: 0,
              }}
            >
              V
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: "18px",
                color: "#0f172a",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              VTSC PaintPro
            </span>
          </Link>

          {/* Nav links - right side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <Link
              href="/colors"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                lineHeight: 1.4,
              }}
            >
              Tra cứu Màu
            </Link>
            <Link
              href="/tracking"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                lineHeight: 1.4,
              }}
            >
              QR Tracking
            </Link>
            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "20px" }}>
              <AuthNav />
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 32px 96px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "9999px",
              background: "rgba(239,246,255,0.9)",
              border: "1px solid #bfdbfe",
              marginBottom: "32px",
            }}
          >
            <Sparkles style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d4ed8", lineHeight: 1.4 }}>
              Đại lý phân phối cấp 1 — AkzoNobel Interpon
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 64px)",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              marginBottom: "24px",
            }}
          >
            Hệ thống Quản lý
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sơn Tĩnh Điện VTSC
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "#64748b",
              lineHeight: 1.75,
              maxWidth: "580px",
              margin: "0 auto 40px",
            }}
          >
            Nền tảng giao thương B2B tích hợp Hợp đồng thông minh Smart Contract
            và Cổng tra cứu B2C dành cho khách hàng toàn quốc.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                color: "#ffffff",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "16px",
                textDecoration: "none",
                lineHeight: 1.4,
                boxShadow: "0 8px 30px rgba(37,99,235,0.35)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ color: "#ffffff" }}>Truy cập Quản trị</span>
              <ArrowRight style={{ width: "18px", height: "18px", color: "#ffffff" }} />
            </Link>
            <Link
              href="/colors"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "#ffffff",
                color: "#334155",
                border: "1.5px solid #cbd5e1",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "16px",
                textDecoration: "none",
                lineHeight: 1.4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ color: "#334155" }}>Tra cứu Mã Màu</span>
              <Search style={{ width: "18px", height: "18px", color: "#334155" }} />
            </Link>
          </div>
        </div>
      </main>

      {/* ══════════════════════════ SERVICES ══════════════════════════ */}
      <section
        style={{
          padding: "80px 32px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #f1f5f9",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.025em",
                marginBottom: "12px",
                lineHeight: 1.3,
              }}
            >
              Tiện ích dành cho Khách hàng
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#64748b",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Trải nghiệm dịch vụ số hóa hoàn toàn tự động, minh bạch và an toàn — không cần đăng ký tài khoản.
            </p>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
            className="homepage-cards-grid"
          >
            {/* Card 1 - Tra cứu Bộ Màu */}
            <ServiceCard
              icon={<Search size={28} strokeWidth={1.5} />}
              iconBg="#eff6ff"
              iconColor="#2563eb"
              title="Tra cứu Bộ Màu"
              desc="Hàng ngàn mã màu tĩnh điện AkzoNobel chuẩn xác với mã Hex và hình ảnh thực tế."
              ctaText="Trải nghiệm ngay"
              ctaColor="#2563eb"
              href="/colors"
            />

            {/* Card 2 - QR Tracking */}
            <ServiceCard
              icon={<QrCode size={28} strokeWidth={1.5} />}
              iconBg="#ecfdf5"
              iconColor="#059669"
              title="QR Tracking"
              desc="Quét mã QR trên thùng sơn để kiểm tra hàng chính hãng và lộ trình giao hàng trực tuyến."
              ctaText="Bắt đầu tra cứu"
              ctaColor="#059669"
              href="/tracking"
            />

            {/* Card 3 - Trợ lý ảo AI */}
            <ServiceCard
              icon={<MessageSquare size={28} strokeWidth={1.5} />}
              iconBg="#faf5ff"
              iconColor="#7c3aed"
              title="Trợ lý ảo AI"
              desc="Giải đáp thắc mắc kỹ thuật pha chế, khiếu nại và tư vấn mua hàng hoạt động 24/7."
              ctaText="Trò chuyện ngay"
              ctaColor="#7c3aed"
              href="#"
            />

            {/* Card 4 - Hợp đồng Web3 */}
            <ServiceCard
              icon={<ShieldCheck size={28} strokeWidth={1.5} />}
              iconBg="#fffbeb"
              iconColor="#d97706"
              title="Hợp đồng Web3"
              desc="Ký kết hợp đồng B2B hoàn toàn trực tuyến và lưu trữ vĩnh viễn trên Blockchain."
              ctaText="Tìm hiểu thêm"
              ctaColor="#d97706"
              href="#"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer
        style={{
          padding: "28px 32px",
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          <p style={{ fontWeight: 500 }}>
            © 2026 Hệ thống VTSC PaintPro. Đồ án tốt nghiệp - Nhóm 41.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="#" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>
              Điều khoản
            </Link>
            <Link href="#" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>
              Bảo mật
            </Link>
            <Link href="#" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>
              Liên hệ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Service Card Component ── */
function ServiceCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  ctaText,
  ctaColor,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  ctaText: string;
  ctaColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="homepage-service-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        padding: "28px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "56px",
          height: "56px",
          background: iconBg,
          color: iconColor,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          flexShrink: 0,
          transition: "transform 0.3s ease",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "8px",
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.7,
          marginBottom: "20px",
          flex: 1,
        }}
      >
        {desc}
      </p>

      {/* CTA */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: ctaColor,
          fontWeight: 600,
          fontSize: "14px",
          lineHeight: 1.4,
        }}
      >
        {ctaText}
        <ChevronRight style={{ width: "16px", height: "16px" }} />
      </span>
    </Link>
  );
}
