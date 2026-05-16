'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart
} from 'recharts';
import {
  DollarSign, Package, TestTube, Users, Download, Loader2,
  TrendingUp, AlertTriangle, Boxes, Factory, ClipboardCheck,
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, History, Activity
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { exportDashboardToExcel } from '@/lib/utils/excelExport';

// Formatting utilities
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function StatisticsDashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const periods = [
    ...Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}/2026`),
    ...Array.from({ length: currentQuarter }, (_, i) => `Quý ${i + 1}/2026`),
    'Năm 2026'
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(`Tháng ${currentMonth}/2026`);
  const [activeTab, setActiveTab] = useState('SALES');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const query = `?period=${encodeURIComponent(selectedPeriod)}`;
      const [statsRes, detailedRes, inventoryRes, productionRes] = await Promise.all([
        api.get(`/dashboard/stats${query}`),
        api.get(`/dashboard/detailed-stats${query}`),
        api.get(`/dashboard/inventory-stats${query}`),
        api.get(`/dashboard/production-stats${query}`)
      ]);

      setData({
        sales: statsRes.data?.success ? statsRes.data.data : null,
        detailed: detailedRes.data?.success ? detailedRes.data.data : null,
        inventory: inventoryRes.data?.success ? inventoryRes.data.data : null,
        production: productionRes.data?.success ? productionRes.data.data : null
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-slate-50/50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <TrendingUp size={24} className="text-blue-600" />
          </div>
        </div>
        <p className="text-slate-500 font-bold animate-pulse">Đang đồng bộ hóa ma trận dữ liệu...</p>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-slate-500">Không thể kết nối đến máy chủ dữ liệu.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Layers size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Điều hành Số VTSC</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Hệ thống phân tích dữ liệu chuyên sâu thời gian thực</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
            {['SALES', 'INVENTORY', 'PRODUCTION'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {tab === 'SALES' ? 'Kinh doanh' : tab === 'INVENTORY' ? 'Kho vận' : 'Sản xuất & R&D'}
              </button>
            ))}
          </div>
          <select
            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={() => exportDashboardToExcel(data, selectedPeriod)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Download size={18} /> Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {activeTab === 'SALES' && <SalesDashboard data={data} />}
      {activeTab === 'INVENTORY' && <InventoryDashboard data={data} />}
      {activeTab === 'PRODUCTION' && <ProductionDashboard data={data} />}
    </div>
  );
}

// --- Sub-Components for Tabs ---

function SalesDashboard({ data }: { data: any }) {
  const kpi = data.sales?.kpi || {};
  const trends = data.sales?.monthlyTrends || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Tổng Doanh thu"
          value={`${kpi.totalRevenue?.value || 0} ${kpi.totalRevenue?.unit || ''}`}
          trend={kpi.totalRevenue?.change || 0}
          icon={<DollarSign />}
          color="blue"
        />
        <KpiCard
          title="Tổng Sản lượng"
          value={`${formatNumber(kpi.totalProduction?.value || 0)} ${kpi.totalProduction?.unit || ''}`}
          trend={kpi.totalProduction?.change || 0}
          icon={<Package />}
          color="emerald"
        />
        <KpiCard
          title="Khách hàng"
          value={kpi.customerCount?.value || 0}
          trend={kpi.customerCount?.change || 0}
          icon={<Users />}
          color="orange"
        />
        <KpiCard
          title="Giá trị Trung bình"
          value={`${kpi.avgOrderValue?.value || 0} ${kpi.avgOrderValue?.unit || ''}`}
          trend={kpi.avgOrderValue?.change || 0}
          icon={<TrendingUp />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Xu hướng Doanh thu vs Kế hoạch
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Thực tế (Tr VNĐ)" dataKey="revenueActual" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                <Line name="Kế hoạch (Tr VNĐ)" type="monotone" dataKey="revenuePlan" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="text-emerald-600" size={20} /> Cơ cấu Doanh thu Sản phẩm
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.detailed?.revenueByCategory || []}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="_id"
                >
                  {data.detailed?.revenueByCategory?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryDashboard({ data }: { data: any }) {
  const inv = data.inventory?.summary || {};
  const catDist = data.inventory?.categoryDist || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Tổng SKUs" value={inv.totalSKUs || 0} icon={<Boxes />} color="blue" />
        <KpiCard title="Giá trị Tồn kho" value={formatCurrency(inv.totalStockValue || 0)} icon={<DollarSign />} color="emerald" />
        <KpiCard title="Tổng Khối lượng" value={`${formatNumber(inv.totalKg || 0)} kg`} icon={<Package />} color="orange" />
        <KpiCard
          title="Cảnh báo Tồn thấp"
          value={inv.lowStockItems || 0}
          icon={<AlertTriangle />}
          color="rose"
          isAlert={inv.lowStockItems > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6">Phân bổ Tồn kho theo Danh mục</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="totalStock" name="Số lượng (kg)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <History size={20} className="text-slate-400" /> Biến động Kho gần đây
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-50">
                  <th className="pb-3 px-2">Ngày</th>
                  <th className="pb-3">Mã phiếu</th>
                  <th className="pb-3">Loại</th>
                  <th className="pb-3 text-right">NV Thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.inventory?.recentMovements?.map((m: any) => (
                  <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 text-slate-500 font-medium">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-bold text-slate-900">{m.MaPhieu}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.LoaiPhieu === 'NHAP' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {m.LoaiPhieu === 'NHAP' ? 'Nhập' : 'Xuất'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">{m.NhanVien?.HoTen || 'Hệ thống'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionDashboard({ data }: { data: any }) {
  const prod = data.production || {};

  // Transform R&D for Radar
  const radarData = prod.rdPerformance?.map((p: any) => ({
    subject: p._id,
    A: p.count,
    fullMark: Math.max(...prod.rdPerformance.map((x: any) => x.count)) + 5
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Hiệu suất Sản xuất" value={`${prod.efficiency || 0}%`} icon={<Factory />} color="blue" />
        <KpiCard title="Dự án R&D" value={radarData.reduce((s: any, c: any) => s + c.A, 0)} icon={<TestTube />} color="purple" />
        <KpiCard title="Tỷ lệ Đạt mẫu" value={`${prod.rdSuccessRate || 0}%`} icon={<ClipboardCheck />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6">Sản lượng Sản xuất (Tấn)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prod.productionTrends?.map((t: any) => ({ name: `T${t._id.month}`, kg: t.totalKg }))}>
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="kg" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-lg font-black text-slate-900 mb-6 w-full">Phân bổ Trạng thái R&D</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                <Radar name="Dự án" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper UI Components ---

function KpiCard({ title, value, trend, icon, color, isAlert }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border ${isAlert ? 'border-rose-200 animate-pulse' : 'border-slate-100'} hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colorMap[color]} flex items-center justify-center`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
            }`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

function PieChartIcon({ className, size }: any) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
