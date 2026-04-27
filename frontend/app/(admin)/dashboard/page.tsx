'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Users, Package, TrendingUp, Activity, FileSpreadsheet,
  Calendar, Filter, Loader2, DollarSign, Target, ChevronRight
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-xl shadow-slate-200/50">
      <div className="text-[13px] font-black text-slate-900 mb-2 uppercase tracking-wider">{label}</div>
      <div className="space-y-1.5">
        {payload.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[13px] font-medium text-slate-500">{item.name}:</span>
            <span className="text-[14px] font-black text-slate-900">
              {item.value?.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse tracking-wide">Đang tổng hợp dữ liệu thời gian thực...</p>
      </div>
    );
  }

  if (!stats) return <div className="text-center py-20 text-rose-500 font-black">Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối API.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section with Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <Activity size={22} />
             </div>
             Báo cáo Tổng quan
          </h1>
          <p className="text-slate-400 font-medium mt-1">Hệ thống phân tích dữ liệu kinh doanh & sản xuất theo thời gian thực</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={18} /> Tháng này
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            <Target size={18} /> Đặt mục tiêu
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doanh thu tổng</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.kpi.totalRevenue.value.toLocaleString('vi-VN')}
                <span className="text-sm font-bold text-slate-400 ml-1">TR.Đ</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[13px] font-bold">
            <span className="bg-emerald-50 px-2 py-0.5 rounded-lg">+{stats.kpi.totalRevenue.change}%</span>
            <span className="text-slate-400">vs cùng kỳ</span>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sản lượng SX</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.kpi.totalProduction.value.toLocaleString('vi-VN')}
                <span className="text-sm font-bold text-slate-400 ml-1">KG</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[13px] font-bold">
            <span className="bg-emerald-50 px-2 py-0.5 rounded-lg">+{stats.kpi.totalProduction.change}%</span>
            <span className="text-slate-400">vượt kế hoạch</span>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khách hàng mới</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.kpi.customerCount.value}
                <span className="text-sm font-bold text-slate-400 ml-1">ĐƠN VỊ</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-rose-500 text-[13px] font-bold">
            <span className="bg-rose-50 px-2 py-0.5 rounded-lg">{stats.kpi.customerCount.change}%</span>
            <span className="text-slate-400">Cần đẩy mạnh</span>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giá trị đơn TB</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.kpi.avgOrderValue.value.toLocaleString('vi-VN')}
                <span className="text-sm font-bold text-slate-400 ml-1">Đ</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[13px] font-bold">
            <span className="bg-emerald-50 px-2 py-0.5 rounded-lg">+12.4%</span>
            <span className="text-slate-400">Tăng trưởng</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Doanh thu Thực tế vs Kế hoạch</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Đơn vị: Triệu VNĐ</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-bold">
                  <Activity size={14} /> Real-time
               </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer>
              <AreaChart data={stats.monthlyTrends}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Legend wrapperStyle={{paddingTop: 30, fontSize: 12, fontWeight: 700}} iconType="circle" />
                <Area type="monotone" dataKey="revenuePlan" name="Kế hoạch" stroke="#CBD5E1" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="revenueActual" name="Thực tế" stroke="#2563eb" strokeWidth={4} fill="url(#gradActual)" dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Sản lượng Thực tế vs Kế hoạch</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Đơn vị: Kilogram (KG)</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer>
              <ComposedChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{paddingTop: 30, fontSize: 12, fontWeight: 700}} iconType="rect" />
                <Bar dataKey="prodActual" name="Sản lượng thực" fill="#8b5cf6" radius={[12, 12, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="prodPlan" name="Mục tiêu" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 3, stroke: '#fff' }} strokeDasharray="8 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Top Khách hàng trọng tâm</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Dựa trên sản lượng và doanh số tích lũy tháng hiện tại</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
              <Filter size={18} />
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all">
              <FileSpreadsheet size={18} /> Xuất Báo cáo
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="w-16">Rank</th>
                <th>Khách hàng / Doanh nghiệp</th>
                <th>Phân khúc</th>
                <th className="text-right">Sản lượng (kg)</th>
                <th className="text-right">Doanh thu (VNĐ)</th>
                <th className="w-64">Tiến độ Target</th>
                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCustomers.map((c: any, i: number) => {
                const pct = Math.round((c.volume / (c.target || 2500)) * 100);
                return (
                  <tr key={c.name} className="hover:bg-slate-50/50 group">
                    <td>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                        i === 0 ? 'bg-amber-100 text-amber-600' : 
                        i === 1 ? 'bg-slate-100 text-slate-500' : 
                        i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</div>
                    </td>
                    <td>
                      <span className="text-[12px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">{c.segment}</span>
                    </td>
                    <td className="text-right font-black text-slate-700">{c.volume.toLocaleString('vi-VN')}</td>
                    <td className="text-right font-black text-emerald-600">{c.revenue.toLocaleString('vi-VN')}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-black text-slate-400 w-10">{pct}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`status-badge ${
                        pct >= 90 ? 'status-active' : pct >= 70 ? 'status-warning' : 'status-error'
                      }`}>
                        {pct >= 90 ? 'Vượt chỉ tiêu' : pct >= 70 ? 'Cần cố gắng' : 'Cảnh báo rủi ro'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50/30 text-center border-t border-slate-50">
           <button className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group">
             Xem chi tiết tất cả đối tác <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
}
