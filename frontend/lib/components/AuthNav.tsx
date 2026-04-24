'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { User, LogIn, LayoutDashboard } from 'lucide-react';

export default function AuthNav() {
  const { isAuthenticated, user, isLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      isLoading: state.isLoading,
    }))
  );

  if (isLoading) {
    return <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
        <Link
          href={user.role === 'Admin' || user.role === 'NhanVien' ? '/dashboard' : '/dashboard'}
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
    <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
      <Link
        href="/login"
        className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
      >
        <LogIn className="w-4 h-4" />
        <span>Đăng nhập</span>
      </Link>
    </div>
  );
}
