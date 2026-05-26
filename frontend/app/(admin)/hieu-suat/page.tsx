'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Calendar, Users, Target, Award, SignalHigh, 
    TrendingUp, Star, AlertCircle, ChevronRight, User, Briefcase, 
    CheckCircle, BarChart3, Radar, Download
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarArea,
    Cell
} from 'recharts';

// Mock data based on user diagram
const TOP_SALES_DATA = [
    { name: 'An', value: 1200, color: '#2563eb' },
    { name: 'Bình', value: 950, color: '#7c3aed' },
    { name: 'Chi', value: 780, color: '#d97706' },
    { name: 'Dũng', value: 520, color: '#e11d48' },
    { name: 'Em', value: 340, color: '#059669' },
];

const SKILLS_DATA = [
    { subject: 'Kỹ thuật', A: 110, fullMark: 150 },
    { subject: 'Doanh số', A: 130, fullMark: 150 },
    { subject: 'Kỷ luật', A: 90, fullMark: 150 },
    { subject: 'Thái độ', A: 140, fullMark: 150 },
];

const KPI_DETAILS = [
    { id: 1, name: 'Nguyễn Văn A', dept: 'Kinh doanh', completed: 45, revenue: 1200000000, satisfaction: 98, level: 'Excellent' },
    { id: 2, name: 'Lê Thị B', dept: 'Kỹ thuật', completed: 38, revenue: 0, unit: 'Mẻ sơn', satisfaction: 95, level: 'Good' },
    { id: 3, name: 'Trần Văn C', dept: 'Vận chuyển', completed: 120, revenue: 0, unit: 'Chuyến', satisfaction: 92, level: 'Good' },
    { id: 4, name: 'Phạm Minh D', dept: 'Kinh doanh', completed: 30, revenue: 850000000, satisfaction: 88, level: 'Average' },
    { id: 5, name: 'Hoàng Văn E', dept: 'Kỹ thuật', completed: 25, revenue: 0, unit: 'Mẻ sơn', satisfaction: 85, level: 'Average' },
];

const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'staff', label: 'Nhân sự', icon: Users },
    { id: 'performance', label: 'Hiệu suất', icon: SignalHigh },
    { id: 'rewards', label: 'Khen thưởng', icon: Award },
];

import api from '@/lib/utils/axiosAuth';

// Chart colors for top sales
const CHART_COLORS = ['#2563eb', '#7c3aed', '#d97706', '#e11d48', '#059669'];

