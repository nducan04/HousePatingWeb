"use client";

function hexToHSL(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import {
  Search,
  Palette,
  Sparkles,
  X,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { paintColors } from "@/lib/data/colors-data";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/utils/axiosAuth";

export default function ColorsPage() {
  const router = useRouter();
  const { isAuthenticated, loginState } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof paintColors)[0] | null
  >(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Auth States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handlePageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const { loginState } = useAuthStore.getState();
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const res = await api.post("/auth/login", {
        TenDangNhap: loginEmail,
        MatKhau: loginPassword,
      });
      if (res.data.success) {
        loginState(res.data.user, res.data.accessToken);
        setIsLoginOpen(false);

        // Handle redirect if exists
        if (redirectPath) {
          router.push(redirectPath);
          setRedirectPath(null);
          return;
        }
        const role = res.data.user.role;
        if (role === "NhanVien") {
          router.push("/quan-ly-san-pham");
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



  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !forgotNewPassword || !forgotConfirmPassword) {
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
        MatKhauMoi: forgotNewPassword
      });

      if (res.data.success) {
        setForgotSuccess(true);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotSuccess(false);
          setForgotUsername("");
          setForgotEmail("");
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

  const sortedColorsList = useMemo(() => {
    return [...paintColors].sort((a, b) => {
      const hslA = hexToHSL(a.hex);
      const hslB = hexToHSL(b.hex);
      return hslA.h - hslB.h;
    });
  }, []);

  const filteredColors = useMemo(() => {
    return sortedColorsList.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.hex.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        categoryFilter === "all" || c.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, categoryFilter, sortedColorsList]);

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(paintColors.map((c) => c.category)))];
  }, []);

  const sortedColors = useMemo(() => {
    return [...filteredColors].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredColors]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <PublicNavbar activeRoute="/colors" onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">


      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 rounded-2xl p-10 mb-8 border border-slate-800 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <Palette
          size={48}
          className="text-blue-400 mx-auto mb-4 relative z-10"
        />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 relative z-10">
          Bảng Mã Màu Sơn Tĩnh Điện
        </h2>
        <p className="text-blue-200 text-base mb-6 relative z-10">
          AkzoNobel Interpon — Tiêu chuẩn chất lượng hàng đầu thế giới
        </p>
        <div className="relative max-w-md mx-auto z-10">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-lg"
            placeholder="Tìm theo mã màu, tên hoặc HEX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${categoryFilter === cat ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm border border-slate-200"}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat === "all" ? "Tất cả" : cat}
          </button>
        ))}
        <span className="ml-auto text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          {filteredColors.length} màu
        </span>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedColors.map((color) => (
          <div
            key={color.code}
            className="bg-white border border-slate-100 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-200 group"
            onClick={() =>
              setSelectedColor(
                selectedColor?.code === color.code ? null : color,
              )
            }
          >
            <div
              className="h-32 w-full transition-transform duration-500 group-hover:scale-105"
              style={{ background: color.hex }}
            />
            <div className="p-4">
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                {color.code}
              </div>
              <div className="text-base font-bold text-slate-800 mt-1">
                {color.name}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                <span>{color.hex}</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-xs font-semibold">
                  {color.gloss}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Không tìm thấy màu phù hợp.</p>
          <p className="text-sm">
            Thử nhập mã màu khác hoặc kiểm tra lại từ khóa.
          </p>
        </div>
      )}

      {/* Color Detail Modal */}
      {selectedColor && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedColor(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedColor.name}
                </h3>
                <p className="text-sm text-blue-600 font-semibold">
                  {selectedColor.code}
                </p>
              </div>
              <button
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedColor(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Color Preview */}
            <div className="px-6 pt-6">
              <div
                className="h-44 rounded-xl mb-6 relative overflow-hidden group"
                style={{
                  background: selectedColor.hex,
                  boxShadow: `0 10px 40px ${selectedColor.hex}40`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Details */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-xl p-5 space-y-0 border border-slate-100">
                {[
                  { label: "Mã Màu", value: selectedColor.code },
                  { label: "HEX", value: selectedColor.hex, mono: true },
                  { label: "Danh mục", value: selectedColor.category },
                  { label: "Độ bóng", value: selectedColor.gloss },
                  { label: "Bề mặt", value: selectedColor.surface },
                  { label: "Ứng dụng", value: selectedColor.application },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between py-2.5 border-b border-slate-200/60 last:border-b-0"
                  >
                    <span className="text-sm text-slate-500 font-medium">
                      {row.label}
                    </span>
                    <span
                      className={`text-sm text-slate-800 font-semibold ${row.mono ? "font-mono" : ""}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}

                {/* Divider */}
                <div className="border-t border-slate-200/60 my-2 pt-2"></div>

                {/* 3 trường B2C */}
                {[
                  { label: "Độ phủ lý thuyết", value: selectedColor.coverage },
                  {
                    label: "Quy cách đóng gói",
                    value: selectedColor.packaging,
                  },
                  { label: "Quy trình pha chế", value: selectedColor.mixing },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between py-2.5 border-b border-slate-200/60 last:border-b-0"
                  >
                    <span className="text-sm text-blue-600 font-bold">
                      {row.label}
                    </span>
                    <span className="text-sm text-slate-800 font-semibold">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const targetPath = `/rd-tracking/new?colorCode=${selectedColor.code}&colorName=${selectedColor.name}`;
                    setSelectedColor(null); // Close modal
                    if (!isAuthenticated) {
                      router.push("/sign-in");
                    } else {
                      router.push(targetPath);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all border-none shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Sparkles size={16} /> Yêu cầu mẫu thử
                </button>
                <button
                  className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer border border-slate-200 shadow-sm"
                  onClick={() => setSelectedColor(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>

      <PublicFooter />

      {/* ═══════ LOGIN / REGISTER MODAL OVERLAY ═══════ */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setIsLoginOpen(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer border-none"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              {isForgotMode
                ? "Đặt Lại Mật Khẩu"
                : "Chào Mừng Trở Lại"}
            </h2>

            {isForgotMode ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={16} /> {forgotError}
                  </div>
                )}
                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
                    <ShieldCheck size={16} /> Đặt lại mật khẩu thành công!
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Tên đăng nhập"
                    required
                  />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Email đã đăng ký"
                    required
                  />
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Mật khẩu mới"
                    required
                  />
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {isResetting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Cập Nhật Mật Khẩu"
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePageLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={16} /> {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="Tên đăng nhập"
                  />

                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-12 bg-blue-50/50 border border-blue-100/50 rounded-xl px-5 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                    placeholder="••••••"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên Mật Khẩu?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-12 bg-[#6366f1] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-0.5 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Đăng Nhập"
                    )}
                  </button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Chưa có tài khoản?{" "}
                    <Link
                      href="/signup"
                      className="text-blue-600 font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Đăng kí ngay
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
