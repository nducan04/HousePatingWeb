'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, loginState, accessToken, setAccessToken } = useAuthStore();

  useEffect(() => {
    const attemptSilentLogin = async () => {
      try {
        // Bước 1: Gọi /refresh để lấy Access Token mới từ HttpOnly Cookie
        const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = refreshRes.data.accessToken;

        // Bước 2: Gọi /me với token mới để lấy đầy đủ thông tin user + profile
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        });

        if (meRes.data.success) {
          loginState(meRes.data.user, newAccessToken);
        }
      } catch (error) {
        // Cookie hết hạn hoặc chưa đăng nhập → chấp nhận trạng thái khách
        console.log('Chưa đăng nhập hoặc phiên đã hết hạn');
      } finally {
        setLoading(false);
      }
    };

    attemptSilentLogin();
  }, [setLoading, loginState]);

  return <>{children}</>;
}
