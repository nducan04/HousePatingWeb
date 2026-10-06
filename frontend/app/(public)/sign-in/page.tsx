"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  User,
  Mail,
  ArrowLeft
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";

export default function SignInPage() {
  const router = useRouter();
  const { loginState } = useAuthStore();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const res = await api.post("/auth/login", {
        TenDangNhap: loginEmail,
        MatKhau: loginPassword,
      });
      if (res.data.success) {
        loginState(res.data.user, res.data.accessToken);

        const role = res.data.user.role;
        if (role === "NhanVien" || role === "Admin" || role === "Director") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail) {
      setForgotError("Vui lòng nhập Tên đăng nhập và Email");
      return;
    }
    try {
      setIsResetting(true);
      setForgotError(null);
      const res = await api.post("/auth/forgot-password", {
        TenDangNhap: forgotUsername,
        Email: forgotEmail,
      });
      if (res.data.success) {
        setOtpSent(true);
        if (res.data.demoOtp) {
          alert(`Mã OTP Demo: ${res.data.demoOtp}`);
        }
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Lỗi khi gửi OTP");
    } finally {
      setIsResetting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      setForgotError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setIsResetting(true);
      setForgotError(null);
      const res = await api.post("/auth/reset-password", {
        TenDangNhap: forgotUsername,
        Email: forgotEmail,
        OTP: forgotOtp,
        MatKhauMoi: forgotNewPassword,
      });

      if (res.data.success) {
        setForgotSuccess(true);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotSuccess(false);
          setOtpSent(false);
          setForgotUsername("");
          setForgotEmail("");
          setForgotOtp("");
          setForgotNewPassword("");
          setForgotConfirmPassword("");
          setLoginEmail(forgotUsername);
        }, 2000);
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-10 flex flex-col items-start justify-center relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          <Link href="/" className="flex items-center gap-2 mb-12 relative z-10 hover:opacity-80 transition-opacity">
            <Palette size={32} className="text-blue-400" />
            <span className="text-2xl font-black tracking-tight">VTSC</span>
          </Link>

          <h2 className="text-3xl font-extrabold mb-4 relative z-10 leading-tight">
            Chào mừng trở lại!
          </h2>
          <p className="text-blue-200 mb-8 relative z-10 text-sm leading-relaxed">
            Đăng nhập để tiếp tục quản lý đơn hàng, theo dõi giao hàng và cập nhật các ưu đãi mới nhất từ VTSC.
          </p>

          <div className="space-y-4 relative z-10">
            {[
              "Bộ sưu tập hàng ngàn mã màu",
              "Theo dõi vận chuyển tự động",
              "Ký hợp đồng Blockchain bảo mật",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                <ShieldCheck size={18} className="text-blue-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 relative flex flex-col justify-center">
          {/* Back Button */}
          <Link 
            href="/" 
            className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100/50 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-all duration-300 no-underline shadow-sm hover:shadow"
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>

          {isForgotMode ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Khôi phục mật khẩu</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">
                Vui lòng nhập thông tin để đặt lại mật khẩu mới cho tài khoản của bạn.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-5">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle size={18} /> {forgotError}
                  </div>
                )}
                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-sm font-bold">
                    <ShieldCheck size={18} /> Mật khẩu đã được cập nhật thành công!
                  </div>
                )}

                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={forgotUsername}
                          onChange={(e) => setForgotUsername(e.target.value)}
                          className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder="Tên đăng nhập *"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder="Email đã đăng ký *"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          className="w-full h-12 bg-emerald-50 border border-emerald-200 rounded-xl pl-11 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          placeholder="Mã OTP (6 số) *"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder="Mật khẩu mới *"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder="Nhập lại mật khẩu mới *"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isResetting}
                      className="w-full h-14 bg-[#4f46e5] text-white rounded-xl font-bold text-[15px] flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4338ca] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                    >
                      {isResetting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        "Nhận mã OTP"
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="w-full h-14 bg-emerald-500 text-white rounded-xl font-bold text-[15px] flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                    >
                      {isResetting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        "Cập Nhật Mật Khẩu"
                      )}
                    </button>
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="text-sm font-bold text-slate-500 hover:text-blue-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">
                Sử dụng tài khoản của bạn để truy cập vào hệ thống.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle size={18} /> {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="Tên đăng nhập *"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="Mật khẩu *"
                      required
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-[13px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-14 bg-[#2563eb] text-white rounded-xl font-bold text-[15px] flex items-center justify-center shadow-lg shadow-blue-600/20 hover:bg-[#1d4ed8] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Đang xử lý đăng nhập...</span>
                      </div>
                    ) : (
                      "Đăng Nhập"
                    )}
                  </button>
                  {isLoggingIn && (
                    <p className="text-[12px] text-amber-600 dark:text-amber-400 font-medium text-center mt-2 animate-pulse">
                      ⚡ Đang kết nối máy chủ (nếu mở sau thời gian nghỉ, hệ thống sẽ mất 10-20 giây để khởi động)...
                    </p>
                  )}
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Chưa có tài khoản?{" "}
                    <Link
                      href="/signup"
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Đăng kí ngay
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
