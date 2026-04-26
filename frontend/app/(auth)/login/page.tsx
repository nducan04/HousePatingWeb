"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/utils/axiosAuth";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

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
      setError("Vui lòng nhập email và mật khẩu");
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
      className="min-h-screen flex items-center justify-center bg-gray-50/80 backdrop-blur-sm font-sans p-4"
      style={{ background: "linear-gradient(135deg, #06b6d4, #d0dbd7ff)" }}
    >
      <div className="bg-white text-gray-500 w-full max-w-96 mx-auto md:p-6 p-4 text-left text-sm rounded-xl shadow-[0px_0px_10px_0px] shadow-black/10">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Welcome back
        </h2>
        <form onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500 shrink-0" size={16} />
              <span className="text-xs font-medium text-red-700">{error}</span>
            </div>
          )}

          <input
            id="email"
            className="w-full bg-transparent border my-3 border-gray-500/30 outline-none rounded-full py-2.5 px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            type="text"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            id="password"
            className="w-full bg-transparent border mt-1 border-gray-500/30 outline-none rounded-full py-2.5 px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-right py-4">
            <Link className="text-blue-600 underline" href="#">
              Forgot Password
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mb-3 bg-indigo-500 py-2.5 rounded-full text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Log in"
            )}
          </button>
        </form>
        <p className="text-center mt-4">
          Don’t have an account?{" "}
          <Link href="#" className="text-blue-500 underline">
            Signup
          </Link>
        </p>
        <button
          type="button"
          className="w-full flex items-center gap-2 justify-center mt-5 bg-black py-2.5 rounded-full text-white"
        >
          <img
            className="h-4 w-4"
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png"
            alt="appleLogo"
          />
          Log in with Apple
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-2 justify-center my-3 bg-white border border-gray-500/30 py-2.5 rounded-full text-gray-800"
        >
          <img
            className="h-4 w-4"
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png"
            alt="googleFavicon"
          />
          Log in with Google
        </button>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
