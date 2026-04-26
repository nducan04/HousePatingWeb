"use client";

import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { User, LogIn, LayoutDashboard } from "lucide-react";

export default function AuthNav() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
        <Link
          href={
            user.role === "Admin" || user.role === "NhanVien"
              ? "/dashboard"
              : "/dashboard"
          }
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
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
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <Link
        href="/login"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#ffffff",
          background: "#2563eb",
          padding: "8px 18px",
          borderRadius: "10px",
          textDecoration: "none",
          boxShadow: "0 2px 10px rgba(37,99,235,0.25)",
          transition: "all 0.2s ease",
          lineHeight: 1.4,
        }}
      >
        <LogIn style={{ width: "16px", height: "16px", color: "#ffffff" }} />
        <span style={{ color: "#ffffff" }}>Đăng nhập</span>
      </Link>
    </div>
  );
}
