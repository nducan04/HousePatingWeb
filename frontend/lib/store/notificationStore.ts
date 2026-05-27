import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  resolve: ((value: boolean) => void) | null;
}

export interface PromptState {
  isOpen: boolean;
  message: string;
  defaultValue: string;
  title: string;
  resolve: ((value: string | null) => void) | null;
}

interface NotificationState {
  toasts: Toast[];
  confirmState: ConfirmState;
  promptState: PromptState;
  
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
  respondConfirm: (value: boolean) => void;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  respondPrompt: (value: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  confirmState: {
    isOpen: false,
    message: '',
    title: 'Xác nhận',
    resolve: null,
  },
  promptState: {
    isOpen: false,
    message: '',
    defaultValue: '',
    title: 'Nhập thông tin',
    resolve: null,
  },

  addToast: (message, type, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  confirm: (message, title = 'Xác nhận') => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmState: {
          isOpen: true,
          message,
          title,
          resolve,
        },
      });
    });
  },

  respondConfirm: (value) => {
    const { resolve } = get().confirmState;
    if (resolve) {
      resolve(value);
    }
    set({
      confirmState: {
        isOpen: false,
        message: '',
        title: 'Xác nhận',
        resolve: null,
      },
    });
  },

  prompt: (message, defaultValue = '', title = 'Nhập thông tin') => {
    return new Promise<string | null>((resolve) => {
      set({
        promptState: {
          isOpen: true,
          message,
          defaultValue,
          title,
          resolve,
        },
      });
    });
  },

  respondPrompt: (value) => {
    const { resolve } = get().promptState;
    if (resolve) {
      resolve(value);
    }
    set({
      promptState: {
        isOpen: false,
        message: '',
        defaultValue: '',
        title: 'Nhập thông tin',
        resolve: null,
      },
    });
  },
}));
