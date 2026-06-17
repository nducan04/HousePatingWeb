'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Users, Target, Award, SignalHigh,
    TrendingUp, Star, AlertCircle, ChevronRight, User, Briefcase,
    CheckCircle, BarChart3, Radar as RadarIcon, Download, TrendingDown, Truck, Activity
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
    { id: 'performance', label: 'Hiệu suất chi tiết', icon: Activity },
];

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b'];

export default function PerformanceDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
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
            <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50/50">
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    <Activity size={24} className="text-indigo-600 animate-pulse" />
                </div>
                <p className="mt-4 text-slate-500 font-medium tracking-wide">Đang đồng bộ dữ liệu hiệu suất...</p>
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

    const topSalesData = charts.topSales.map((item: any, idx: number) => ({
        ...item,
        color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    const exportToExcel = () => {
        if (!liveStaff || liveStaff.length === 0) return;

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

        const colWidths = [
            { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
            { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 12 }
        ];
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Bao_Cao_Hieu_Suat_VTSC_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="p-4 md:p-8 flex flex-col gap-8 bg-[#f8fafc] min-h-screen font-sans text-slate-800">
            {/* Beautiful Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/3"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-3">
                            <Activity size={14} /> Báo Cáo Nội Bộ
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Phân Tích Hiệu Suất <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Q2/2026</span>
                        </h2>
                        <p className="text-slate-500 font-medium mt-2">Theo dõi và đánh giá năng lực nhân sự theo thời gian thực</p>
                    </div>
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all shadow-sm"
                    >
                        <Download size={18} />
                        Xuất Báo Cáo
                    </button>
                </div>
            </div>

            {/* Premium Pill Tabs */}
            <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl gap-1">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* KPI Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Outstanding Employee Card */}
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-lg shadow-orange-500/20 p-1 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="bg-white/95 backdrop-blur-xl h-full rounded-[22px] p-6 relative overflow-hidden">
                                <div className="absolute -right-8 -top-8 text-amber-500/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                                    <Award size={160} />
                                </div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[3px] shadow-md relative">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                            {summary.bestStaff?.avatar ? (
                                                <img src={getAvatarUrl(summary.bestStaff.avatar)} alt="best" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={32} className="text-amber-500" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-sm">
                                            <Award size={18} className="text-amber-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-amber-600 tracking-wider uppercase mb-1">Cá Nhân Xuất Sắc</div>
                                        <div className="text-2xl font-bold text-slate-800">{summary.bestStaff?.name || 'N/A'}</div>
                                        <div className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                            <Briefcase size={14} /> {summary.bestStaff?.dept || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-lg shadow-indigo-500/20 p-1 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="bg-white/95 backdrop-blur-xl h-full rounded-[22px] p-6 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 text-indigo-500/5 group-hover:scale-110 transition-transform duration-700">
                                    <TrendingUp size={140} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                                            <SignalHigh size={16} /> Doanh Số Toàn Cty
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="text-4xl font-bold text-slate-900 tracking-tight">
                                            {(summary.totalRevenue || 0).toLocaleString()}
                                        </div>
                                        <div className="text-xl font-medium text-slate-400 mb-1">VNĐ</div>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold mt-4 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                        <TrendingUp size={16} /> Vượt 12% so với quý trước
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paint Error Rate Card */}
                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl shadow-lg shadow-rose-500/20 p-1 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="bg-white/95 backdrop-blur-xl h-full rounded-[22px] p-6 relative overflow-hidden flex flex-col justify-between">
                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-rose-600 tracking-wider uppercase flex items-center gap-1.5 mb-5">
                                        <Target size={16} /> Chỉ Số KCS Pha Chế
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-4xl font-bold text-slate-900">{summary.passRate}%</div>
                                            <div className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1.5"><CheckCircle size={16} /> Tỷ lệ đạt</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-rose-500">{summary.errorRate}%</div>
                                            <div className="text-sm font-semibold text-rose-500 mt-1 flex items-center justify-end gap-1.5"><AlertCircle size={16} /> Lỗi</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full mt-5 overflow-hidden flex shadow-inner">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${summary.passRate}%` }}></div>
                                        <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${summary.errorRate}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7">
                            <div className="flex flex-col mb-8">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BarChart3 size={20} /></div>
                                    Top Doanh Số
                                </h3>
                                <span className="text-sm text-slate-500 font-medium mt-1">5 nhân viên có doanh số cao nhất (Triệu VNĐ)</span>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={topSalesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc', rx: 10 }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                                        <LabelList dataKey="value" position="top" fill="#475569" fontSize={13} fontWeight={600} formatter={(v: any) => `${v}tr`} />
                                        {topSalesData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7">
                            <div className="flex flex-col mb-8">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><Target size={20} /></div>
                                    Chất Lượng Pha Chế
                                </h3>
                                <span className="text-sm text-slate-500 font-medium mt-1">Kết quả test mẫu R&D theo chuyên viên</span>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={charts.mixingStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc', rx: 10 }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '15px' }} iconType="circle" iconSize={10} />
                                    <Bar dataKey="pass" name="Đạt Chuẩn (Pass)" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={36}>
                                        <LabelList dataKey="pass" position="top" fill="#14b8a6" fontSize={12} fontWeight={700} />
                                    </Bar>
                                    <Bar dataKey="fail" name="Lỗi (Fail)" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={36}>
                                        <LabelList dataKey="fail" position="top" fill="#f43f5e" fontSize={12} fontWeight={700} formatter={(v: any) => v > 0 ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PERFORMANCE (HIỆU SUẤT ĐỒ THỊ CHI TIẾT) */}
            {activeTab === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7 h-[500px]">
                        <div className="flex flex-col mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-violet-50 rounded-lg text-violet-600"><RadarIcon size={20} /></div>
                                Năng Lực Cốt Lõi
                            </h3>
                            <span className="text-sm text-slate-500 font-medium mt-1">Đánh giá cân bằng các khía cạnh năng lực toàn diện</span>
                        </div>
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.radar || []}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Chỉ số trung bình" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 500 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7 h-[500px]">
                        <div className="flex flex-col mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BarChart3 size={20} /></div>
                                Doanh Thu Chi Tiết
                            </h3>
                            <span className="text-sm text-slate-500 font-medium mt-1">Theo dõi đóng góp của từng cá nhân vào mục tiêu</span>
                        </div>
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={topSalesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip cursor={{ fill: '#f8fafc', rx: 10 }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={52}>
                                    <LabelList dataKey="value" position="top" fill="#475569" fontSize={13} fontWeight={600} formatter={(v: any) => `${v}tr`} />
                                    {topSalesData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STAFF */}
            {activeTab === 'staff' && (
                <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="Tìm kiếm nhân sự..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="w-full sm:w-64 bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
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
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Hồ sơ Nhân viên</th>
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Phòng ban</th>
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Năng suất</th>
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Doanh thu</th>
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Điểm KPI</th>
                                        <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Đánh giá chung</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                        <Search size={24} className="text-slate-300" />
                                                    </div>
                                                    <p className="font-medium">Không tìm thấy nhân sự phù hợp.</p>
                                                </div>
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
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow-sm ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
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
                                                                            parent.innerHTML = `<span class="text-sm font-bold text-indigo-600">${s.name.split(' ').slice(-1)[0][0]}</span>`;
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-bold text-indigo-600">
                                                                    {s.name.split(' ').slice(-1)[0][0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800">{s.name}</div>
                                                            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.role || 'Nhân viên'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                                                        {isTech ? <Target size={16} className="text-rose-500" /> : isSale ? <TrendingUp size={16} className="text-blue-500" /> : isLogistic ? <Truck size={16} className="text-amber-500" /> : <Briefcase size={16} className="text-slate-400" />}
                                                        {s.dept}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-slate-700 shadow-sm border border-slate-200/60">
                                                        {completedWorkText}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-bold text-slate-800 text-base">
                                                        {s.revenue ? `${s.revenue.toLocaleString()} ₫` : <span className="text-slate-300 font-medium">—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg w-fit mx-auto border border-amber-100">
                                                        <Star size={16} className="text-amber-500 fill-amber-500" />
                                                        <span className="font-bold text-amber-700">{s.satisfaction}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${s.level === 'Excellent'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100/50'
                                                            : s.level === 'Good'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm shadow-blue-100/50'
                                                                : s.level === 'Average'
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100/50'
                                                                    : 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm shadow-rose-100/50'
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
        </div>
    );
}
