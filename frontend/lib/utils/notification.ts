import Swal from 'sweetalert2';
import hotToast from 'react-hot-toast';

export const toast = {
  success: (message: string, duration?: number) => {
    hotToast.success(message, { duration });
  },
  error: (message: string, duration?: number) => {
    hotToast.error(message, { duration });
  },
  warning: (message: string, duration?: number) => {
    hotToast(message, { icon: '⚠️', duration });
  },
  info: (message: string, duration?: number) => {
    hotToast(message, { icon: 'ℹ️', duration });
  },
};

export const confirm = async (message: string, title: string = 'Xác nhận'): Promise<boolean> => {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    buttonsStyling: true,
    customClass: {
      confirmButton: 'px-6 py-2.5 rounded-md font-bold text-sm shadow-md',
      cancelButton: 'px-6 py-2.5 rounded-md font-bold text-sm bg-slate-400 text-white',
    }
  });
  return result.isConfirmed;
};

export const prompt = async (message: string, defaultValue: string = '', title: string = 'Nhập thông tin'): Promise<string | null> => {
  const result = await Swal.fire({
    title: title,
    text: message,
    input: 'text',
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    buttonsStyling: true,
    customClass: {
      confirmButton: 'px-6 py-2.5 rounded-md font-bold text-sm shadow-md',
      cancelButton: 'px-6 py-2.5 rounded-md font-bold text-sm bg-slate-400 text-white',
    }
  });
  return result.isConfirmed ? result.value : null;
};
