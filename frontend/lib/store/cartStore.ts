import { create } from 'zustand';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

export const getGuestSessionId = (): string => {
  if (typeof window === 'undefined') return 'GUEST_SESSION';
  let guestId = localStorage.getItem('guestSessionId');
  if (!guestId) {
    guestId = 'GUEST_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('guestSessionId', guestId);
  }
  return guestId;
};

export interface CartItem {
  _id: string;
  SanPham: {
    _id: string;
    MaSanPham: string;
    TenDongSon: string;
    DonGiaCoSo: number;
    HinhAnh?: string;
    PhanLoai?: string;
    ThuongHieu?: string;
    TonKho?: number;
  };
  MaMau?: string;
  SoLuong: number;
}

interface CartState {
  cartItems: CartItem[];
  cartItemCount: number;
  cartTotal: number;
  isLoading: boolean;
  fetchCart: (sessionId: string) => Promise<void>;
  addToCart: (sessionId: string, sanPhamId: string, soLuong: number, maMau?: string) => Promise<void>;
  updateQuantity: (sessionId: string, sanPhamId: string, soLuong: number, maMau?: string) => Promise<void>;
  removeFromCart: (sessionId: string, sanPhamId: string, maMau?: string) => Promise<void>;
  clearCart: (sessionId: string) => Promise<void>;
  initializeCart: (userId?: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  cartItemCount: 0,
  cartTotal: 0,
  isLoading: false,

  fetchCart: async (sessionId: string) => {
    if (!sessionId) return;
    set({ isLoading: true });
    try {
      const res = await api.get(`/gio-hang/${sessionId}`);
      if (res.data.success && res.data.data) {
        const items = res.data.data.Items || res.data.data.items || [];
        const totalCount = items.reduce((acc: number, item: any) => acc + (item.SoLuong || 0), 0);
        const totalAmount = res.data.data.TongTienTamTinh || 0;
        set({
          cartItems: items,
          cartItemCount: totalCount,
          cartTotal: totalAmount,
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      set({ isLoading: false });
    }
  },

  addToCart: async (sessionId: string, sanPhamId: string, soLuong: number, maMau?: string) => {
    try {
      const res = await api.post(`/gio-hang/${sessionId}`, {
        SanPhamId: sanPhamId,
        SoLuong: soLuong,
        MaMau: maMau || 'N/A'
      });
      if (res.data.success) {
        const items = res.data.data.Items || res.data.data.items || [];
        const totalCount = items.reduce((acc: number, item: any) => acc + (item.SoLuong || 0), 0);
        const totalAmount = res.data.data.TongTienTamTinh || 0;
        set({
          cartItems: items,
          cartItemCount: totalCount,
          cartTotal: totalAmount,
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  },

  updateQuantity: async (sessionId: string, sanPhamId: string, soLuong: number, maMau?: string) => {
    try {
      const res = await api.post(`/gio-hang/${sessionId}`, {
        SanPhamId: sanPhamId,
        SoLuong: soLuong,
        MaMau: maMau || 'N/A'
      });
      if (res.data.success) {
        const items = res.data.data.Items || res.data.data.items || [];
        const totalCount = items.reduce((acc: number, item: any) => acc + (item.SoLuong || 0), 0);
        const totalAmount = res.data.data.TongTienTamTinh || 0;
        set({
          cartItems: items,
          cartItemCount: totalCount,
          cartTotal: totalAmount,
        });
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      throw err;
    }
  },

  removeFromCart: async (sessionId: string, sanPhamId: string, maMau?: string) => {
    try {
      const res = await api.post(`/gio-hang/${sessionId}`, {
        SanPhamId: sanPhamId,
        SoLuong: 0,
        MaMau: maMau || 'N/A'
      });
      if (res.data.success) {
        const items = res.data.data.Items || res.data.data.items || [];
        const totalCount = items.reduce((acc: number, item: any) => acc + (item.SoLuong || 0), 0);
        const totalAmount = res.data.data.TongTienTamTinh || 0;
        set({
          cartItems: items,
          cartItemCount: totalCount,
          cartTotal: totalAmount,
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    }
  },

  clearCart: async (sessionId: string) => {
    try {
      await api.delete(`/gio-hang/${sessionId}`);
      set({
        cartItems: [],
        cartItemCount: 0,
        cartTotal: 0,
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
      throw err;
    }
  },

  initializeCart: async (userId?: string) => {
    const guestId = getGuestSessionId();
    if (userId) {
      // Only attempt merge if we have a valid access token to avoid 401 noise
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        try {
          await api.post('/gio-hang/merge', { guestSessionId: guestId });
        } catch (err) {
          console.error('Error merging cart:', err);
        }
      }
      await get().fetchCart(userId);
    } else {
      await get().fetchCart(guestId);
    }
  },
}));
