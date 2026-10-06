'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, loginState, accessToken, setAccessToken } = useAuthStore();

  useEffect(() => {
    // 1. Gửi ping đánh thức backend ngay khi mở web (non-blocking, không chặn UI)
    const wakeUpServer = () => {
      try {
        fetch(`${API_URL}/health`, { method: 'GET', keepalive: true }).catch(() => {});
      } catch (e) {}
    };
    wakeUpServer();

    // 2. Thử đăng nhập im lặng với timeout ngắn (3.5s) để không bao giờ làm treo UI
    const attemptSilentLogin = async () => {
      try {
        // Bước 1: Gọi /refresh với timeout 3.5s
        const refreshRes = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 3500 }
        );
        
        if (refreshRes.data?.success) {
          const newAccessToken = refreshRes.data.accessToken;

          // Bước 2: Gọi /me với token mới (timeout 3.5s)
          const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            timeout: 3500,
          });

          if (meRes.data?.success) {
            loginState(meRes.data.user, newAccessToken);
          }
        }
      } catch (error) {
        // Phiên hết hạn, chưa đăng nhập hoặc server đang khởi động
      } finally {
        setLoading(false);
      }
    };

    attemptSilentLogin();
  }, [setLoading, loginState]);

  return <>{children}</>;
}
