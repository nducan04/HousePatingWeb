'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart
} from 'recharts';
import {
  DollarSign, Package, TestTube, Users, Download, Loader2,
  TrendingUp, AlertTriangle, Boxes, Factory, ClipboardCheck,
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, History, Activity,
  CheckCircle, Clock, Smile, FileText, Scale, ShieldCheck, Copy
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { exportDashboardToExcel, exportBusinessReportExcel, exportInventoryReportExcel, exportProductionReportExcel, exportCustomerServiceReportExcel, exportHrLegalReportExcel } from '@/lib/utils/excelExport';

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
      const [statsRes, detailedRes, inventoryRes, productionRes, csRes, hrRes] = await Promise.all([
        api.get(`/dashboard/stats${query}`),
        api.get(`/dashboard/detailed-stats${query}`),
        api.get(`/dashboard/inventory-stats${query}`),
        api.get(`/dashboard/production-stats${query}`),
        api.get(`/dashboard/customer-service-stats${query}`),
        api.get(`/dashboard/hr-legal-stats${query}`)
      ]);

      setData({
        sales: statsRes.data?.success ? statsRes.data.data : null,
        detailed: detailedRes.data?.success ? detailedRes.data.data : null,
        inventory: inventoryRes.data?.success ? inventoryRes.data.data : null,
        production: productionRes.data?.success ? productionRes.data.data : null,
        customerService: csRes.data?.success ? csRes.data.data : null,
        hrLegal: hrRes.data?.success ? hrRes.data.data : null
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (activeTab === 'SALES') {
        const res = await api.get(`/dashboard/business-report?period=${encodeURIComponent(selectedPeriod)}`);
        if (res.data?.success) {
          await exportBusinessReportExcel(data.sales, res.data.data, selectedPeriod);
        }
      } else if (activeTab === 'INVENTORY') {
        const res = await api.get(`/dashboard/inventory-report`);
        if (res.data?.success) {
          await exportInventoryReportExcel(data, res.data.data, selectedPeriod);
        }
      } else if (activeTab === 'PRODUCTION') {
        const res = await api.get(`/dashboard/production-report?period=${encodeURIComponent(selectedPeriod)}`);
        if (res.data?.success) {
          await exportProductionReportExcel(data.production, res.data.data, selectedPeriod);
        }
      } else if (activeTab === 'CUSTOMER_SERVICE') {
        const res = await api.get(`/dashboard/customer-service-report?period=${encodeURIComponent(selectedPeriod)}`);
        if (res.data?.success) {
          await exportCustomerServiceReportExcel(data.customerService, res.data.data, selectedPeriod);
        }
      } else if (activeTab === 'HR_LEGAL') {
        const res = await api.get(`/dashboard/hr-legal-report?period=${encodeURIComponent(selectedPeriod)}`);
        if (res.data?.success) {
          await exportHrLegalReportExcel(data.hrLegal, res.data.data, selectedPeriod);
        }
      } else {
        await exportDashboardToExcel(
          data.sales,
          data.detailed?.staffRanking || [],
          data.detailed?.topCustomers || [],
          selectedPeriod
        );
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
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
            {['SALES', 'INVENTORY', 'PRODUCTION', 'CUSTOMER_SERVICE', 'HR_LEGAL'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {tab === 'SALES' ? 'Kinh doanh' : tab === 'INVENTORY' ? 'Kho vận' : tab === 'PRODUCTION' ? 'Sản xuất & R&D' : tab === 'CUSTOMER_SERVICE' ? 'Hậu mãi & CSKH' : 'Nhân sự & Pháp lý'}
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
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 ${isExporting ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Đang xử lý...' : 'Xuất Báo Cáo'}
          </button>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {activeTab === 'SALES' && <SalesDashboard data={data} />}
      {activeTab === 'INVENTORY' && <InventoryDashboard data={data} />}
      {activeTab === 'PRODUCTION' && <ProductionDashboard data={data} />}
      {activeTab === 'CUSTOMER_SERVICE' && <CustomerServiceDashboard data={data} />}
      {activeTab === 'HR_LEGAL' && <HrLegalDashboard data={data} />}
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
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} width={140} tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }} />
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

  // Transform R&D for Radar safely
  const maxRdCount = prod.rdPerformance && prod.rdPerformance.length > 0
    ? Math.max(...prod.rdPerformance.map((x: any) => x.count || 0))
    : 0;
  const radarData = prod.rdPerformance?.map((p: any) => ({
    subject: p._id || 'Khác',
    A: p.count || 0,
    fullMark: maxRdCount + 5
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
              <AreaChart data={prod.productionTrends?.map((t: any) => ({ name: t.month, kg: t.totalKg }))}>
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

function CustomerServiceDashboard({ data }: { data: any }) {
  const csData = data.customerService || {};
  const kpi = csData.kpi || {
    totalReturns: 0,
    successRate: 0,
    avgResponseTime: 0,
    csatScore: 0
  };

  const supportTrends = csData.supportTrends || [];
  const pendingComplaints = csData.pendingComplaints || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Tổng ca bảo hành/đổi trả" value={kpi.totalReturns} icon={<AlertTriangle />} color="rose" />
        <KpiCard title="Tỷ lệ xử lý thành công" value={`${kpi.successRate}%`} icon={<CheckCircle />} color="emerald" />
        <KpiCard title="Thời gian phản hồi TB" value={`${kpi.avgResponseTime}h`} icon={<Clock />} color="blue" />
        <KpiCard title="Điểm hài lòng (CSAT)" value={`${kpi.csatScore}/5`} icon={<Smile />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Xu hướng yêu cầu hỗ trợ theo tuần
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={supportTrends}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="tickets" name="Số lượng yêu cầu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={20} /> Khiếu nại chưa xử lý
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-50">
                  <th className="pb-3 px-2">Mã vé</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingComplaints.length > 0 ? pendingComplaints.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900">{c.id}</td>
                    <td className="py-3 text-slate-600 font-medium">{c.customer}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-600">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs font-medium">Không có khiếu nại nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function HrLegalDashboard({ data }: { data: any }) {
  const hrData = data.hrLegal || {};
  const kpi = hrData.kpi || {
    totalStaff: 0,
    expiringContracts: 0,
    onTimeRate: 0,
    activeLegalCases: 0
  };

  const hrTrends = hrData.hrTrends || [];
  const expiringContractsList = hrData.expiringContractsList || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Tổng số nhân sự" value={kpi.totalStaff} icon={<Users />} color="blue" />
        <KpiCard title="Hợp đồng sắp hết hạn" value={kpi.expiringContracts} icon={<FileText />} color="orange" isAlert={kpi.expiringContracts > 0} />
        <KpiCard title="Tỷ lệ đi làm đúng giờ" value={`${kpi.onTimeRate}%`} icon={<Clock />} color="emerald" />
        <KpiCard title="Vụ việc pháp lý" value={kpi.activeLegalCases} icon={<Scale />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="text-blue-600" size={20} /> Biến động nhân sự theo tháng
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Tuyển mới" dataKey="newHires" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Nghỉ việc" dataKey="resignations" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[380px] flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={20} /> Giao dịch HĐ nguyên tắc On-chain
          </h3>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-50 sticky top-0 bg-white z-10">
                  <th className="pb-3 px-2">Mã HĐ</th>
                  <th className="pb-3">Đối tác</th>
                  <th className="pb-3">TxHash</th>
                  <th className="pb-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { id: 'VTSC-B2B-001', partner: 'Cơ khí An Phú', txHash: '0x1A2b...3c4d', status: 'verified' },
                  { id: 'VTSC-B2B-002', partner: 'Xây dựng Hòa Bình', txHash: '0x8F9e...1a2b', status: 'verified' },
                  { id: 'VTSC-B2B-003', partner: 'Nội thất Minh Khang', txHash: '0x4C5d...6e7f', status: 'pending' },
                  { id: 'VTSC-B2B-004', partner: 'Sắt thép Việt Tín', txHash: '0x9B8a...7c6d', status: 'verified' },
                  { id: 'VTSC-B2B-005', partner: 'Khu công nghiệp VSIP', txHash: '0x3D2c...5b4a', status: 'pending' },
                ].map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900">{c.id}</td>
                    <td className="py-3 text-slate-600 font-medium">{c.partner}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50/50 w-max px-2 py-1 rounded-md">
                        {c.txHash}
                        <Copy size={14} className="cursor-pointer hover:text-blue-800 transition-colors" />
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      {c.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle size={14} /> Đã xác minh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600">
                          <Clock size={14} /> Chờ ký số
                        </span>
                      )}
                    </td>
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
