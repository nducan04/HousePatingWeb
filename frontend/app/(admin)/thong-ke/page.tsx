'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, PieChart as PieIcon, Activity, TrendingUp,
  Award, Loader2, Download, RefreshCw, Palette, Users, Rocket, Trophy
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const COLORS = ['#00d4ff', '#8b5cf6', '#34d399', '#fbbf24', '#fb7185', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '12px 16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '13px' }}>{label || payload[0]?.name}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill || item.color }} />
          <span style={{ fontSize: '12px', color: '#475569' }}>{item.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {item.value?.toLocaleString('vi-VN')} {item.unit || ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ThongKePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/detailed-stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching detailed stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 className="animate-spin text-[#2563eb]" size={40} />
        <p style={{ color: '#475569' }}>Đang tính toán ma trận thống kê...</p>
      </div>
    );
  }

  if (!data) return <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2rem', textAlign: 'center' }}>Không có dữ liệu thống kê.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>📊 Phân Tích Dữ Liệu Chuyên Sâu</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Hệ thống báo cáo thông minh VTSC PaintPro — Cập nhật 1 phút trước</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchStats} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px solid #e2e8f0' }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs">
            <Download size={14} /> Xuất Báo Cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doanh thu theo Loại sơn */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} /> Doanh Thu theo Danh Mục (VNĐ)
            </h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar name="Doanh Thu" dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                  {data.revenueByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieIcon size={18} /> Cấu Trúc Trạng Thái Đơn Hàng
            </h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.orderStatusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.orderStatusDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Colors Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={18} /> Top 10 Mã Màu Được Ưa Chuộng Nhất
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Theo lượt chọn trong Đơn hàng & Hợp đồng</span>
        </div>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={data.topColors} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#0f172a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Lượt chọn" radius={[0, 4, 4, 0]} barSize={20}>
                {data.topColors.map((entry: any, index: number) => (
                  <Cell key={`cell-color-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* R&D Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 20, color: '#7c3aed' }}>Quy trình R&D Tracking</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.rdStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="_id"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {data.rdStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 20, color: '#d97706' }}>Thống kê Hợp đồng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.contractStats.map((s: any, i: number) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>{s._id}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{s.count} HĐ</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{
                    width: `${Math.min((s.count / (data.contractStats.reduce((acc: any, curr: any) => acc + curr.count, 0) || 1)) * 100, 100)}%`,
                    background: COLORS[i % COLORS.length]
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 20, color: '#e11d48' }}>Chỉ số Tăng trưởng Sản lượng</h3>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Activity size={48} color="#e11d48" style={{ marginBottom: 16, opacity: 0.5 }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>+12.4%</div>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Tăng trưởng so với cùng kỳ tháng trước</p>
            <div style={{ marginTop: 24, padding: '8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '11px', color: '#059669' }}>
              🎯 Đã đạt 85% kế hoạch năm
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color="#d97706" /> Bảng Xếp Hạng Hiệu Suất Kinh Doanh (Kỳ này)
          </h3>
          <div style={{ padding: '4px 12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 20, color: '#059669', fontSize: '11px', fontWeight: 600 }}>
            <Rocket size={10} style={{ marginRight: 4 }} /> Đang dẫn đầu: {data.topSalesStaff?.[0]?.hoTen || 'N/A'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gap: 32 }}>
          {/* Chart */}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.topSalesStaff}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hoTen" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="Doanh Thu" dataKey="revenue" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={35}>
                  {data.topSalesStaff?.map((entry: any, index: number) => (
                    <Cell key={`cell-staff-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div>
            <table className="w-full text-left text-sm" style={{ background: 'transparent' }}>
              <thead>
                <tr style={{ fontSize: '10px' }}>
                  <th>Nhân Viên</th>
                  <th style={{ textAlign: 'right' }}>Số Đơn</th>
                  <th style={{ textAlign: 'right' }}>Tổng Doanh Số</th>
                </tr>
              </thead>
              <tbody>
                {data.topSalesStaff?.map((s: any, i: number) => (
                  <tr key={i} style={{ fontSize: '12px' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: i === 0 ? '#d97706' : '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px', fontWeight: 800, color: i === 0 ? '#000' : '#0f172a'
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.hoTen}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{s.maNV} • {s.boPhan}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.count}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {s.revenue.toLocaleString()}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#d97706" /> Top 5 Sản Phẩm Bán Chạy Nhất (Kỳ này)
          </h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ fontSize: '11px' }}>
              <th>Mã SP</th>
              <th>Tên Dòng Sơn</th>
              <th style={{ textAlign: 'right' }}>Lượt chọn</th>
              <th style={{ textAlign: 'right' }}>Sản Lượng (kg)</th>
              <th style={{ textAlign: 'right' }}>Doanh Thu (VNĐ)</th>
              <th>Xu hướng</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((p: any, i: number) => (
              <tr key={i} style={{ fontSize: '12px' }}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{p.sku}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706' }}>{p.popularity || 0}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.sold.toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>{p.revenue.toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                    <TrendingUp size={14} /> <span style={{ fontSize: '10px' }}>Hot</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
