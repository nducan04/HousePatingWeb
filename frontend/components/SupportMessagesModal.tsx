'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Package, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export default function SupportMessagesModal({ isOpen, onClose, userId }: MessageModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [resBaoHanh, resDoiTra] = await Promise.all([
        api.get('/warranties').catch(() => ({ data: { data: [] } })),
        api.get('/doi-tra').catch(() => ({ data: { data: [] } }))
      ]);

      let allTickets: any[] = [];

      if (resBaoHanh.data?.data) {
        resBaoHanh.data.data.forEach((w: any) => {
          allTickets.push({
            id: w._id,
            refId: w.MaBaoHanh,
            type: 'WARRANTY',
            typeLabel: 'Bảo hành',
            issue: w.NoiDungLoi,
            status: w.TrangThai,
            date: w.createdAt,
            resolution: w.PhuongAnGiaiQuyet || '',
            customerAccount: w.KhachHang?.AccountID || w.KhachHang?._id
          });
        });
      }

      if (resDoiTra.data?.data) {
        resDoiTra.data.data.forEach((r: any) => {
          allTickets.push({
            id: r._id,
            refId: r.MaDoiTra,
            type: 'RETURN',
            typeLabel: 'Đổi trả',
            issue: r.LyDo,
            status: r.TrangThai,
            date: r.createdAt,
            resolution: r.PhuongAnGiaiQuyet || '',
            customerAccount: r.KhachHang?.AccountID || r.KhachHang?._id
          });
        });
      }

      // Filter for current user. Because backend KhachHang might have AccountID mapped to user._id
      const userTickets = allTickets.filter(t => t.customerAccount === userId);

      // Sort by latest
      userTickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMessages(userTickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquare size={16} />
            </div>
            <h2 className="font-black text-slate-800">Tin nhắn hỗ trợ &amp; Hậu mãi</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Đang tải tin nhắn...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <MessageSquare size={24} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-600">Chưa có tin nhắn hỗ trợ nào</p>
              <p className="text-xs text-slate-400">Các phản hồi về yêu cầu đổi trả hoặc bảo hành của bạn sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${msg.type === 'WARRANTY' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {msg.type === 'WARRANTY' ? <Shield size={10} /> : <Package size={10} />}
                      {msg.typeLabel}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">#{msg.refId}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(msg.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Yêu cầu của bạn:</p>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {msg.issue || 'Không có mô tả'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-50">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Phản hồi từ Trung tâm VTSC:</p>
                  {msg.resolution ? (
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {msg.resolution}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Đã có hướng xử lý
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2 text-amber-800">
                      <Clock size={14} className="mt-0.5 shrink-0" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold block mb-0.5">Đang tiếp nhận và xử lý</span>
                        Chúng tôi đang kiểm tra yêu cầu của bạn và sẽ cập nhật phương án giải quyết trong thời gian sớm nhất.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
