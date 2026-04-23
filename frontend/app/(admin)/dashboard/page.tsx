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
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 6 }}>
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
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{item.name}:</span>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
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
        <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={40} />
        <p style={{ color: 'var(--text-secondary)' }}>Đang tổng hợp dữ liệu thời gian thực...</p>
      </div>
    );
  }

  if (!stats) return <div>Lỗi tải dữ liệu.</div>;

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <KPICard data={stats.kpi.totalRevenue} color="cyan" icon={Activity} />
        <KPICard data={stats.kpi.totalProduction} color="purple" icon={Package} />
        <KPICard data={stats.kpi.customerCount} color="emerald" icon={Users} />
        <KPICard data={stats.kpi.avgOrderValue} color="amber" icon={BarChart3} />
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Doanh thu Thực tế vs Kế hoạch</h3>
              <p className="section-subtitle">Đơn vị: Triệu VNĐ — Dữ liệu thời gian thực</p>
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
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="revenuePlan" name="Kế hoạch" stroke="#6366f1" fill="url(#gradPlan)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenueActual" name="Thực tế" stroke="#2563eb" fill="url(#gradActual)" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Chart */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Sản lượng Thực tế vs Kế hoạch</h3>
              <p className="section-subtitle">Đơn vị: kg — Dữ liệu thời gian thực</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
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
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Top Khách hàng theo Sản lượng thực</h3>
            <p className="section-subtitle">Dựa trên đơn hàng & hợp đồng đã ký kết</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Calendar size={14} /> Tuần này
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Filter size={14} /> Bộ lọc
            </button>
            <a
              href="http://localhost:5000/api/export/targets/excel"
              className="btn btn-sm"
              style={{
                flex: 1,
                background: 'var(--accent-emerald)',
                color: 'white',
                border: 'none',
                marginLeft: '8px'
              }}
            >
              <FileSpreadsheet size={16} /> Xuất Excel
            </a>
          </div>
        </div>
        <table className="data-table">
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
                  <td style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td>{c.segment}</td>
                  <td style={{ fontWeight: 600 }}>{c.volume.toLocaleString('vi-VN')}</td>
                  <td style={{ fontWeight: 500 }}>{c.revenue.toLocaleString('vi-VN')}</td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct >= 90 ? 'linear-gradient(90deg, var(--accent-emerald), #34d399)' :
                            pct >= 70 ? 'linear-gradient(90deg, var(--accent-amber), #fbbf24)' :
                              'linear-gradient(90deg, var(--accent-rose), #fb7185)'
                        }} />
                      </div>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, minWidth: 38 }}>{pct}%</span>
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
