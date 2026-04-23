'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Users, Package, AlertTriangle, TrendingUp, Filter, CheckCircle2,
  Calendar, Info, ArrowUpRight, ArrowDownRight, Activity, Zap, FileSpreadsheet, TrendingDown
} from 'lucide-react';
import { monthlyData, topCustomers, kpiSummary } from '@/lib/data/dashboard-data';

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
  const [activeChart, setActiveChart] = useState<'revenue' | 'production'>('revenue');

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <KPICard data={kpiSummary.totalRevenue} color="cyan" icon={Activity} />
        <KPICard data={kpiSummary.totalProduction} color="purple" icon={Package} />
        <KPICard data={kpiSummary.customerCount} color="emerald" icon={Users} />
        <KPICard data={kpiSummary.avgOrderValue} color="amber" icon={BarChart3} />
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Doanh thu Thực tế vs Kế hoạch</h3>
              <p className="section-subtitle">Đơn vị: Triệu VNĐ — Năm 2024</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyData}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="revenuePlan" name="Kế hoạch" stroke="#8b5cf6" fill="url(#gradPlan)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenueActual" name="Thực tế" stroke="#00d4ff" fill="url(#gradActual)" strokeWidth={2.5} dot={{ r: 3, fill: '#00d4ff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Chart */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Sản lượng Thực tế vs Kế hoạch</h3>
              <p className="section-subtitle">Đơn vị: kg — Năm 2024</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="prodActual" name="Thực tế" fill="#00d4ff" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Line type="monotone" dataKey="prodPlan" name="Kế hoạch" stroke="#ff9f43" strokeWidth={2.5} dot={{ r: 3, fill: '#ff9f43' }} strokeDasharray="6 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Top Khách hàng theo Sản lượng</h3>
            <p className="section-subtitle">Tiến độ đạt Target của Hãng — 2024</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button className="btn btn-outline btn-sm bg-white" style={{ flex: 1 }}>
              <Calendar size={14} /> Tuần này
            </button>
            <button className="btn btn-outline btn-sm bg-white" style={{ flex: 1 }}>
              <Filter size={14} /> Bộ lọc
            </button>
            <a
              href="http://localhost:5000/api/export/targets/excel"
              className="btn btn-sm"
              style={{
                flex: 1,
                background: 'var(--accent-green)',
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
              <th>Target (kg)</th>
              <th>Tiến độ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => {
              const pct = Math.round((c.volume / c.target) * 100);
              return (
                <tr key={c.name}>
                  <td style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td>{c.segment}</td>
                  <td style={{ fontWeight: 600 }}>{c.volume.toLocaleString('vi-VN')}</td>
                  <td>{c.target.toLocaleString('vi-VN')}</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
