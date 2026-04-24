import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'NhanVien' | 'KhachHangB2B' | 'KhachHangB2C';
  profile?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginState: (user: User, accessToken: string) => void;
  logoutState: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // loading initially to resolve silent auth

  loginState: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  logoutState: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setLoading: (isLoading) => set({ isLoading }),
}));
