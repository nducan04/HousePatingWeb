"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Briefcase,
  CreditCard,
  Building,
  ArrowLeft
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { loginState } = useAuthStore();

  const [registerRole, setRegisterRole] = useState("KhachHangB2C");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDiaChi, setRegisterDiaChi] = useState("");
  const [registerSDT, setRegisterSDT] = useState("");
  const [registerMaSoThue, setRegisterMaSoThue] = useState("");
  const [registerTaiKhoanNganHang, setRegisterTaiKhoanNganHang] = useState("");
  const [registerNguoiDaiDien, setRegisterNguoiDaiDien] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerFullName || !registerEmail || !registerPassword || !registerRole) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post("/auth/register", {
        TenDangNhap: registerUsername,
        HoTen: registerFullName,
        Email: registerEmail,
        MatKhau: registerPassword,
        VaiTro: registerRole,
        DiaChi: registerDiaChi,
        SDT: registerSDT,
        MaSoThue: registerMaSoThue,
        TaiKhoanNganHang: registerTaiKhoanNganHang,
        NguoiDaiDien: registerNguoiDaiDien,
      });

      if (res.data.success) {
        setSuccess(true);
        // Automatically login the user after successful registration
        try {
          const loginRes = await api.post("/auth/login", {
            TenDangNhap: registerUsername,
            MatKhau: registerPassword,
          });
          if (loginRes.data.success) {
            loginState(loginRes.data.user, loginRes.data.accessToken);
          }
        } catch (err) {
          console.error("Auto login failed:", err);
        }
        
        setTimeout(() => {
          setSuccess(false);
          router.push("/");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
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
            Khám phá kỷ nguyên màu sắc tĩnh điện
          </h2>
          <p className="text-blue-200 mb-8 relative z-10 text-sm leading-relaxed">
            Đăng ký tài khoản để trải nghiệm dịch vụ pha chế màu sắc độc quyền, theo dõi đơn hàng thời gian thực và quản lý hợp đồng thông minh.
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
            className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100/50 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-all duration-300 no-underline shadow-sm hover:shadow z-20"
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký tài khoản mới</h3>
          <p className="text-sm text-slate-500 mb-8 font-medium">
            Điền đầy đủ thông tin bên dưới để trở thành đối tác của VTSC.
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <ShieldCheck size={18} /> Đăng ký thành công! Đang chuyển hướng...
              </div>
            )}

            {/* Loại khách hàng Selector */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRegisterRole("KhachHangB2C")}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  registerRole === "KhachHangB2C" 
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User size={18} /> Cá nhân
              </button>
              <button
                type="button"
                onClick={() => setRegisterRole("KhachHangB2B")}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  registerRole === "KhachHangB2B" 
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 size={18} /> Doanh nghiệp
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột 1 */}
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Tên đăng nhập *"
                    required
                  />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder={registerRole === "KhachHangB2B" ? "Tên doanh nghiệp *" : "Họ và tên đầy đủ *"}
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Địa chỉ Email *"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Mật khẩu *"
                    required
                  />
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={registerDiaChi}
                    onChange={(e) => setRegisterDiaChi(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Địa chỉ liên hệ"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={registerSDT}
                    onChange={(e) => setRegisterSDT(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Số điện thoại"
                  />
                </div>

                {registerRole === "KhachHangB2B" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={registerMaSoThue}
                        onChange={(e) => setRegisterMaSoThue(e.target.value)}
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        placeholder="Mã số thuế"
                      />
                    </div>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={registerTaiKhoanNganHang}
                        onChange={(e) => setRegisterTaiKhoanNganHang(e.target.value)}
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        placeholder="Tài khoản ngân hàng"
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={registerNguoiDaiDien}
                        onChange={(e) => setRegisterNguoiDaiDien(e.target.value)}
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        placeholder="Người đại diện"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-14 ${registerRole === 'KhachHangB2B' ? 'bg-[#4f46e5] hover:bg-[#4338ca] shadow-indigo-600/20' : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/20'} text-white rounded-xl font-bold text-[15px] flex items-center justify-center shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Tạo Tài Khoản"
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-500 font-medium">
                Đã có tài khoản?{" "}
                <Link
                  href="/"
                  className={`font-bold hover:underline ${registerRole === 'KhachHangB2B' ? 'text-indigo-600' : 'text-blue-600'}`}
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
