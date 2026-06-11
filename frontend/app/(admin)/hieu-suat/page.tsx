'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Users, Target, Award, SignalHigh,
    TrendingUp, Star, AlertCircle, ChevronRight, User, Briefcase,
    CheckCircle, BarChart3, Radar as RadarIcon, Download, TrendingDown, Truck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LabelList,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import * as XLSX from 'xlsx';
import api from '@/lib/utils/axiosAuth';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'staff', label: 'Nhân sự', icon: Users },
    { id: 'performance', label: 'Hiệu suất', icon: SignalHigh },
];

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function PerformanceDashboard() {
    const [activeTab, setActiveTab] = useState('performance');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('Tất cả bộ phận');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const getAvatarUrl = (path: any) => resolveImageUrl(path);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/performance/stats');
                if (res.data.success) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error('Error fetching performance stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 font-light">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p>Đang đồng bộ dữ liệu hiệu suất...</p>
            </div>
        );
    }

    const liveStaff = stats?.staff || [];
    const summary = stats?.summary || { totalRevenue: 0, bestStaff: null, errorRate: 0, passRate: 0 };
    const charts = stats?.charts || { topSales: [], mixingStats: [], radar: [] };

    const filteredStaff = liveStaff.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedDept === 'Tất cả bộ phận' || s.dept === selectedDept)
    );

    const top3Staff = [...liveStaff]
        .sort((a, b) => (b.revenue + (b.deliveries || 0) * 1000000 + (b.tests || 0) * 500000) - (a.revenue + (a.deliveries || 0) * 1000000 + (a.tests || 0) * 500000))
        .slice(0, 3);

    const topSalesData = charts.topSales.map((item: any, idx: number) => ({
        ...item,
        color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    const exportToExcel = () => {
        if (!liveStaff || liveStaff.length === 0) return;

        // Chuẩn bị dữ liệu để xuất
        const exportData = liveStaff.map((staff: any) => ({
            'Mã Nhân Viên': staff.maNV || staff.id,
            'Họ Tên': staff.name,
            'Bộ Phận': staff.dept,
            'Chức Vụ': staff.role,
            'Doanh Số (VNĐ)': staff.revenue,
            'Số Đơn Hàng': staff.orders,
            'Số Chuyến Vận Chuyển': staff.deliveries,
            'Số Mẫu Test R&D': staff.tests,
            'Số Yêu Cầu CSKH': staff.customers,
            'Điểm KPI': staff.satisfaction,
            'Đánh Giá': staff.level === 'Excellent' ? 'Xuất sắc' : (staff.level === 'Good' ? 'Tốt' : (staff.level === 'Average' ? 'Đạt' : 'Chưa đạt'))
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hiệu Suất Nhân Sự");

        // Tự động điều chỉnh độ rộng cột
        const colWidths = [
            { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
            { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 12 }
        ];
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Bao_Cao_Hieu_Suat_VTSC_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="p-6 md:p-8 flex flex-col gap-8 bg-slate-50/30 min-h-screen">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-light tracking-wide text-slate-800">
                        Phân Tích Hiệu Suất <span className="font-medium text-blue-600">Quý II/2026</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-light mt-1">Dữ liệu được cập nhật theo thời gian thực từ VTSC PaintPro</p>
                </div>
                <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm font-light"
                >
                    <Download size={16} />
                    Xuất Báo Cáo
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm transition-all relative whitespace-nowrap font-light ${activeTab === tab.id
                                ? 'text-blue-600 font-medium'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? "text-blue-600" : "text-slate-400"} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: OVERVIEW (TỔNG QUAN) */}
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Outstanding Employee Card */}
                        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                <Award size={140} />
                            </div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[2px] shadow-sm">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        {summary.bestStaff?.avatar ? (
                                            <img src={getAvatarUrl(summary.bestStaff.avatar)} alt="best" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-amber-500" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-amber-500 tracking-wider uppercase mb-1">Nhân viên xuất sắc</div>
                                    <div className="text-xl font-medium text-slate-800">{summary.bestStaff?.name || 'N/A'}</div>
                                    <div className="text-xs text-slate-500 font-light">{summary.bestStaff?.dept || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[10px] font-semibold text-blue-500 tracking-wider uppercase flex items-center gap-1.5">
                                        <SignalHigh size={14} /> Doanh số công ty
                                    </div>
                                </div>
                                <div className="text-3xl font-light text-slate-800 tracking-tight">
                                    {(summary.totalRevenue || 0).toLocaleString()} <span className="text-lg text-slate-400">₫</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-light mt-3 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                                    <TrendingUp size={12} /> Đang tăng trưởng tốt
                                </div>
                            </div>
                        </div>

                        {/* Paint Error Rate Card */}
                        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="text-[10px] font-semibold text-rose-500 tracking-wider uppercase flex items-center gap-1.5 mb-4">
                                <AlertCircle size={14} /> Hiệu suất pha chế (R&D)
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-light text-slate-800">{summary.passRate}%</div>
                                    <div className="text-xs text-emerald-500 font-light mt-1 flex items-center gap-1"><CheckCircle size={12} /> Tỷ lệ đạt</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-light text-rose-500">{summary.errorRate}%</div>
                                    <div className="text-xs text-rose-400 font-light mt-1 flex items-center justify-end gap-1"><TrendingDown size={12} /> Tỷ lệ lỗi</div>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden flex">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${summary.passRate}%` }}></div>
                                <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${summary.errorRate}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-[400px]">
                            <div className="flex flex-col mb-6">
                                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-blue-500" /> Doanh Số Kinh Doanh
                                </h3>
                                <span className="text-xs text-slate-400 font-light mt-1">Top 5 nhân viên kinh doanh (Triệu VNĐ)</span>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topSalesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 300 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 300 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 300 }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} fontWeight={500} formatter={(v: any) => `${v}tr`} />
                                        {topSalesData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-[400px]">
                            <div className="flex flex-col mb-6">
                                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                    <Target size={16} className="text-rose-500" /> Chất Lượng Pha Chế
                                </h3>
                                <span className="text-xs text-slate-400 font-light mt-1">Phân tích kết quả test mẫu theo chuyên viên R&D</span>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={charts.mixingStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 300 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 300 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 300 }} />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 300, paddingTop: '10px' }} iconType="circle" iconSize={8} />
                                    <Bar dataKey="pass" name="Đạt Chuẩn (Pass)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32}>
                                        <LabelList dataKey="pass" position="top" fill="#10b981" fontSize={11} fontWeight={600} />
                                    </Bar>
                                    <Bar dataKey="fail" name="Lỗi (Fail)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32}>
                                        <LabelList dataKey="fail" position="top" fill="#f43f5e" fontSize={11} fontWeight={600} formatter={(v: any) => v > 0 ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PERFORMANCE (HIỆU SUẤT ĐỒ THỊ CHI TIẾT) */}
            {activeTab === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-[450px]">
                        <div className="flex flex-col mb-6">
                            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                <RadarIcon className="text-purple-500" size={16} /> Chỉ Số Năng Lực Cốt Lõi
                            </h3>
                            <span className="text-xs text-slate-400 font-light mt-1">Đánh giá các khía cạnh năng lực của phòng ban</span>
                        </div>
                        <ResponsiveContainer width="100%" height={360}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.radar || []}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 300 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Trung bình" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 300 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-[450px]">
                        <div className="flex flex-col mb-6">
                            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                <BarChart3 size={16} className="text-blue-500" /> Chi Tiết Doanh Số Kinh Doanh
                            </h3>
                            <span className="text-xs text-slate-400 font-light mt-1">Phân tích chuyên sâu top 5 nhân sự kinh doanh (Triệu VNĐ)</span>
                        </div>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={topSalesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 300 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 300 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 300 }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                                    <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} fontWeight={500} formatter={(v: any) => `${v}tr`} />
                                    {topSalesData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-[450px]">
                        <div className="flex flex-col mb-6">
                            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                <Target size={16} className="text-rose-500" /> Chi Tiết Chất Lượng Pha Chế
                            </h3>
                            <span className="text-xs text-slate-400 font-light mt-1">Phân tích kết quả kiểm định KCS R&D theo nhân sự</span>
                        </div>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={charts.mixingStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 300 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 300 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 300 }} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 300, paddingTop: '10px' }} iconType="circle" iconSize={8} />
                                <Bar dataKey="pass" name="Đạt Chuẩn (Pass)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36}>
                                    <LabelList dataKey="pass" position="top" fill="#10b981" fontSize={11} fontWeight={600} />
                                </Bar>
                                <Bar dataKey="fail" name="Lỗi (Fail)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={36}>
                                    <LabelList dataKey="fail" position="top" fill="#f43f5e" fontSize={11} fontWeight={600} formatter={(v: any) => v > 0 ? v : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STAFF (DANH SÁCH NHÂN SỰ & KPI BẢNG BIỂU) */}
            {activeTab === 'staff' && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-2">
                        <div className="relative w-full sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-white border border-slate-200/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-light shadow-sm"
                                placeholder="Tìm nhân viên..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="w-full sm:w-48 bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-light shadow-sm cursor-pointer"
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                        >
                            <option>Tất cả bộ phận</option>
                            <option>Kinh doanh</option>
                            <option>Kỹ thuật</option>
                            <option>Vận chuyển</option>
                            <option>Sale / MKT</option>
                        </select>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Nhân viên</th>
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Bộ phận</th>
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-center">Năng suất</th>
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Doanh thu</th>
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-center">Điểm KPI</th>
                                        <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Đánh giá</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-light">
                                                Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.
                                            </td>
                                        </tr>
                                    ) : filteredStaff.map((s: any) => {
                                        const isSale = s.dept === 'Kinh doanh' || s.dept === 'Sale / MKT';
                                        const isTech = s.dept === 'Kỹ thuật';
                                        const isLogistic = s.dept === 'Vận chuyển';

                                        const completedWorkText = isSale
                                            ? `${s.orders || 0} đơn hàng`
                                            : isTech
                                                ? `${s.tests || 0} mẫu test`
                                                : isLogistic
                                                    ? `${s.deliveries || 0} chuyến`
                                                    : `${s.customers || 0} yêu cầu`;

                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200/50">
                                                            {s.avatar ? (
                                                                <img
                                                                    src={getAvatarUrl(s.avatar)}
                                                                    alt={s.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const parent = target.parentElement;
                                                                        if (parent) {
                                                                            parent.innerHTML = `<span class="text-sm font-medium text-slate-500">${s.name.split(' ').slice(-1)[0][0]}</span>`;
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-medium text-slate-500">
                                                                    {s.name.split(' ').slice(-1)[0][0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-700">{s.name}</div>
                                                            <div className="text-[11px] text-slate-400 font-light mt-0.5">{s.role || 'Nhân viên'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-light">
                                                    <div className="flex items-center gap-1.5 text-[13px]">
                                                        {isTech ? <Target size={14} className="text-rose-400" /> : isSale ? <TrendingUp size={14} className="text-blue-400" /> : isLogistic ? <Truck size={14} className="text-amber-500" /> : <Briefcase size={14} className="text-slate-400" />}
                                                        {s.dept}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-light bg-slate-100 text-slate-600 border border-slate-200/50">
                                                        {completedWorkText}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-medium text-slate-700">
                                                        {s.revenue ? `${s.revenue.toLocaleString()} ₫` : <span className="text-slate-300 font-light">—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                                        <span className="font-medium text-slate-700">{s.satisfaction}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium tracking-wide border ${s.level === 'Excellent'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : s.level === 'Good'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                : s.level === 'Average'
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                        {s.level === 'Excellent' ? 'XUẤT SẮC' : s.level === 'Good' ? 'TỐT' : s.level === 'Average' ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: REWARDS (KHEN THƯỞNG) REMOVED AS PER REQUEST */}
        </div>
    );
}
