'use client';
import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface CustomerCreateTicketModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerCreateTicketModal({ order, onClose, onSuccess }: CustomerCreateTicketModalProps) {
  const [ticketType, setTicketType] = useState('Đổi trả');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      setError('Vui lòng nhập mô tả vấn đề');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (ticketType === 'Bảo hành') {
        await api.post('/bao-hanh', {
          KhachHang: order.KhachHang?._id || order.KhachHang,
          DonHang: order._id,
          SanPham: order.Items?.map((i: any) => i.TenSanPham || i.SanPham?.TenDongSon).join(', ') || 'Sản phẩm',
          NoiDungLoi: description,
        });
      } else {
        await api.post('/doi-tra', {
          KhachHang: order.KhachHang?._id || order.KhachHang,
          DonHang: order._id,
          LoaiYeuCau: ticketType,
          LyDo: description,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi tạo yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Yêu cầu Hỗ trợ / Đổi trả</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <form id="customer-ticket-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Loại yêu cầu</label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Đổi trả">🔄 Đổi trả hàng</option>
                <option value="Bảo hành">🔧 Bảo hành sản phẩm</option>
                <option value="Khiếu nại">📢 Khiếu nại dịch vụ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Mô tả chi tiết vấn đề</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Vui lòng mô tả cụ thể vấn đề bạn đang gặp phải để chúng tôi hỗ trợ tốt nhất..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="customer-ticket-form"
            disabled={isSubmitting}
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}
