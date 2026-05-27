'use client';
import React, { useState, useEffect } from 'react';
import { X, Shield, Clock, FileText, CheckCircle2, XCircle, RefreshCcw, Wrench } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import CustomerTicketDetailModal from './CustomerTicketDetailModal';

export default function CustomerWarrantyHistoryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [retRes, warRes] = await Promise.all([
                    api.get('/doi-tra'),
                    api.get('/warranties')
                ]);
                const all = [];
                if (retRes.data?.success) all.push(...retRes.data.data.map((t: any) => ({ ...t, _ticketType: 'RETURN' })));
                if (warRes.data?.success) all.push(...warRes.data.data.map((t: any) => ({ ...t, _ticketType: 'WARRANTY' })));
                
                // Sort by date descending
                all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                setTickets(all);
            } catch (error) {
                console.error("Error fetching warranty history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Tra cứu Lịch sử Bảo hành & Đổi trả</h2>
                                <p className="text-sm font-bold text-slate-500 mt-1">Danh sách các yêu cầu hỗ trợ kỹ thuật của bạn</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer border-none">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1 custom-scrollbar">
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100">
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider">Mã Yêu Cầu</th>
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider">Loại Hỗ Trợ</th>
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider">Sản Phẩm / Vấn Đề</th>
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider">Ngày Gửi</th>
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider text-center">Trạng Thái</th>
                                            <th className="py-4 px-6 text-[12px] font-black text-slate-400 uppercase tracking-wider text-right">Chi Tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center text-slate-500 font-bold">Đang tải dữ liệu...</td>
                                            </tr>
                                        ) : tickets.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center text-slate-500 font-bold">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <FileText size={32} className="text-slate-300" />
                                                        Bạn chưa có yêu cầu bảo hành hoặc đổi trả nào.
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : tickets.map((ticket, idx) => {
                                            const isWarranty = ticket._ticketType === 'WARRANTY';
                                            const isCompleted = ['Đã hoàn tất', 'Đã hoàn tiền', 'Đã khắc phục', 'Đóng'].includes(ticket.TrangThai);
                                            
                                            return (
                                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <span className="font-bold text-slate-800 text-[13px] bg-slate-100 px-2.5 py-1 rounded-lg">
                                                            {isWarranty ? ticket.MaBaoHanh : ticket.MaDoiTra}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isWarranty ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            {isWarranty ? <Wrench size={14} /> : <RefreshCcw size={14} />}
                                                            {isWarranty ? 'Bảo hành' : ticket.LoaiYeuCau}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 max-w-[200px]">
                                                        <div className="font-bold text-slate-800 text-[13px] truncate">
                                                            {isWarranty ? ticket.SanPham : 'Đơn hàng liên quan'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={ticket.LyDo || ticket.NoiDungLoi}>
                                                            {ticket.LyDo || ticket.NoiDungLoi}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-[13px] font-bold text-slate-500">
                                                        {new Date(ticket.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-flex px-3 py-1.5 rounded-full text-[11px] font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {ticket.TrangThai}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button 
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                                        >
                                                            Xem xử lý
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedTicket && (
                <CustomerTicketDetailModal 
                    ticket={selectedTicket} 
                    onClose={() => setSelectedTicket(null)} 
                />
            )}
        </>
    );
}
