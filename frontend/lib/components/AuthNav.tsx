"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { User, LogIn, LayoutDashboard, Loader2, AlertCircle, X, LogOut, ChevronDown } from "lucide-react";
import api from "@/lib/utils/axiosAuth";

interface AuthNavProps {
  onOpenLogin?: () => void;
}

export default function AuthNav({ onOpenLogin }: AuthNavProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, logoutState } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Click outside to close menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.user-menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) { }
    logoutState();
    setIsMenuOpen(false);
    router.push("/");
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4 ml-1 sm:ml-2">
        {["Admin", "Director", "NhanVien"].includes(user.role) && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-blue-600 transition-all no-underline px-2.5 sm:px-4 py-2 rounded-xl hover:bg-blue-50 flex-shrink-0"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline xl:hidden 2xl:inline">{user.role === "NhanVien" ? "Quản lý nghiệp vụ" : "Dashboard"}</span>
          </Link>
        )}
        <div className="relative user-menu-container">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 pr-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[200] animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-50">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Tài khoản</p>
                <p className="text-sm font-black text-slate-900 truncate">
                  {user.profile?.HoTen || user.profile?.TenKhachHang || user.username}
                </p>
                <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">ID: {user.id || (user as any)._id}</p>
                <div className="mt-2 text-[10px] text-blue-600 font-extrabold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-lg inline-block">
                  {user.role === "Admin" ? "Quản trị viên" : user.role === "NhanVien" ? "Nhân viên" : user.role === "KhachHangB2B" ? "Đối tác B2B" : "Khách hàng"}
                </div>
              </div>

              <div className="p-2 space-y-1">
                <Link
                  href="/thongtin"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-slate-50 transition-all font-bold text-[13px] no-underline cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  Thông tin cá nhân
                </Link>

                <Link
                  href="/my-vouchers"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-slate-50 transition-all font-bold text-[13px] no-underline cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5" /><path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.5-6.9A2 2 0 0016.7 4H7.3a2 2 0 00-1.8 1.1z" /></svg>
                  </div>
                  Ví của tôi
                </Link>

                <Link
                  href="/my-warranties"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-slate-50 transition-all font-bold text-[13px] no-underline cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                  Bảo hành của tôi
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-[13px] border-none cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <LogOut size={16} />
                  </div>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {onOpenLogin ? (
        <button
          onClick={onOpenLogin}
          type="button"
          className="flex items-center gap-2 text-[14px] font-bold text-white bg-blue-600 px-5 sm:px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all cursor-pointer border-none"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </button>
      ) : (
        <Link
          href="/sign-in"
          className="flex items-center gap-2 text-[14px] font-bold text-white bg-blue-600 px-5 sm:px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all cursor-pointer border-none no-underline"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </Link>
      )}
    </div>
  );
}
