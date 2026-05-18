'use client';

import React, { useState, useEffect } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import SupportTicketModal from './SupportTicketModal';
import TicketProcessingDrawer from './TicketProcessingDrawer';
import type { Ticket, TicketStatus } from './TicketProcessingDrawer';
import api from '@/lib/utils/axiosAuth';

const initialTickets: Ticket[] = [
  {
    id: 'BH-20260516-001',
    type: 'Bảo hành',
    customer: 'Công ty XD Thái Hưng',
    phoneOrContract: 'HD-GC-2601',
    description: 'Bong tróc mảng lớn tại vị trí hàn sau 2 tuần thi công',
    status: 'Đang xử lý',
    assignee: 'KTV-08 Nguyễn Văn T',
    resolution: 'Cử đội kỹ thuật xuống kiểm tra và sơn lại toàn bộ khu vực lỗi.',
    createdAt: '16/05/2026',
  },
  {
    id: 'KN-20260515-003',
    type: 'Khiếu nại',
    customer: 'Lê Văn Khách',
    phoneOrContract: '0987 654 321',
    description: 'Màu sơn không đúng mã RAL 7016 theo hợp đồng',
    status: 'Chờ tiếp nhận',
    createdAt: '15/05/2026',
  },
];

const STATUS_BADGE: Record<TicketStatus, string> = {
  'Chờ tiếp nhận': 'bg-rose-100 text-rose-700',
  'Đang xử lý': 'bg-amber-100 text-amber-700',
  'Đã hoàn tất': 'bg-emerald-100 text-emerald-700',
};

const TYPE_BADGE: Record<string, string> = {
  'Bảo hành': 'bg-blue-100 text-blue-700',
  'Khiếu nại': 'bg-rose-100 text-rose-700',
  'Đổi trả': 'bg-orange-100 text-orange-700',
};

export default function HelpdeskTicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [dbStaffs, setDbStaffs] = useState<any[]>([]);

  // ── Fetch tickets từ API ──
  const fetchTickets = async () => {
    try {
      const res = await api.get('/doi-tra');
      if (res.data?.success && res.data.data.length > 0) {
        const mapped: Ticket[] = res.data.data.map((item: any) => ({
          id: item.MaDoiTra || item._id,
          type: (item.LoaiYeuCau as Ticket['type']) || 'Đổi trả',
          customer: item.KhachHang?.TenKhachHang || 'Khách hàng',
          phoneOrContract: item.DonHang?.MaHopDong || item.DonHang?.MaDonHang || 'N/A',
          description: item.LyDo || '',
          status: (item.TrangThai === 'draft'
            ? 'Chờ tiếp nhận'
            : (item.TrangThai || 'Chờ tiếp nhận')) as TicketStatus,
          assignee: item.NhanVienPhuTrach?.HoTen || '',
          resolution: item.PhuongAnGiaiQuyet || '',
          deadline: item.DuKienDenHang || '',
          createdAt: new Date(item.createdAt).toLocaleDateString('vi-VN'),
        }));
        setTickets(mapped);
      }
    } catch (err) {
      console.error('Lỗi fetch tickets:', err);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // ── Fetch nhân viên ──
  useEffect(() => {
    api.get('/nhan-vien')
      .then(res => setDbStaffs(res.data.data || []))
      .catch(err => console.error('Lỗi fetch nhân viên:', err));
  }, []);

  // ── Toast ──
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // ── Mở Drawer ──
  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket({ ...ticket });
    setIsDrawerOpen(true);
  };

  // ── Cập nhật ticket state (local) ──
  const handleUpdateTicket = (updatedData: Partial<Ticket>) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, ...updatedData };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Trung Tâm Xử Lý Khiếu Nại - Bảo Hành</h1>
          <p className="text-slate-500 mt-1">Quản lý và xử lý tất cả yêu cầu hỗ trợ khách hàng</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={18} strokeWidth={1.5} /> Tạo Ticket Mới
        </button>
      </div>

      {/* ── Bảng danh sách ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Mã Ticket</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Loại</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Phụ trách</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400 text-sm italic">
                  Chưa có ticket nào. Hãy tạo ticket mới!
                </td>
              </tr>
            )}
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => openTicketDetail(ticket)}
                className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-900">{ticket.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{ticket.customer}</div>
                  <div className="text-xs text-slate-400">{ticket.phoneOrContract}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[ticket.type] || 'bg-slate-100 text-slate-600'}`}>
                    {ticket.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[ticket.status]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {ticket.assignee || <span className="text-slate-300 italic">Chưa phân công</span>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{ticket.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg"
                    onClick={e => { e.stopPropagation(); openTicketDetail(ticket); }}
                  >
                    <UserPlus size={16} className="text-slate-400" strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal tạo Ticket ── */}
      <SupportTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          triggerToast();
          fetchTickets();
          setIsCreateModalOpen(false);
        }}
      />

      {/* ── Ticket Processing Drawer ── */}
      <TicketProcessingDrawer
        isOpen={isDrawerOpen}
        ticket={selectedTicket}
        staffList={dbStaffs}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateTicket}
      />

      {/* ── Toast ── */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[100]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Đã tạo ticket thành công!
        </div>
      )}
    </div>
  );
}