export default function PerformanceDashboard() {
    const [activeTab, setActiveTab] = useState('performance');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('Tất cả bộ phận');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const getAvatarUrl = (path: any) => {
        let resolvedPath = path;
        if (Array.isArray(path)) {
            resolvedPath = path[0];
        }
        if (!resolvedPath || typeof resolvedPath !== 'string' || resolvedPath === 'undefined' || resolvedPath === 'null') return '';
        if (resolvedPath.startsWith('http')) return resolvedPath;
        if (resolvedPath.startsWith("Qm") || resolvedPath.startsWith("bafy")) {
            return `https://gateway.pinata.cloud/ipfs/${resolvedPath}`;
        }
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
        return `${backendUrl}${cleanPath}`;
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/hieu-suat/stats');
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#475569' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" style={{ marginBottom: 16 }}></div>
                    <p>Đang tổng hợp dữ liệu hiệu suất thời gian thực...</p>
                </div>
            </div>
        );
    }

    const liveStaff = stats?.staff || [];
    const summary = stats?.summary || { totalRevenue: 0, bestStaff: null, errorRate: 0 };
    const charts = stats?.charts || { topSales: [], radar: [] };

    const filteredStaff = liveStaff.filter((s: any) => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedDept === 'Tất cả bộ phận' || s.dept === selectedDept)
    );

    const top3Staff = [...liveStaff]
        .sort((a: any, b: any) => (b.revenue + (b.deliveries || 0) * 1000000 + (b.tests || 0) * 500000) - (a.revenue + (a.deliveries || 0) * 1000000 + (a.tests || 0) * 500000))
        .slice(0, 3);

    // Prepare chart data with colors
    const topSalesData = charts.topSales.map((item: any, idx: number) => ({
        ...item,
        color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    return (
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
            
            {/* ═══ TOP NAVIGATION TABS ═══ */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: '1.125rem' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 8,
                            border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                            color: activeTab === tab.id ? '#2563eb' : '#475569',
                            fontWeight: activeTab === tab.id ? 700 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && <div style={{ height: 2, width: '100%', background: '#2563eb', position: 'absolute', bottom: -12, left: 0 }}></div>}
                    </button>
                ))}
            </div>

            {/* ═══ HEADER & FILTERS ═══ */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.125rem' }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: 1, color: '#0f172a' }}>
                        PHÂN TÍCH HIỆU SUẤT NHÂN VIÊN — <span style={{ color: '#2563eb' }}>QUÝ II/2026</span>
                    </h2>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Dữ liệu cập nhật thời gian thực từ hệ thống VTSC PaintPro</p>
                </div>
                
                {activeTab === 'staff' && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="relative" style={{ width: 250 }}>
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input 
                                type="text" 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                                placeholder="Tìm tên nhân viên..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0' }}>
                            <Calendar size={16} /> <span>Chọn kỳ báo cáo</span>
                        </div>

                        <select 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                            style={{ background: 'transparent', minWidth: 160 }}
                        >
                            <option>Tất cả bộ phận</option>
                            <option>Kinh doanh</option>
                            <option>Kỹ thuật</option>
                            <option>Vận chuyển</option>
                        </select>
                    </div>
                )}
            </div>

            {/* TAB CONTENT: OVERVIEW (TỔNG QUAN) */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
                    {/* KPI Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
                        {/* Outstanding Employee Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #d97706' }}>
                            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                                <Award size={120} color="#d97706" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #e11d48)', padding: 2 }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {summary.bestStaff?.avatar ? (
                                            <img 
                                                src={getAvatarUrl(summary.bestStaff.avatar)} 
                                                alt="best" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `<span style="font-size: 24px; font-weight: 800; color: #d97706">${summary.bestStaff.name.split(' ').slice(-1)[0][0]}</span>`;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <User size={32} color="#d97706" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>NV Xuất Sắc Tháng</div>
                                    <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.bestStaff?.name || 'N/A'}</div>
                                    <div style={{ fontSize: 13, color: '#475569' }}>Bộ phận: <span style={{ color: '#0f172a' }}>{summary.bestStaff?.dept || 'N/A'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '4px solid #2563eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                <SignalHigh size={16} /> Tổng doanh số nhân sự
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{(summary.totalRevenue || 0).toLocaleString()} ₫</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669' }}>
                                <TrendingUp size={14} /> <span>Dựa trên đơn hàng hoàn tất</span>
                            </div>
                        </div>

                        {/* Paint Error Rate Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', borderLeft: '4px solid #e11d48' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e11d48', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                                <AlertCircle size={16} /> Tỷ lệ lỗi sơn trung bình
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 900 }}>{summary.errorRate}%</span>
                                <span style={{ fontSize: 13, color: '#94a3b8' }}>Mức an toàn: &lt; 2.0%</span>
                            </div>
                            <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginTop: 12, overflow: 'hidden' }}>
                                <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #059669, #e11d48)' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 400 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <BarChart3 size={18} color="#2563eb" /> BIỂU ĐỒ DOANH SỐ THEO NHÂN VIÊN (TOP 5)
                                <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Đơn vị: Triệu VNĐ)</span>
                            </h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={topSalesData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                        {topSalesData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 400 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Radar size={18} color="#7c3aed" /> BIỂU ĐỒ RADAR: KỸ NĂNG & THÁI ĐỘ
                                <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Dựa trên đánh giá chung)</span>
                            </h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.radar}>
                                    <PolarGrid stroke="rgba(0,0,0,0.08)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <RadarArea name="Điểm đánh giá" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PERFORMANCE (HIỆU SUẤT ĐỒ THỊ CHI TIẾT) */}
            {activeTab === 'performance' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 450 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <BarChart3 size={18} color="#2563eb" /> BIỂU ĐỒ DOANH SỐ THEO NHÂN VIÊN (TOP 5)
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Đơn vị: Triệu VNĐ)</span>
                        </h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={topSalesData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {topSalesData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 450 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Radar size={18} color="#7c3aed" /> BIỂU ĐỒ RADAR: KỸ NĂNG & THÁI ĐỘ
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Dựa trên đánh giá chung)</span>
                        </h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.radar}>
                                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <RadarArea name="Điểm đánh giá" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: STAFF (DANH SÁCH NHÂN SỰ & KPI BẢNG BIỂU) */}
            {activeTab === 'staff' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden">
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>CHI TIẾT CHỈ SỐ KPI VÀ HIỆU SUẤT</h3>
                        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Download size={14} /> Xuất báo cáo
                        </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table className="w-full text-left text-sm" style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600, color: '#475569' }}>Nhân viên</th>
                                    <th style={{ textAlign: 'left', fontWeight: 600, color: '#475569', padding: '16px 12px' }}>Bộ phận</th>
                                    <th style={{ textAlign: 'center', fontWeight: 600, color: '#475569', padding: '16px 12px' }}>Công việc hoàn tất</th>
                                    <th style={{ textAlign: 'right', fontWeight: 600, color: '#475569', padding: '16px 12px' }}>Doanh thu mang về</th>
                                    <th style={{ textAlign: 'center', fontWeight: 600, color: '#475569', padding: '16px 12px' }}>Tỷ lệ hài lòng</th>
                                    <th style={{ textAlign: 'right', paddingRight: '24px', fontWeight: 600, color: '#475569', padding: '16px 12px' }}>Đánh giá</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontStyle: 'italic' }}>
                                            Không tìm thấy nhân viên phù hợp.
                                        </td>
                                    </tr>
                                ) : filteredStaff.map((s: any) => {
                                    const completedWorkText = s.dept === 'Kinh doanh' || s.dept === 'Sale / MKT'
                                        ? `${s.orders || 0} đơn hàng`
                                        : s.dept === 'Kỹ thuật'
                                            ? `${s.tests || 0} mẫu test`
                                            : s.dept === 'Vận chuyển'
                                                ? `${s.deliveries || 0} chuyến`
                                                : `${s.customers || 0} ticket`;

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                        {s.avatar ? (
                                                            <img 
                                                                src={getAvatarUrl(s.avatar)} 
                                                                alt={s.name} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const parent = target.parentElement;
                                                                    if (parent) {
                                                                        parent.innerHTML = `<span style="font-size: 16px; font-weight: 700; color: #475569">${s.name.split(' ').slice(-1)[0][0]}</span>`;
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>
                                                                {s.name.split(' ').slice(-1)[0][0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.role || 'Nhân viên'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px', color: '#475569', fontWeight: 500 }}>
                                                {s.dept}
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                                                {completedWorkText}
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                                                {s.revenue ? `${s.revenue.toLocaleString()} ₫` : '—'}
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.satisfaction}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px', textAlign: 'right', paddingRight: '24px' }}>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    s.level === 'Excellent' 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                        : s.level === 'Good' 
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                    {s.level === 'Excellent' ? 'Xuất sắc' : s.level === 'Good' ? 'Tốt' : 'Khá'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: REWARDS (KHEN THƯỞNG) */}
            {activeTab === 'rewards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8" style={{ textAlign: 'center' }}>
                        <Award size={48} className="text-amber-500 mx-auto mb-4 animate-bounce" />
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>BẢNG VÀNG VINH DANH NHÂN SỰ XUẤT SẮC</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Khen thưởng dựa trên tổng điểm hiệu suất kinh doanh, kỹ thuật và vận chuyển tháng này</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', alignItems: 'end' }}>
                        {/* Hạng 2: Bạc */}
                        {top3Staff[1] && (
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 text-center order-2 md:order-1" style={{ borderTop: '6px solid #94a3b8' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>Hạng Nhì (Huy chương Bạc)</div>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px solid #94a3b8', overflow: 'hidden' }}>
                                    {top3Staff[1].avatar ? (
                                        <img src={getAvatarUrl(top3Staff[1].avatar)} alt="Silver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8' }}>{top3Staff[1].name.split(' ').slice(-1)[0][0]}</span>
                                    )}
                                </div>
                                <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px 0' }}>{top3Staff[1].name}</h4>
                                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>{top3Staff[1].dept} — {top3Staff[1].role}</p>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Điểm KPI</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#475569' }}>{top3Staff[1].satisfaction}</div>
                                </div>
                            </div>
                        )}

                        {/* Hạng 1: Vàng */}
                        {top3Staff[0] && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-8 text-center order-1 md:order-2" style={{ borderTop: '8px solid #eab308', transform: 'scale(1.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: '#eab308', textTransform: 'uppercase', marginBottom: 12 }}>Vô Địch (Huy chương Vàng)</div>
                                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '4px solid #eab308', position: 'relative', overflow: 'hidden' }}>
                                    {top3Staff[0].avatar ? (
                                        <img src={getAvatarUrl(top3Staff[0].avatar)} alt="Gold" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: 36, fontWeight: 800, color: '#eab308' }}>{top3Staff[0].name.split(' ').slice(-1)[0][0]}</span>
                                    )}
                                </div>
                                <h4 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>{top3Staff[0].name}</h4>
                                <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px 0', fontWeight: 500 }}>{top3Staff[0].dept} — {top3Staff[0].role}</p>
                                <div style={{ background: '#fefcbf', padding: '16px', borderRadius: '16px', display: 'inline-block', border: '1px solid #fef08a' }}>
                                    <div style={{ fontSize: 11, color: '#ca8a04', textTransform: 'uppercase', fontWeight: 800 }}>Tổng Điểm Hiệu Suất</div>
                                    <div style={{ fontSize: 24, fontWeight: 950, color: '#854d0e' }}>{top3Staff[0].satisfaction}</div>
                                </div>
                            </div>
                        )}

                        {/* Hạng 3: Đồng */}
                        {top3Staff[2] && (
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 text-center order-3" style={{ borderTop: '6px solid #b45309' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: 12 }}>Hạng Ba (Huy chương Đồng)</div>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px solid #b45309', overflow: 'hidden' }}>
                                    {top3Staff[2].avatar ? (
                                        <img src={getAvatarUrl(top3Staff[2].avatar)} alt="Bronze" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: 28, fontWeight: 800, color: '#b45309' }}>{top3Staff[2].name.split(' ').slice(-1)[0][0]}</span>
                                    )}
                                </div>
                                <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px 0' }}>{top3Staff[2].name}</h4>
                                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>{top3Staff[2].dept} — {top3Staff[2].role}</p>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Điểm KPI</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#b45309' }}>{top3Staff[2].satisfaction}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ FOOTER INFO ═══ */}
            <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingBottom: 20 }}>
                Báo cáo tổng hợp bởi <strong>VTSC PaintPro Performance Engine</strong>. Bản quyền thuộc về © 2026.
            </div>

            <style jsx>{`
                .glass-card {
                    background: #ffffff;
                    backdrop-filter: blur(16px);
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .glass-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -10px rgba(0,0,0,0.4);
                }
                .data-table thead th {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #94a3b8;
                    border-bottom: 2px solid #e2e8f0;
                    padding: 12px;
                }
                .btn-ghost:hover {
                    background: rgba(255,255,255,0.05);
                }
                .search-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    color: #94a3b8;
                }
                .search-box input {
                    padding-left: 36px;
                }
            `}</style>
        </div>
    );
}
