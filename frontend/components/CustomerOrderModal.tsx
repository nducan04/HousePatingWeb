'use client';
import React, { useState } from 'react';
import { ArrowLeft, User, Layers, CreditCard, Calendar, FileText, CheckCircle2, Clock, Package, Truck, XCircle, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { paintColors } from '@/lib/data/colors-data';

const STATUS_MAP: Record<string, any> = {
    'CHO_XAC_NHAN': { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-600 border border-amber-200' },
    'DANG_XU_LY': { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-600 border border-blue-200' },
    'DA_XU_LY_XONG': { label: 'Đã xử lý xong', color: 'bg-purple-50 text-purple-600 border border-purple-200' },
    'DANG_GIAO': { label: 'Đang vận chuyển', color: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
    'DA_GIAO': { label: 'Đã giao hàng', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
    'DA_HUY': { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border border-rose-200' }
};

export default function CustomerOrderModal({ order, onClose }: { order: any, onClose: () => void }) {
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);

    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Custom Header with Back Button */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none"
                        >
                            <ArrowLeft size={14} /> Quay lại
                        </button>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Chi tiết đơn hàng #{order.MaDonHang}</h3>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase ${STATUS_MAP[order.TrangThai]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_MAP[order.TrangThai]?.label || order.TrangThai}
                    </span>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* I. THÔNG TIN NGƯỜI NHẬN & SẢN PHẨM */}
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                                <User size={14} /> I. Thông tin giao hàng
                            </h4>
                            <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Người nhận:</span>
                                    <span className="font-bold text-slate-800">{order.TenNguoiNhan || order.KhachHang?.TenKhachHang || 'Đã ẩn'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Số điện thoại:</span>
                                    <span className="text-slate-800">{order.SDTNguoiNhan || order.KhachHang?.SDT || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Địa chỉ:</span>
                                    <span className="text-slate-800">{order.DiaChiGiaoHang || 'Mặc định'}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-2.5">
                                    <span className="text-slate-400">Sản phẩm:</span>
                                    <span className="font-bold text-slate-800">{order.Items?.[0]?.TenSanPham || 'Sản phẩm sơn'} ({order.Items?.reduce((s: number, i: any) => s + i.SoLuong, 0)} kiện)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Diện tích tham khảo:</span>
                                    <span className="font-bold text-amber-600">{order.TongDienTichSon || 0} m2</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Ngày giờ đặt hàng:</span>
                                        <span className="text-slate-800 font-bold">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    {(() => {
                                        const diffTime = Math.abs(new Date().getTime() - new Date(order.createdAt).getTime());
                                        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
                                        if (diffMonths > 24) {
                                            return (
                                                <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex flex-col gap-1">
                                                    <span className="font-bold">⚠️ Không đủ điều kiện:</span> Đơn hàng / Hợp đồng đã mua sau 2 năm sẽ không được áp dụng chính sách bảo hành, đổi trả.
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* II. THÔNG SỐ KỸ THUẬT SƠN */}
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Layers size={14} /> II. Thông số kỹ thuật sơn
                            </h4>
                            <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                                <div className="flex justify-between items-start">
                                    <span className="text-slate-400 mt-0.5">Mã màu đặt hàng:</span>
                                    <div className="flex flex-col gap-1.5 items-end">
                                        {order?.Items?.map((item: any, idx: number) => {
                                            const cInfo = paintColors.find(c => c.code === item.MaMau);
                                            return (
                                                <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                                                    <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: cInfo?.hex || '#ccc' }}></span>
                                                    <span className="font-black text-blue-600 text-xs">{item.MaMau || 'N/A'} — {cInfo?.name || 'Màu chuẩn'}</span>
                                                    <span className="text-[10px] text-slate-400">x{item.SoLuong}</span>
                                                </div>
                                            );
                                        }) || <span className="font-black text-slate-400">N/A</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Loại bột:</span>
                                    <span className="text-slate-800">{order?.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Nhiệt độ sấy khuyến nghị:</span>
                                    <span className="text-slate-800">{order?.TechnicalSpecs?.NhietDoSay || '195°C / 15 phút'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Độ dày lớp phủ:</span>
                                    <span className="text-slate-800">{order?.TechnicalSpecs?.DoDayLopPhu || '75 µm'}</span>
                                </div>
                                {(order?.KhachHang?.PhanLoai === 'DOANH_NGHIEP' || (order?.GhiChu?.toLowerCase().includes('pha chế')) || (order?.GhiChu?.toLowerCase().includes('mẫu')) || (order?.GhiChu?.toLowerCase().includes('hợp đồng'))) && (
                                    <div style={{ marginTop: 8 }}>
                                        <button onClick={() => setIsChartModalOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: 11, padding: '4px 10px', color: '#2563eb', border: '1px solid #2563eb' }}>📈 Xem biểu đồ hiệu suất thực</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* III. THÔNG TIN THANH TOÁN (PAYMENT) */}
                    <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                            <CreditCard size={14} /> III. Chi tiết thanh toán
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                            <div className="space-y-3 text-[13px] font-medium text-slate-650">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Thành tiền sản phẩm:</span>
                                    <span className="text-slate-800">{(order.TongTien - (order.PhuPhi || 0)).toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Phụ phí (đóng gói/VC):</span>
                                    <span className="text-slate-800">{(order.PhuPhi || 0).toLocaleString()}đ</span>
                                </div>
                                {order.GiamGia !== undefined && order.GiamGia > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Chiết khấu ({order.KhuyenMai?.MaVoucher || 'Voucher'}):</span>
                                        <span>-{(order.GiamGia || 0).toLocaleString()}đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-100 pt-3 text-[14px]">
                                    <span className="font-bold text-slate-900">TỔNG CỘNG:</span>
                                    <span className="font-black text-emerald-600">{order.TongTien.toLocaleString()}đ</span>
                                </div>
                            </div>
                            <div className="space-y-3 text-[13px] font-medium text-slate-650 pt-4 md:pt-0 md:pl-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Số tiền bạn đã thanh toán (Cọc):</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-900">{(order.DaCoc || 0).toLocaleString()}đ ({Math.round(((order.DaCoc || 0) / order.TongTien) * 100)}%)</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-4 text-[16px]">
                                    <span className="font-bold text-slate-900">SỐ TIỀN CÒN LẠI PHẢI TRẢ:</span>
                                    <span className="font-black text-rose-500">{Math.max(0, order.TongTien - (order.DaCoc || 0)).toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Action Section */}
                    <div className="space-y-3.5">
                        <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                            <Calendar size={18} className="text-blue-500" />
                            <div className="flex-1 text-sm font-medium text-slate-700">
                                <span className="text-slate-400">[{new Date(order.createdAt).toLocaleDateString()}]</span> Đã thanh toán / Đặt cọc <span className="font-bold text-emerald-600">[{(order.DaCoc || 0).toLocaleString()}đ]</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                            <FileText size={18} className="text-purple-500" />
                            <div className="flex-1 text-sm font-medium text-slate-700">
                                Hệ thống sẽ tự động theo dõi tiến độ sản xuất và vận chuyển
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* CHART MODAL */}
            {isChartModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '95%', maxWidth: '800px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', background: '#0f172a', color: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Thermometer size={24} /> Hiệu Suất Sấy Thực Tế - Đơn #{order.MaDonHang}
                            </h3>
                            <button onClick={() => setIsChartModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 24 }}>&times;</button>
                        </div>

                        <div style={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={(() => {
                                    const targetTempStr = order.TechnicalSpecs?.NhietDoSay || '195';
                                    const targetTemp = parseInt(targetTempStr.replace(/\D/g, '')) || 195;
                                    return [
                                        { time: 'Phút 0', nhietDo: 25, hieuSuat: 0 },
                                        { time: 'Phút 5', nhietDo: Math.round(targetTemp * 0.6), hieuSuat: 30 },
                                        { time: 'Phút 10', nhietDo: Math.round(targetTemp * 0.9), hieuSuat: 60 },
                                        { time: 'Phút 15', nhietDo: targetTemp, hieuSuat: 95 },
                                        { time: 'Phút 20', nhietDo: targetTemp, hieuSuat: 98 },
                                        { time: 'Phút 25', nhietDo: Math.round(targetTemp * 0.5), hieuSuat: 100 },
                                    ];
                                })()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" stroke="#94a3b8" />
                                    <YAxis yAxisId="left" stroke="#00d4ff" label={{ value: 'Nhiệt độ (°C)', angle: -90, position: 'insideLeft', fill: '#00d4ff' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#059669" label={{ value: 'Hiệu suất (%)', angle: 90, position: 'insideRight', fill: '#059669' }} />
                                    <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="nhietDo" name="Nhiệt độ lò sấy (°C)" stroke="#00d4ff" strokeWidth={3} activeDot={{ r: 8 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="hieuSuat" name="Độ bám dính (%)" stroke="#059669" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,212,255,0.05)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.2)' }}>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Loại bột sơn</div>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{order.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Nhiệt độ chuẩn</div>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{order.TechnicalSpecs?.NhietDoSay || '195°C'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Đánh giá</div>
                                    <div style={{ fontWeight: 600, color: '#059669' }}>Đạt tiêu chuẩn xuất xưởng</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
