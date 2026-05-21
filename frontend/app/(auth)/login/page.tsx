"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/utils/axiosAuth";
import Link from "next/link";
import { Loader2, AlertCircle, LogIn, ArrowLeft } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams ? searchParams.get("redirect") || "" : "";
  
  const { loginState } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
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

        if (redirect) {
          router.push(redirect);
          return;
        }

        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4 relative overflow-hidden">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 relative z-10 animate-in zoom-in-95 duration-500 border border-slate-100">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-xs font-bold uppercase tracking-widest no-underline mb-8">
          <ArrowLeft size={16} /> Trở về trang chủ
        </Link>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LogIn size={36} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Chào Mừng Trở Lại</h2>
          <p className="text-slate-500 font-medium mt-2">Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in duration-300">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                placeholder="Nhập tên đăng nhập..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <div className="text-right">
            <Link href="#" className="text-[12px] font-bold text-blue-600 hover:underline no-underline">Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#6366f1] text-white rounded-2xl font-bold text-base flex items-center justify-center shadow-xl shadow-indigo-600/20 hover:bg-[#4f46e5] hover:-translate-y-1 transition-all disabled:opacity-50 border-none cursor-pointer mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Đăng Nhập"}
          </button>


          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer">
              <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png" className="w-4 h-4" alt="Google" /> Google
            </button>
            <button type="button" className="h-14 bg-[#0f172a] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all border-none cursor-pointer">
              <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png" className="w-4 h-4" alt="Apple" /> Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
