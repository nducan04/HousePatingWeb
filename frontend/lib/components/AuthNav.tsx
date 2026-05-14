"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { User, LogIn, LayoutDashboard, Loader2, AlertCircle, X } from "lucide-react";
import api from "@/lib/utils/axiosAuth";

export default function AuthNav() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, loginState } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  if (isLoading) {
    return <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setLoginLoading(true);
      setError(null);

      const response = await api.post("/auth/login", {
        TenDangNhap: username,
        MatKhau: password,
      });

      if (response.data.success) {
        loginState(response.data.user, response.data.accessToken);
        setIsModalOpen(false);

        const role = response.data.user.role;
        const systemRoles = ["Admin", "NhanVien", "KhachHangB2B", "KhachHangB2C", "NhaCungCap"];

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
      setLoginLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
        <Link
          href={
            user.role === "Admin" || user.role === "NhanVien"
              ? "/dashboard"
              : "/dashboard"
          }
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors no-underline"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Bảng điều khiển</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all cursor-pointer border-none"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div
            className="border-blue-600 bg-white text-gray-500 w-full max-w-sm mx-auto p-8 rounded-[24px] shadow-2xl relative animate-in zoom-in-95 duration-300"
            style={{ top: "200px" }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">
              Chào Mừng Trở Lại
            </h2>

            <form onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3 mb-5">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <span className="text-xs font-bold text-red-700">{error}</span>
                </div>
              )}

              <input
                id="email"
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-2xl py-3 px-5 mb-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                type="text"
                placeholder="Nhập Tên Đăng Nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                id="password"
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-2xl py-3 px-5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                type="password"
                placeholder="Nhập Mật Khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right py-4">
                <Link className="text-blue-600 font-medium text-[13px] hover:underline" href="#">
                  Quên Mật Khẩu?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mb-5 bg-indigo-500 hover:bg-indigo-600 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-colors cursor-pointer"
              >
                {loginLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Đăng Nhập"
                )}
              </button>
            </form>

            <p className="text-center text-[13px] mb-5">
              Chưa có tài khoản?{" "}
              <Link href="#" className="text-blue-600 font-bold hover:underline">
                Đăng Ký
              </Link>
            </p>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center gap-3 justify-center bg-slate-900 hover:bg-black py-3 rounded-2xl text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <img
                  className="h-4 w-4"
                  src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png"
                  alt="Apple"
                />
                Đăng nhập bằng Apple
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 justify-center bg-white hover:bg-slate-50 border border-slate-200 py-3 rounded-2xl text-slate-700 text-sm font-medium transition-colors cursor-pointer"
              >
                <img
                  className="h-4 w-4"
                  src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png"
                  alt="Google"
                />
                Đăng nhập bằng Google
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
