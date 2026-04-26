'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Users, Package, TrendingUp, Activity, FileSpreadsheet, TrendingDown,
  Calendar, Filter, Loader2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

function KPICard({ data, color, icon: Icon }: {
  data: { value: number; unit: string; change: number; label: string };
  color: string;
  icon: React.ElementType;
}) {
  const isPositive = data.change >= 0;
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-icon"><Icon size={22} /></div>
      <div className="kpi-label">{data.label}</div>
      <div className="kpi-value">
        {data.value.toLocaleString('vi-VN')}
        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>
          {data.unit}
        </span>
      </div>
      <div className={`kpi-trend ${isPositive ? 'up' : 'down'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? '+' : ''}{data.change}% vs cùng kỳ
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '12px 16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{label}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
          <span style={{ fontSize: '0.875rem', color: '#475569' }}>{item.name}:</span>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            {item.value?.toLocaleString('vi-VN')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 className="animate-spin text-[#2563eb]" size={40} />
        <p style={{ color: '#475569' }}>Đang tổng hợp dữ liệu thời gian thực...</p>
      </div>
    );
  }

  if (!stats) return <div>Lỗi tải dữ liệu.</div>;

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <KPICard data={stats.kpi.totalRevenue} color="cyan" icon={Activity} />
        <KPICard data={stats.kpi.totalProduction} color="purple" icon={Package} />
        <KPICard data={stats.kpi.customerCount} color="emerald" icon={Users} />
        <KPICard data={stats.kpi.avgOrderValue} color="amber" icon={BarChart3} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '2.25rem' }}>
        {/* Revenue Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Doanh thu Thực tế vs Kế hoạch</h3>
              <p className="text-sm text-slate-400 mt-1">Đơn vị: Triệu VNĐ — Dữ liệu thời gian thực</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.monthlyTrends}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="revenuePlan" name="Kế hoạch" stroke="#6366f1" fill="url(#gradPlan)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenueActual" name="Thực tế" stroke="#2563eb" fill="url(#gradActual)" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sản lượng Thực tế vs Kế hoạch</h3>
              <p className="text-sm text-slate-400 mt-1">Đơn vị: kg — Dữ liệu thời gian thực</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="prodActual" name="Thực tế" fill="#2563eb" radius={[4, 4, 0, 0]} opacity={0.9} />
                <Line type="monotone" dataKey="prodPlan" name="Kế hoạch" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} strokeDasharray="6 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Top Khách hàng theo Sản lượng thực</h3>
            <p className="text-sm text-slate-400 mt-1">Dựa trên đơn hàng & hợp đồng đã ký kết</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs" style={{ flex: 1 }}>
              <Calendar size={14} /> Tuần này
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs" style={{ flex: 1 }}>
              <Filter size={14} /> Bộ lọc
            </button>
            <a
              href="http://localhost:5000/api/export/targets/excel"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs"
              style={{
                flex: 1,
                background: '#059669',
                color: 'white',
                border: 'none',
                marginLeft: '8px'
              }}
            >
              <FileSpreadsheet size={16} /> Xuất Excel
            </a>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Khách hàng</th>
              <th>Phân khúc</th>
              <th>Sản lượng (kg)</th>
              <th>Doanh thu (VNĐ)</th>
              <th>Tiến độ Target</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {stats.topCustomers.map((c: any, i: number) => {
              const pct = Math.round((c.volume / (c.target || 2500)) * 100);
              return (
                <tr key={c.name}>
                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                  <td>{c.segment}</td>
                  <td style={{ fontWeight: 600 }}>{c.volume.toLocaleString('vi-VN')}</td>
                  <td style={{ fontWeight: 500 }}>{c.revenue.toLocaleString('vi-VN')}</td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ flex: 1 }}>
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct >= 90 ? 'linear-gradient(90deg, #059669, #34d399)' :
                            pct >= 70 ? 'linear-gradient(90deg, #d97706, #fbbf24)' :
                              'linear-gradient(90deg, #e11d48, #fb7185)'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 38 }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${pct >= 90 ? 'approved' : pct >= 70 ? 'pending' : 'rejected'}`}>
                      {pct >= 90 ? 'On Track' : pct >= 70 ? 'Warning' : 'Risk'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {stats.topCustomers.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Chưa có dữ liệu giao dịch thực tế.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
