"use client";

import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  LineChart,
} from "recharts";
import {
  DollarSign,
  Package,
  TestTube,
  Users,
  Download,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Factory,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  History,
  Activity,
  CheckCircle,
  Clock,
  Smile,
  FileText,
  Scale,
  ShieldCheck,
  Copy,
  Crown,
  Ticket,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Trophy,
  Star,
  Box,
  Target,
  X,
  Calendar,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "@/lib/utils/notification";
import {
  exportDashboardToExcel,
  exportBusinessReportExcel,
  exportInventoryReportExcel,
  exportProductionReportExcel,
  exportCustomerServiceReportExcel,
  exportHrReportExcel,
  exportLegalReportExcel,
} from "@/lib/utils/excelExport";
import { resolveImageUrl } from "@/lib/utils/imageUrl";

// Formatting utilities
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

export default function StatisticsDashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const periods = [
    ...Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}/2026`),
    ...Array.from({ length: currentQuarter }, (_, i) => `Quý ${i + 1}/2026`),
    "Năm 2026",
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(
    `Tháng ${currentMonth}/2026`,
  );
  const [activeTab, setActiveTab] = useState("SALES");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // State for products filter in INVENTORY tab
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");

  const { user } = useAuthStore();
  const isAdminOrDirector = user?.role === "Admin" || user?.role === "Director";



  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const isWithinPeriod = (dateStr: string, period: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    if (period === "Năm 2026") return y === 2026;
    if (period.startsWith("Tháng")) {
      const match = period.match(/Tháng (\d+)\/(\d+)/);
      if (match)
        return m === parseInt(match[1], 10) && y === parseInt(match[2], 10);
    }
    if (period.startsWith("Quý")) {
      const match = period.match(/Quý (\d+)\/(\d+)/);
      if (match) {
        const q = parseInt(match[1], 10);
        const qYear = parseInt(match[2], 10);
        const expectedMonths = [
          (q - 1) * 3 + 1,
          (q - 1) * 3 + 2,
          (q - 1) * 3 + 3,
        ];
        return expectedMonths.includes(m) && y === qYear;
      }
    }
    return true;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const query = `?period=${encodeURIComponent(selectedPeriod)}`;
      const [
        statsRes,
        detailedRes,
        inventoryRes,
        productionRes,
        csRes,
        hrRes,
        productsRes,
        rdRes,
        contractsRes,
      ] = await Promise.all([
        api.get(`/dashboard/stats${query}`),
        api.get(`/dashboard/detailed-stats${query}`),
        api.get(`/dashboard/inventory-stats${query}`),
        api.get(`/dashboard/production-stats${query}`),
        api.get(`/dashboard/customer-service-stats${query}`),
        api.get(`/dashboard/hr-legal-stats${query}`),
        api.get("/san-pham-son"),
        api.get("/rd-tracking"),
        api.get("/contracts"),
      ]);

      const rawRdTracking = rdRes.data?.success ? rdRes.data.data : [];
      const rawContracts = contractsRes.data?.success
        ? contractsRes.data.data
        : [];

      const filteredRdTracking = rawRdTracking.filter((item: any) =>
        isWithinPeriod(item.createdAt || item.updatedAt, selectedPeriod),
      );
      const filteredContracts = rawContracts.filter((item: any) =>
        isWithinPeriod(item.createdAt || item.updatedAt, selectedPeriod),
      );

      setData({
        sales: statsRes.data?.success ? statsRes.data.data : null,
        detailed: detailedRes.data?.success ? detailedRes.data.data : null,
        inventory: inventoryRes.data?.success ? inventoryRes.data.data : null,
        production: productionRes.data?.success
          ? productionRes.data.data
          : null,
        customerService: csRes.data?.success ? csRes.data.data : null,
        hrLegal: hrRes.data?.success ? hrRes.data.data : null,
        rdTracking: filteredRdTracking,
        contracts: filteredContracts,
      });

      if (productsRes.data?.success) {
        setProducts(productsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (activeTab === "SALES") {
        const res = await api.get(
          `/dashboard/business-report?period=${encodeURIComponent(selectedPeriod)}`,
        );
        if (res.data?.success) {
          await exportBusinessReportExcel(
            data.sales,
            res.data.data,
            selectedPeriod,
          );
        }
      } else if (activeTab === "INVENTORY") {
        const res = await api.get(`/dashboard/inventory-report`);
        if (res.data?.success) {
          let filteredInventory = res.data.data;
          if (selectedProduct !== "ALL") {
            filteredInventory = res.data.data.filter((item: any) =>
              item.sku.startsWith(selectedProduct),
            );
          }
          await exportInventoryReportExcel(
            data,
            filteredInventory,
            selectedPeriod,
          );
        }
      } else if (activeTab === "PRODUCTION") {
        const rdLogs = data.rdTracking || [];
        let approvedCount = 0;
        const productionLogs = rdLogs.map((log: any) => {
          if (log.TrangThai === "approved") approvedCount++;
          return {
            id: log.MaNhatKy || log._id,
            customer: log.ContractID?.title || "Chưa cập nhật",
            colorCode: log.MaMauYeuCau || "N/A",
            testWeight:
              log.LichSuPhienBan?.reduce(
                (acc: number, cur: any) => acc + (cur.inputWeight || 0),
                0,
              ) || 0,
            status:
              log.TrangThai === "approved"
                ? "Approved KCS"
                : log.TrangThai === "rejected"
                  ? "Rejected"
                  : "Processing",
            engineer: "Kỹ sư Lab",
          };
        });
        const rdSuccessRate =
          rdLogs.length > 0
            ? parseFloat(((approvedCount / rdLogs.length) * 100).toFixed(1))
            : 0;

        await exportProductionReportExcel(
          {
            ...(data.production || {}),
            rdSuccessRate,
          },
          productionLogs,
          selectedPeriod,
        );
      } else if (activeTab === "CUSTOMER_SERVICE") {
        const res = await api.get(
          `/dashboard/customer-service-report?period=${encodeURIComponent(selectedPeriod)}`,
        );
        if (res.data?.success) {
          await exportCustomerServiceReportExcel(
            data.customerService,
            res.data.data,
            selectedPeriod,
          );
        }
      } else if (activeTab === "HR") {
        const res = await api.get("/nhan-vien");
        if (res.data?.success) {
          const staffList = res.data.data;
          await exportHrReportExcel(
            data.hrLegal || {},
            staffList,
            selectedPeriod,
          );
        }
      } else if (activeTab === "LEGAL") {
        const rawContracts = data.contracts || [];
        const formattedContracts = rawContracts.map((c: any) => ({
          id: c.contractId || c._id,
          partner: c.customer?.name || "Chưa xác định",
          txHash: c.txHash || "Chưa khởi tạo",
          block: c.txHash
            ? Math.floor(Math.random() * 90000) + 12000000
            : "N/A",
          status:
            c.status === "signed" ||
              c.status === "delivering" ||
              c.status === "completed"
              ? "Đã xác minh"
              : "Chờ ký số",
        }));
        await exportLegalReportExcel(
          data.hrLegal || {},
          formattedContracts,
          selectedPeriod,
        );
      } else {
        await exportDashboardToExcel(
          data.sales,
          data.detailed?.staffRanking || [],
          data.detailed?.topCustomers || [],
          selectedPeriod,
        );
      }
    } catch (error) {
      console.error("Export error:", error);
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
        <p className="text-slate-500 font-bold animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-8 text-center text-slate-500">
        Không thể kết nối đến máy chủ dữ liệu.
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Layers size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Trung tâm Điều hành Số VTSC
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Hệ thống phân tích dữ liệu chuyên sâu thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
            {[
              "SALES",
              "INVENTORY",
              "PRODUCTION",
              "CUSTOMER_SERVICE",
              "HR",
              "LEGAL",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                {tab === "SALES"
                  ? "Kinh doanh"
                  : tab === "INVENTORY"
                    ? "Kho vận"
                    : tab === "PRODUCTION"
                      ? "Sản xuất & R&D"
                      : tab === "CUSTOMER_SERVICE"
                        ? "Hậu mãi & Khuyến mãi"
                        : tab === "HR"
                          ? "Nhân sự"
                          : "Hợp đồng Blockchain"}
              </button>
            ))}
          </div>
          {activeTab === "INVENTORY" && (
            <select
              className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="ALL">Tất cả sản phẩm</option>
              {products.map((p: any) => (
                <option key={p.MaSanPham} value={p.MaSanPham}>
                  {p.TenDongSon} ({p.MaSanPham})
                </option>
              ))}
            </select>
          )}
          <select
            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 ${isExporting ? "bg-blue-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {isExporting ? "Đang xử lý..." : "Xuất Báo Cáo"}
          </button>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {activeTab === "SALES" && <SalesDashboard data={data} />}
      {activeTab === "INVENTORY" && <InventoryDashboard data={data} />}
      {activeTab === "PRODUCTION" && <ProductionDashboard data={data} />}
      {activeTab === "CUSTOMER_SERVICE" && (
        <CustomerServiceDashboard data={data} />
      )}
      {activeTab === "HR" && <HrDashboard data={data} />}
      {activeTab === "LEGAL" && <LegalDashboard data={data} />}


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
          value={`${kpi.totalRevenue?.value || 0} ${kpi.totalRevenue?.unit || ""}`}
          trend={kpi.totalRevenue?.change || 0}
          icon={<DollarSign />}
          color="blue"
        />
        <KpiCard
          title="Tổng Sản lượng"
          value={`${formatNumber(kpi.totalProduction?.value || 0)} ${kpi.totalProduction?.unit || ""}`}
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
          value={`${kpi.avgOrderValue?.value || 0} ${kpi.avgOrderValue?.unit || ""}`}
          trend={kpi.avgOrderValue?.change || 0}
          icon={<TrendingUp />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Xu hướng Doanh thu
            vs Kế hoạch
          </h3>
          <div className="h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={trends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Bar
                  name="Thực tế (Tr VNĐ)"
                  dataKey="revenueActual"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
                <Line
                  name="Kế hoạch (Tr VNĐ)"
                  type="monotone"
                  dataKey="revenuePlan"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f59e0b" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="text-emerald-600" size={20} /> Cơ cấu Doanh
            thu Sản phẩm
          </h3>
          <div className="h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data.detailed?.revenueByCategory || []}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="_id"
                >
                  {data.detailed?.revenueByCategory?.map(
                    (_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
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
  const bestSellers = data.inventory?.bestSellers || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Tổng SKUs"
          value={inv.totalSKUs || 0}
          icon={<Boxes />}
          color="blue"
        />
        <KpiCard
          title="Giá trị Tồn kho"
          value={formatCurrency(inv.totalStockValue || 0)}
          icon={<DollarSign />}
          color="emerald"
        />
        <KpiCard
          title="Tổng Khối lượng"
          value={`${formatNumber(inv.totalKg || 0)} thùng`}
          icon={<Package />}
          color="orange"
        />
        <KpiCard
          title="Cảnh báo Tồn thấp"
          value={inv.lowStockItems || 0}
          icon={<AlertTriangle />}
          color="rose"
          isAlert={inv.lowStockItems > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6">
            Phân bổ Tồn kho theo Danh mục
          </h3>
          <div className="h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={catDist} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="_id"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={140}
                  tick={{ fontSize: 13, fill: "#475569", fontWeight: 500 }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="totalStock"
                  name="Số lượng (thùng)"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <History size={20} className="text-slate-400" /> Biến động Kho gần
            đây
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
                  <tr
                    key={m._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-2 text-slate-500 font-medium">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {m.MaPhieu}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.LoaiPhieu === "NHAP"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                          }`}
                      >
                        {m.LoaiPhieu === "NHAP" ? "Nhập" : "Xuất"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {m.NhanVien?.HoTen || "Hệ thống"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Sản Phẩm Bán Chạy Nhất */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-30 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="text-amber-500" size={24} />
              Top Sản Phẩm Bán Chạy Nhất
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Dữ liệu tổng hợp sản lượng bán ra thực tế từ các đơn hàng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Biểu đồ cột */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
              <BarChartIcon size={18} className="text-blue-500" /> Biểu Đồ Sản
              Lượng Bán
            </h4>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bestSellers}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="TenDongSon"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="SoLuongBan"
                    name="Số lượng bán"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  >
                    {bestSellers.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "#f59e0b"
                            : index === 1
                              ? "#94a3b8"
                              : index === 2
                                ? "#b45309"
                                : "#3b82f6"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng xếp hạng chi tiết */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Star size={18} className="text-amber-500" /> Bảng Xếp Hạng Chi
                Tiết
              </h4>
            </div>
            <div className="overflow-y-auto h-[400px] custom-scrollbar p-2">
              {bestSellers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Box size={40} className="text-slate-200" />
                  <p>Chưa có dữ liệu thống kê sản phẩm bán chạy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bestSellers.map((sp: any, idx: number) => (
                    <div
                      key={sp._id}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0
                        ${idx === 0
                            ? "bg-amber-100 text-amber-600 border border-amber-200"
                            : idx === 1
                              ? "bg-slate-200 text-slate-600 border border-slate-300"
                              : idx === 2
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={resolveImageUrl(sp.HinhAnh)}
                          alt={sp.TenDongSon}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/100x100?text=SP";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5
                          className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                          title={sp.TenDongSon}
                        >
                          {sp.TenDongSon}
                        </h5>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {sp.MaSanPham}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-sm inline-block mb-1 shadow-sm">
                          {sp.SoLuongBan.toLocaleString("vi-VN")} đv
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 flex items-center justify-end gap-1">
                          <DollarSign size={10} />{" "}
                          {sp.TongDoanhThu.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionDashboard({ data }: { data: any }) {
  const prod = data.production || {};
  const rdLogs = data.rdTracking || [];

  // Calculate Data for Charts:
  let processingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let processingTests = 0;
  let approvedTests = 0;
  let rejectedTests = 0;

  rdLogs.forEach((log: any) => {
    const tests = log.LichSuPhienBan?.length || 0;
    if (log.TrangThai === "approved") {
      approvedCount++;
      approvedTests += tests;
    } else if (log.TrangThai === "rejected") {
      rejectedCount++;
      rejectedTests += tests;
    } else {
      processingCount++;
      processingTests += tests;
    }
  });

  const donutData = [
    { name: "Processing", value: processingCount },
    { name: "Approved", value: approvedCount },
    { name: "Rejected", value: rejectedCount },
  ];
  const DONUT_COLORS = ["#3b82f6", "#10b981", "#ef4444"];

  const barData = [
    { name: "Processing", tests: processingTests },
    { name: "Approved", tests: approvedTests },
    { name: "Rejected", tests: rejectedTests },
  ];

  const sortedLogs = [...rdLogs].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
  const top5Logs = sortedLogs.slice(0, 5).reverse();

  const lineData = top5Logs.map((log: any) => {
    let wastage = 0;
    if (log.LichSuPhienBan && log.LichSuPhienBan.length > 0) {
      const sum = log.LichSuPhienBan.reduce((acc: number, cur: any) => {
        if (cur.inputWeight > 0) {
          return (
            acc + ((cur.inputWeight - cur.outputWeight) / cur.inputWeight) * 100
          );
        }
        return acc;
      }, 0);
      wastage = sum / log.LichSuPhienBan.length;
    }
    return {
      name: log.MaNhatKy || "Log",
      loss: parseFloat(wastage.toFixed(1)),
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Hiệu suất Sản xuất"
          value={`${prod.efficiency || 0}%`}
          icon={<Factory />}
          color="blue"
        />
        <KpiCard
          title="Dự án R&D"
          value={rdLogs.length}
          icon={<TestTube />}
          color="purple"
        />
        <KpiCard
          title="Tỷ lệ Đạt mẫu"
          value={`${rdLogs.length > 0 ? ((approvedCount / rdLogs.length) * 100).toFixed(1) : 0}%`}
          icon={<ClipboardCheck />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 w-full flex items-center gap-2">
            <PieChartIcon className="text-blue-600" size={20} /> Tỉ lệ trạng
            thái mẫu KCS
          </h3>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 w-full flex items-center gap-2">
            <BarChartIcon className="text-blue-600" size={20} /> Phân bổ số mẻ
            test theo trạng thái
          </h3>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="tests"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-0">
        <h3 className="text-lg font-black text-slate-900 mb-6 w-full flex items-center gap-2">
          <LineChartIcon className="text-blue-600" size={20} /> Độ hao hụt (%)
          trung bình theo 5 log mới nhất
        </h3>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={lineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="loss"
                name="Hao hụt (%)"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
    csatScore: 0,
  };

  const loyalty = csData.loyalty || {
    activeVouchers: 0,
    vipCustomers: 0,
    churnAlerts: 0,
  };

  const supportTrends = csData.supportTrends || [];
  const pendingComplaints = csData.pendingComplaints || [];

  const campaigns = (loyalty.campaignsList || []).map((c: any) => {
    let statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (c.status === "Tạm dừng") statusColor = "bg-orange-100 text-orange-700 border-orange-200";
    else if (c.status === "Hết ngân sách" || c.status === "DA_KET_THUC" || c.status === "Đã kết thúc") statusColor = "bg-rose-100 text-rose-700 border-rose-200";

    let targetColor = "bg-blue-100 text-blue-700";
    if (c.target === "VIP") targetColor = "bg-amber-100 text-amber-700";
    else if (c.target === "B2B") targetColor = "bg-purple-100 text-purple-700";

    return { ...c, targetColor, statusColor };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Header Portion */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Khuyến mãi</h2>
          <p className="text-slate-500 font-medium mt-1">Báo cáo hiệu suất các chương trình kích cầu thương mại</p>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Tổng chi phí khuyến mãi"
          value={`${(loyalty.totalDiscountValue || 0).toLocaleString('vi-VN')} VNĐ`}
          valueColor="text-rose-500"
          icon={<DollarSign />}
          color="rose"
          note="Tổng số tiền hệ thống đã giảm giá/chiết khấu"
        />
        <KpiCard
          title="Doanh thu từ khuyến mãi"
          value={`${(loyalty.totalVoucherRevenue || 0).toLocaleString('vi-VN')} VNĐ`}
          valueColor="text-emerald-500"
          icon={<TrendingUp />}
          color="emerald"
          note="Tổng giá trị đơn hàng có áp dụng mã"
        />

        <KpiCard
          title="Tổng lượt sử dụng"
          value={`${loyalty.totalVouchersUsed > 0 ? loyalty.totalVouchersUsed.toLocaleString('vi-VN') : "0"} lượt`}
          valueColor="text-blue-500"
          icon={<Ticket />}
          color="blue"
          note="Số lượng mã đã được kích hoạt thành công"
        />
      </div>

      {/* 3. Data Table "Chi tiết chiến dịch" */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-w-0">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <Target className="text-blue-600" size={20} /> Chi tiết chiến dịch
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <th className="pb-4 px-4 font-semibold whitespace-nowrap">Mã & Tên chiến dịch</th>
                <th className="pb-4 px-4 font-semibold whitespace-nowrap">Thời hạn áp dụng</th>
                <th className="pb-4 px-4 font-semibold whitespace-nowrap w-[30%]">Tiến độ sử dụng</th>
                <th className="pb-4 px-4 font-semibold whitespace-nowrap">Trạng thái hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.length > 0 ? campaigns.map((camp: any, idx: number) => {
                const percent = camp.total > 0 ? Math.round((camp.used / camp.total) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{camp.id}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{camp.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 w-40 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /> {camp.startDate ? new Date(camp.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        <span className="flex items-center gap-1.5 text-slate-400 ml-[19px]">Đến: {camp.endDate ? new Date(camp.endDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 w-48">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{camp.used} / {camp.total > 0 ? camp.total : '∞'} mã</span>
                          <span className={percent >= 100 ? 'text-rose-600' : 'text-slate-600'}>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-rose-500' : percent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${camp.statusColor}`}>
                        {camp.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-sm">
                    Không có chiến dịch khuyến mãi nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-900 -mb-2 pb-2 mt-8 border-t border-slate-200 pt-6">
        Bảo hành, Đổi trả & Khiếu nại
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Tổng ca bảo hành/đổi trả"
          value={kpi.totalReturns}
          icon={<AlertTriangle />}
          color="rose"
        />
        <KpiCard
          title="Tỷ lệ xử lý thành công"
          value={`${kpi.successRate}%`}
          icon={<CheckCircle />}
          color="emerald"
        />
        <KpiCard
          title="Thời gian phản hồi TB"
          value={`${kpi.avgResponseTime}h`}
          icon={<Clock />}
          color="blue"
        />
        <KpiCard
          title="Điểm hài lòng (CSAT)"
          value={`${kpi.csatScore}/5`}
          icon={<Smile />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Xu hướng bảo
            hành/đổi trả theo tuần
          </h3>
          <div className="h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={supportTrends}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  name="Số lượng yêu cầu"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTickets)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={20} /> Yêu cầu chưa
            xử lý
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
                {pendingComplaints.length > 0 ? (
                  pendingComplaints.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-2 font-bold text-slate-900">
                        {c.id}
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {c.customer}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-600">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-4 text-center text-slate-400 text-xs font-medium"
                    >
                      Không có yêu cầu nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function HrDashboard({ data }: { data: any }) {
  const hrData = data.hrLegal || {};
  const kpi = hrData.kpi || {
    totalStaff: 0,
    onTimeRate: 0,
  };

  const hrTrends = hrData.hrTrends || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <KpiCard
          title="Tổng số nhân sự"
          value={kpi.totalStaff}
          icon={<Users />}
          color="blue"
        />
        <KpiCard
          title="Tỷ lệ đi làm đúng giờ"
          value={`${kpi.onTimeRate}%`}
          icon={<Clock />}
          color="emerald"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto min-w-0">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <Users className="text-blue-600" size={20} /> Biến động nhân sự theo
          tháng
        </h3>
        <div className="h-[400px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={hrTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "transparent" }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                name="Tuyển mới"
                dataKey="newHires"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              <Bar
                name="Nghỉ việc"
                dataKey="resignations"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LegalDashboard({ data }: { data: any }) {
  const hrData = data.hrLegal || {};
  const rawContracts = data.contracts || [];
  const kpi = hrData.kpi || {
    expiringContracts: 0,
    activeLegalCases: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <KpiCard
          title="Hợp đồng sắp hết hạn"
          value={kpi.expiringContracts}
          icon={<FileText />}
          color="orange"
          isAlert={kpi.expiringContracts > 0}
        />
        <KpiCard
          title="Vụ việc pháp lý"
          value={kpi.activeLegalCases}
          icon={<Scale />}
          color="purple"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto flex flex-col">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={20} /> Giao dịch HĐ
          nguyên tắc On-chain
        </h3>
        <div className="overflow-x-auto w-full">
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
              {rawContracts.length > 0 ? (
                rawContracts.map((c: any, i: number) => {
                  const statusVerified =
                    c.status === "signed" ||
                    c.status === "delivering" ||
                    c.status === "completed";
                  const txHashDisplay = c.txHash
                    ? `${c.txHash.substring(0, 6)}...${c.txHash.substring(c.txHash.length - 4)}`
                    : "Chưa khởi tạo";

                  return (
                    <tr
                      key={c._id || i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-2 font-bold text-slate-900">
                        {c.contractId || c._id}
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {c.customer?.name || "Khách hàng lẻ"}
                      </td>
                      <td className="py-3">
                        <div
                          className={`flex items-center gap-1.5 font-medium w-max px-2 py-1 rounded-md ${c.txHash ? "text-blue-600 bg-blue-50/50" : "text-slate-400 bg-slate-50/50"}`}
                        >
                          {txHashDisplay}
                          {c.txHash && (
                            <Copy
                              size={14}
                              className="cursor-pointer hover:text-blue-800 transition-colors"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {statusVerified ? (
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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 text-center text-slate-400 text-xs font-medium"
                  >
                    Không có hợp đồng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Helper UI Components ---

function KpiCard({ title, value, trend, icon, color, isAlert, note, valueColor }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`bg-white p-6 rounded-3xl shadow-sm border ${isAlert ? "border-rose-200 animate-pulse" : "border-slate-100"} hover:shadow-md transition-all flex flex-col justify-between`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div
            className={`w-12 h-12 rounded-2xl ${colorMap[color]} flex items-center justify-center`}
          >
            {React.cloneElement(icon, { size: 24 })}
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
                }`}
            >
              {trend >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            {title}
          </p>
          <h3 className={`text-2xl font-black ${valueColor ? valueColor : 'text-slate-900'} tracking-tight`}>
            {value}
          </h3>
        </div>
      </div>
      {note && (
        <p className="text-xs font-medium text-slate-500 mt-4 border-t border-slate-100 pt-3">
          {note}
        </p>
      )}
    </div>
  );
}
