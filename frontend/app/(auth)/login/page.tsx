"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/utils/axiosAuth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { loginState } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/login", {
        TenDangNhap: username,
        MatKhau: password,
      });

      if (response.data.success) {
        loginState(response.data.user, response.data.accessToken);

        const role = response.data.user.role;
        const systemRoles = [
          "Admin",
          "NhanVien",
          "KhachHangB2B",
          "KhachHangB2C",
          "NhaCungCap",
        ];

        if (systemRoles.includes(role)) {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Kết nối thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex text-slate-100 font-sans"
      style={{ background: "linear-gradient(135deg, #06b6d4, #d0dbd7ff)" }}
    >
      {/* Left side: Animated branding background (Hide on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Animated gradients */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>

        <div className="relative z-10 max-w-lg">
          <Link
            href="/"
            className="inline-flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity"
          >
            {/* Đã xóa icon chữ V ở đây */}
            <span className="text-2xl font-bold tracking-tight">
              VTSC PaintPro
            </span>
          </Link>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Công ty Cổ phần Thương mại và Dịch vụ VOSCO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Công Nghiệp Số
            </span>
          </h1>
          <p className="text-xl text-slate-1000 leading-relaxed font-light">
            Nền tảng quản lý dự án B2B, Hợp đồng Blockchain & Theo dõi pha chế
            chuẩn AkzoNobel. Truy cập để kiểm soát rủi ro và tăng tốc kinh
            doanh.
          </p>
        </div>

        {/* Subtle geometric patterns overlays */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>
      </div>

      {/* Right side: Modern Login Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12"
        style={{
          background: "linear-gradient(135deg, #06b6d4, #dfe7e4ff)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "-20px 0 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Đã xóa icon chữ V cho bản Mobile ở đây */}

        {/* Right Side: Login Card */}
        {/* Right Side: Login Card */}
        <div className="w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-10 duration-700">
          {/* ĐÃ SỬA: Hiệu ứng kính mờ sáng (Light Glassmorphism) */}
          <div className="bg-white/20 rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40 relative overflow-hidden backdrop-blur-md">
            {/* Vệt sáng trang trí */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/40 rounded-full blur-[60px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  {/* ĐÃ SỬA MÀU CHỮ: Xám đậm để dễ đọc */}
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    Đăng nhập
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Chào mừng trở lại với VTSC
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-800/40 tracking-tighter italic">
                    VTSC
                  </span>
                  <span className="text-[8px] font-bold text-blue-600 tracking-[0.2em] uppercase -mt-1">
                    PaintPro
                  </span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <span className="text-xs font-medium text-red-700">
                      {error}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 transition-transform">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest ml-1">
                    Tài khoản
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors"
                      size={18}
                    />
                    {/* ĐÃ SỬA Ô NHẬP: Nền trắng mờ, chữ xám đậm */}
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:border-blue-500 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/20 outline-none text-slate-800 placeholder:text-slate-500 transition-all text-base"
                      placeholder="Email hoặc số điện thoại"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 transition-transform">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest ml-1">
                    Mật khẩu
                  </label>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors"
                      size={18}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:border-blue-500 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/20 outline-none text-slate-800 placeholder:text-slate-500 transition-all text-base"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <a
                    href="#"
                    className="text-xs text-slate-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Đăng nhập <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="pt-6 flex flex-col items-center gap-4">
                  <div className="w-full flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-400/30"></div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Hoặc
                    </span>
                    <div className="h-px flex-1 bg-slate-400/30"></div>
                  </div>

                  <button
                    type="button"
                    className="text-sm text-slate-700 hover:text-blue-700 transition-colors font-semibold"
                    onClick={() =>
                      alert(
                        "Vui lòng liên hệ quản trị viên để tạo tài khoản mới.",
                      )
                    }
                  >
                    Yêu cầu cấp tài khoản mới
                  </button>
                </div>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-400/30 text-center">
                <p className="text-sm text-slate-600">
                  Chưa có tài khoản Doanh nghiệp?{" "}
                  <Link
                    href="/"
                    className="text-blue-600 hover:text-blue-800 transition-colors font-semibold"
                  >
                    Liên hệ VTSC
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 w-full text-center z-20">
          <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
            VTSC PaintPro © 2024 — Industrial Intelligence Solution
          </p>
        </footer>
      </div>
    </div>
  );
}
