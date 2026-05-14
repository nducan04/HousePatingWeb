'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'NhanVien' | 'KhachHangB2B' | 'KhachHangB2C' | 'NhaCungCap')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Nếu app đang trong luồng kiểm tra token, đợi chút
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Phân quyền bị từ chối
      // Thông thường đá về dashboard mặc định
      router.push('/unauthorized');
    } else {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  // Trong lúc chờ check token / redirect, hiện loading
  if (isLoading || (!isAuthenticated && !isAuthorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  // Khớp với quyền -> Load Component con
  return <>{children}</>;
}
