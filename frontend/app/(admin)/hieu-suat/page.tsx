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
    const getAvatarUrl = (path: string) => {
        if (!path || path === 'undefined' || path === 'null') return '';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const origin = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000';
        return `${origin}${cleanPath}`;
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
            </div>

            {/* ═══ HIGHLIGHT HIGHLIGHTS (Top Cards) ═══ */}
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

            {/* ═══ CHARTS SECTION (Bar & Radar) ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
                {/* Bar Chart: Top 5 Sales */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 400 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BarChart3 size={18} color="#2563eb" /> BIỂU ĐỒ DOANH SỐ THEO NHÂN VIÊN (TOP 5)
                        <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Đơn vị: Triệu VNĐ)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={topSalesData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#475569', fontSize: 12 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11 }} 
                            />
                            <Tooltip 
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                {topSalesData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Radar Chart: Skills & Attitude */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '24px', height: 400 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Radar size={18} color="#7c3aed" /> BIỂU ĐỒ RADAR: KỸ NĂNG & THÁI ĐỘ
                        <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Dựa trên phản hồi khách hàng)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.radar}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <RadarArea
                                name="Điểm đánh giá"
                                dataKey="A"
                                stroke="#2563eb"
                                fill="#2563eb"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ═══ KPI DETAILS TABLE ═══ */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>CHI TIẾT CHỈ SỐ KPI VÀ HIỆU SUẤT</h3>
                    <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={14} /> Xuất báo cáo
                    </button>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left text-sm" style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px 24px' }}>Nhân viên</th>
                                <th style={{ textAlign: 'left' }}>Bộ phận</th>
                                <th style={{ textAlign: 'center' }}>Đơn hàng hoàn tất</th>
                                <th style={{ textAlign: 'right' }}>Doanh thu mang về</th>
                                <th style={{ textAlign: 'center' }}>Tỷ lệ hài lòng</th>
                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map((staff: any) => (
                                <tr key={staff.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                {staff.avatar ? (
                                                    <img 
                                                        src={getAvatarUrl(staff.avatar)} 
                                                        alt="avatar" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                parent.innerText = staff.name.split(' ').slice(-1)[0][0];
                                                            }
                                                        }}
                                                    />
                                                ) : staff.name.split(' ').slice(-1)[0][0]}
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{staff.name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#475569', textTransform: 'none' }}>
                                            {staff.dept}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                                        {['Sale / MKT', 'Kinh doanh', 'CSKH Bảo Hành', 'Kế Toán'].includes(staff.dept) 
                                            ? staff.orders 
                                            : (['R&D Kỹ Thuật Máy', 'Kỹ thuật'].includes(staff.dept) ? staff.tests : staff.deliveries)} 
                                        {staff.dept === 'Kho / Logistics' ? ' Chuyến' : (['R&D Kỹ Thuật Máy', 'Kỹ thuật'].includes(staff.dept) ? ' Lô mẻ' : ' Đơn')}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: staff.revenue > 0 ? '#059669' : '#94a3b8' }}>
                                        {staff.revenue > 0 ? staff.revenue.toLocaleString() + ' ₫' : '—'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, maxWidth: 60, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                                <div style={{ width: `${staff.satisfaction}%`, height: '100%', background: staff.satisfaction >= 90 ? '#059669' : '#d97706', borderRadius: 2 }}></div>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{staff.satisfaction}%</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                        <span className={`badge ${staff.level === 'Excellent' ? 'approved' : staff.level === 'Good' ? 'testing' : 'rejected'}`} style={{ fontSize: 10 }}>
                                            {staff.level === 'Excellent' ? 'Xuất sắc' : staff.level === 'Good' ? 'Đạt Target' : 'Cần cố gắng'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
