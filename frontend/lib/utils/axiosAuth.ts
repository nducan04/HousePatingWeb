import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Quan trọng để gửi HttpOnly Cookie
});

// Thêm token vào Header của mọi Request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho Responses (Xử lý lỗi Token Hết Hạn)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Ngăn chặn loop vô hạn

      try {
        // Gửi request lấy token mới thông qua Refresh Token Cookie ngầm
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        const newAccessToken = res.data.accessToken;

        // Cập nhật lại Zustand Store 
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Gắn token mới và thực hiện lại Request ban đầu bị Fail
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Nếu refresh fail (VD: Refresh Token hết hạn) => Xóa State, bắt đăng nhập lại
        useAuthStore.getState().logoutState();
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
