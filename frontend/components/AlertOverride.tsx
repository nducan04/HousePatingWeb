"use client";

import { useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function AlertOverride() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message?: any) => {
        if (!message) return;

        const msgStr = String(message).toLowerCase();

        let icon: any = 'info';
        let title = 'Thông báo hệ thống';
        let confirmButtonColor = '#2563eb'; // Blue

        if (msgStr.includes('thành công') || msgStr.includes('đã lưu') || msgStr.includes('thêm') || msgStr.includes('đã xóa') || msgStr.includes('đã duyệt') || msgStr.includes('🎉')) {
          icon = 'success';
          title = 'Hoàn tất thao tác';
          confirmButtonColor = '#059669'; // Emerald
        } else if (msgStr.includes('lỗi') || msgStr.includes('thất bại') || msgStr.includes('không thể') || msgStr.includes('vui lòng') || msgStr.includes('không tìm thấy') || msgStr.includes('chưa')) {
          icon = 'warning';
          title = 'Lưu ý';
          confirmButtonColor = '#e11d48'; // Rose
        }

        Swal.fire({
          title: title,
          text: String(message),
          icon: icon,
          showCloseButton: true,
          confirmButtonText: 'Đồng ý',
          confirmButtonColor: confirmButtonColor,
          buttonsStyling: true,
          customClass: {
            container: 'font-sans',
            popup: 'rounded-2xl border border-slate-100 shadow-2xl',
            title: 'text-xl font-bold text-slate-800',
            htmlContainer: 'text-slate-500 font-medium',
            confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all',
          }
        });
      };
    }
  }, []);

  return null;
}
