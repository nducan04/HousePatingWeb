import { useNotificationStore } from '../store/notificationStore';

export const toast = {
  success: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast(message, 'success', duration);
  },
  error: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast(message, 'error', duration);
  },
  warning: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast(message, 'warning', duration);
  },
  info: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast(message, 'info', duration);
  },
};

export const confirm = (message: string, title?: string) => {
  return useNotificationStore.getState().confirm(message, title);
};

export const prompt = (message: string, defaultValue?: string, title?: string) => {
  return useNotificationStore.getState().prompt(message, defaultValue, title);
};
