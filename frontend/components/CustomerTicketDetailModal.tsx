'use client';
import React from 'react';
import { XCircle, Wrench, RefreshCcw, ShieldAlert, Calendar, User, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function CustomerTicketDetailModal({ ticket, onClose }: { ticket: any, onClose: () => void }) {
    if (!ticket) return null;

    const isWarranty = ticket._ticketType === 'WARRANTY';
    const isCompleted = ['Đã hoàn tất', 'Đã hoàn tiền', 'Đã khắc phục', 'Đóng'].includes(ticket.TrangThai);
    const title = isWarranty ? `Chi tiết Bảo hành - ${ticket.MaBaoHanh}` : `Chi tiết ${ticket.LoaiYeuCau} - ${ticket.MaDoiTra}`;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWarranty ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            {isWarranty ? <Wrench size={20} /> : <RefreshCcw size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">{title}</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1">Ngày tạo: {new Date(ticket.createdAt || Date.now()).toLocaleString('vi-VN')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto space-y-6 bg-slate-50 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Chi tiết yêu cầu của khách hàng */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                                <User size={16} className="text-blue-500" /> 1. Yêu cầu của bạn
                            </h4>
                            <div className="space-y-3 text-[13px]">
                                {isWarranty && (
                                    <>
                                        <div>
                                            <span className="text-slate-400 font-medium block mb-0.5">Sản phẩm áp dụng:</span>
                                            <span className="font-bold text-slate-800">{ticket.SanPham || 'Sản phẩm sơn tĩnh điện'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-medium block mb-0.5">Ngày mua hàng:</span>
                                            <span className="font-bold text-slate-800">{ticket.NgayMua ? new Date(ticket.NgayMua).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                        </div>
                                    </>
                                )}
                                {!isWarranty && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Loại yêu cầu:</span>
                                        <span className="font-bold text-slate-800">{ticket.LoaiYeuCau}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400 font-medium block mb-0.5">Nội dung / Lý do:</span>
                                    <div className="font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                                        {ticket.NoiDungLoi || ticket.LyDo || 'Không có mô tả chi tiết.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chi tiết xử lý của hệ thống */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                                <ShieldAlert size={16} className="text-emerald-500" /> 2. Hệ thống xử lý
                            </h4>
                            <div className="space-y-3 text-[13px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium">Trạng thái:</span>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {ticket.TrangThai}
                                    </span>
                                </div>
                                {ticket.KyThuatKCS && (
                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                        <span className="text-slate-400 font-medium">Kỹ thuật viên phụ trách:</span>
                                        <span className="font-bold text-slate-800">{ticket.KyThuatKCS.HoTen || ticket.KyThuatKCS.name || 'Admin'}</span>
                                    </div>
                                )}
                                {ticket.NhanVienPhuTrach && (
                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                        <span className="text-slate-400 font-medium">CSKH phụ trách:</span>
                                        <span className="font-bold text-slate-800">{ticket.NhanVienPhuTrach.HoTen || ticket.NhanVienPhuTrach.name || 'Admin'}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-50 pt-2">
                                    <span className="text-slate-400 font-medium block mb-1">Phương án giải quyết:</span>
                                    {ticket.PhuongAnGiaiQuyet ? (
                                        <div className="font-bold text-blue-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100 leading-relaxed">
                                            {ticket.PhuongAnGiaiQuyet}
                                        </div>
                                    ) : (
                                        <div className="font-medium text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            Hệ thống đang tiếp nhận và sẽ phản hồi sớm nhất...
                                        </div>
                                    )}
                                </div>
                                
                                {isWarranty && ticket.HanBaoHanh && (
                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                        <span className="text-slate-400 font-medium">Hạn bảo hành / Xử lý:</span>
                                        <span className="font-bold text-slate-800 flex items-center gap-1"><Calendar size={14} /> {new Date(ticket.HanBaoHanh).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                {!isWarranty && ticket.DuKienDenHang && (
                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                        <span className="text-slate-400 font-medium">Dự kiến hoàn thành đổi trả:</span>
                                        <span className="font-bold text-slate-800 flex items-center gap-1"><Calendar size={14} /> {new Date(ticket.DuKienDenHang).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                {!isWarranty && ticket.GiaTriTru !== undefined && (
                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                                        <span className="text-slate-400 font-medium">Chi phí phát sinh / Khấu trừ:</span>
                                        <span className="font-black text-rose-500">{ticket.GiaTriTru.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 flex justify-end bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors bg-white border border-slate-200 cursor-pointer shadow-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
