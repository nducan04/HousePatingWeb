"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  Filter,
  Loader2,
  DollarSign,
  Target,
  ChevronRight,
  Award,
  TrendingDown,
} from "lucide-react";

import api from "@/lib/utils/axiosAuth";
import RevenuePlanChart from "./RevenuePlanChart";
import ProductionPlanChart from "./ProductionPlanChart";
import { exportDashboardToExcel } from "@/lib/utils/excelExport";

// Tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-sm p-4 shadow-xl z-[100] min-w-[200px]">
        <p className="text-slate-900 font-medium text-sm mb-3 border-b border-slate-100 pb-2">
          Thống kê: {label}
        </p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between gap-6">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: p.stroke || p.fill }}
                />
                {p.name}
              </span>
              <span className="text-xs font-medium text-slate-900">
                {typeof p.value === "number"
                  ? p.value.toLocaleString("vi-VN")
                  : p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// ───────────────────────────────────────────────
// Gauge (Semi-circle) chart component
// ───────────────────────────────────────────────
function GaugeChart({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 120);
  // Convert percentage to angle: 0% → -180°, 100% → 0°, >100% clips
  const pct = Math.min(clamped, 100);
  const angle = -180 + (pct / 100) * 180;
  const rad = (angle * Math.PI) / 180;

  const cx = 100,
    cy = 100,
    r = 70;
  const needleX = cx + r * Math.cos(rad);
  const needleY = cy + r * Math.sin(rad);

  const color =
    pct >= 100
      ? "#10b981"
      : pct >= 75
        ? "#f59e0b"
        : pct >= 50
          ? "#f97316"
          : "#ef4444";

  // Arc path helper
  const describeArc = (startDeg: number, endDeg: number) => {
    const s = ((startDeg - 90) * Math.PI) / 180;
    const e = ((endDeg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s),
      y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e),
      y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
      {/* Track */}
      <path
        d={describeArc(180, 360)}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={describeArc(180, 180 + (pct / 100) * 180)}
        fill="none"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#1e293b" />
      {/* Labels */}
      <text x="30" y="115" fontSize="9" fill="#94a3b8" fontWeight="700">
        0%
      </text>
      <text x="86" y="28" fontSize="9" fill="#94a3b8" fontWeight="700">
        50%
      </text>
      <text x="158" y="115" fontSize="9" fill="#94a3b8" fontWeight="700">
        100%
      </text>
      {/* Center value */}
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize="18"
        fill={color}
        fontWeight="900"
      >
        {value.toFixed(1)}%
      </text>
    </svg>
  );
}

// ───────────────────────────────────────────────
// Horizontal bar for staff ranking
// ───────────────────────────────────────────────
function HBar({
  rank,
  label,
  value,
  max,
  color,
  unit,
}: {
  rank: number;
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  const pct = Math.min((value / max) * 100, 100);

  // Top 3 rank styling với màu gradient chuyên nghiệp
  const rankColors = [
    "from-amber-400 to-amber-500 text-white shadow-amber-200/50",
    "from-slate-300 to-slate-400 text-white shadow-slate-200/50",
    "from-orange-400 to-orange-500 text-white shadow-orange-200/50",
  ];

  const rankStyle =
    rank <= 3
      ? `bg-gradient-to-br ${rankColors[rank - 1]} shadow-sm font-medium`
      : "bg-slate-50 text-slate-400 border border-slate-100 font-light";

  return (
    <div className="flex items-center gap-3.5 py-1.5 px-2 rounded-sm hover:bg-slate-50/70 transition-all duration-300 group">
      {/* Rank Indicator */}
      <div
        className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs shrink-0 transition-transform group-hover:scale-105 ${rankStyle}`}
      >
        {rank}
      </div>

      {/* Main Content & Bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-light text-slate-700 truncate group-hover:text-blue-600 transition-colors">
            {label}
          </span>
          <span className="text-xs font-medium text-slate-900 shrink-0 tabular-nums">
            {value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}{" "}
            <span className="text-[9px] font-medium text-slate-400 tracking-wider uppercase ml-0.5">
              {unit}
            </span>
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full relative">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}dd, ${color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Main Dashboard Page
// ───────────────────────────────────────────────
const YEARS = ["2026", "2025", "2024"];
const MONTHS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [staffRanking, setStaffRanking] = useState<any[]>([]);

  // Filter states
  const [activeYears, setActiveYears] = useState<string[]>(["2026"]);
  const [activeMonths, setActiveMonths] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);

  // Build period string for API
  const buildPeriod = () => {
    if (activeMonths.length === 1) {
      const idx = MONTHS.indexOf(activeMonths[0]) + 1;
      return `Tháng ${idx}/${activeYears[0] || "2026"}`;
    }
    return `Năm ${activeYears[0] || "2026"}`;
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const period = buildPeriod();
      const [statsRes, detailRes] = await Promise.all([
        api.get("/dashboard/stats", { params: { period } }),
        api.get("/dashboard/detailed-stats", { params: { period } }),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (detailRes.data.success && detailRes.data.data.topSalesStaff) {
        setStaffRanking(
          detailRes.data.data.topSalesStaff.slice(0, 10).map((s: any) => ({
            name: s.hoTen || s.maNV || "Nhân viên",
            revenue: Math.round((s.revenue || 0) / 1_000_000), // Tr.đ
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, [activeYears, activeMonths]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  // Derived KPIs
  const totalRevenue = stats?.kpi?.totalRevenue?.value ?? 0; // Tr.đ
  const revenueTarget = 500; // Tr.đ default target
  const gaugeValue =
    revenueTarget > 0 ? (totalRevenue / revenueTarget) * 100 : 0;
  const topCustomers: any[] = stats?.topCustomers ?? [];
  const trends: any[] = stats?.monthlyTrends ?? [];
  const maxStaffRev = staffRanking[0]?.revenue || 1;

  // Customer ranking bar max
  const maxCustVol = Math.max(...topCustomers.map((c: any) => c.volume), 1);

  // KPI change helper
  const kpiChange = (change: number) => (
    <span
      className={`flex items-center gap-0.5 font-medium text-xs ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
    >
      {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {change >= 0 ? "+" : ""}
      {change}%
    </span>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-light animate-pulse tracking-wide">
          Đang tổng hợp dữ liệu thời gian thực...
        </p>
      </div>
    );
  }

  if (!stats)
    return (
      <div className="text-center py-20 text-rose-500 font-medium">
        Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối API.
      </div>
    );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-medium text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-sm flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Activity size={18} />
            </div>
            Báo cáo bán hàng
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">
            Hệ thống phân tích dữ liệu kinh doanh &amp; sản xuất theo thời gian
            thực
          </p>
        </div>
        <button
          onClick={() =>
            exportDashboardToExcel(
              stats,
              staffRanking,
              topCustomers,
              buildPeriod(),
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm font-light text-sm transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
        >
          <FileSpreadsheet size={16} /> Xuất báo cáo
        </button>
      </div>

      {/* ── Sleek Horizontal Filter Toolbar ── */}
      <div className="bg-white rounded-sm border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex flex-wrap items-center gap-6">
          {/* Year selector */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Năm
            </span>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-sm border border-slate-100">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setActiveYears([y])}
                  className={`px-3.5 py-1.5 rounded-sm text-xs font-light transition-all cursor-pointer ${
                    activeYears.includes(y)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Tháng
            </span>
            <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-sm border border-slate-100 max-w-[550px]">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggle(activeMonths, m, setActiveMonths)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                    activeMonths.includes(m)
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveYears(["2026"]);
            setActiveMonths([]);
            setActiveRegions([]);
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-light text-xs rounded-sm transition-all flex items-center justify-center gap-1.5 self-end lg:self-auto shadow-sm cursor-pointer"
        >
          <Filter size={12} /> Đặt lại bộ lọc
        </button>
      </div>

      {/* ── Main content: full width ── */}
      <div className="w-full space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <BarChart3 size={20} />,
              color: "blue",
              label: "Tổng doanh thu",
              value: `${totalRevenue.toLocaleString("vi-VN")}`,
              unit: "Tr.Đ",
              change: stats.kpi.totalRevenue.change,
              sub: "vs cùng kỳ",
            },
            {
              icon: <FileSpreadsheet size={20} />,
              color: "violet",
              label: "Đơn đặt hàng",
              value: stats.kpi.customerCount.value,
              unit: "đơn",
              change: stats.kpi.customerCount.change,
              sub: "vs tháng trước",
            },
            {
              icon: <Users size={20} />,
              color: "emerald",
              label: "Số khách hàng",
              value: stats.kpi.customerCount.value,
              unit: "khách",
              change: stats.kpi.customerCount.change,
              sub: "vs cùng kỳ",
            },
            {
              icon: <Package size={20} />,
              color: "amber",
              label: "Sản lượng bán",
              value: stats.kpi.totalProduction.value.toLocaleString("vi-VN"),
              unit: "KG",
              change: stats.kpi.totalProduction.change,
              sub: "vs kế hoạch",
            },
          ].map((k, i) => {
            const palette: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              violet: "bg-violet-50 text-violet-600",
              emerald: "bg-emerald-50 text-emerald-600",
              amber: "bg-amber-50 text-amber-600",
            };
            return (
              <div
                key={i}
                className="bg-white rounded-sm border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-light text-slate-400 uppercase tracking-wider">
                    {k.label}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center ${palette[k.color]}`}
                  >
                    {k.icon}
                  </div>
                </div>
                <p className="text-[22px] font-medium text-slate-900 leading-none">
                  {k.value}
                  <span className="text-xs font-light text-slate-400 ml-1">
                    {k.unit}
                  </span>
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {kpiChange(k.change)}
                  <span className="text-[11px] text-slate-400">{k.sub}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gauge + Revenue Chart row */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          {/* Gauge */}
          <div className="bg-white rounded-sm border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-2">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest text-center">
              Tỷ lệ hoàn thành đạt doanh thu
            </p>
            <GaugeChart value={gaugeValue} />
            <p className="text-[11px] font-light text-slate-400 text-center">
              So với cùng kỳ năm trước
            </p>
            <div className="flex items-center gap-1 text-emerald-500 font-medium text-sm">
              <TrendingUp size={14} />+{stats.kpi.totalRevenue.change}%
            </div>
          </div>

          {/* Revenue Plan Chart */}
          <div className="min-w-0">
            <RevenuePlanChart year={activeYears[0] as any} />
          </div>
        </div>

        {/* Production Plan Chart */}
        <ProductionPlanChart year={activeYears[0] as any} />

        {/* Bottom row: Staff ranking + Customer ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Staff by Revenue */}
          <div className="bg-white rounded-sm border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="font-medium text-slate-900 text-sm"
                  style={{ fontSize: "14px" }}
                >
                  Top 10 nhân viên doanh thu
                </h3>
                <p className="text-slate-400" style={{ fontSize: "12px" }}>
                  Dựa trên đơn hàng &amp; hợp đồng
                </p>
              </div>
              <Award size={18} className="text-amber-400" />
            </div>
            <div className="space-y-2.5">
              {staffRanking.length === 0 ? (
                <p className="text-center text-slate-400 text-xs font-medium py-4">
                  Chưa có dữ liệu nhân viên doanh thu trong kỳ này
                </p>
              ) : (
                staffRanking.map((s: any, i: number) => {
                  const colors = [
                    "#3b82f6",
                    "#8b5cf6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#06b6d4",
                    "#84cc16",
                    "#f97316",
                    "#6366f1",
                    "#ec4899",
                  ];
                  return (
                    <HBar
                      key={s.name + i}
                      rank={i + 1}
                      label={s.name}
                      value={s.revenue}
                      max={maxStaffRev}
                      color={colors[i % colors.length]}
                      unit="TR.Đ"
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-sm border border-slate-100 shadow-sm p-5 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-slate-900 text-sm">
                  Top khách hàng trọng tâm
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Theo sản lượng tích lũy
                </p>
              </div>
              <Target size={18} className="text-blue-500" />
            </div>
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Khách hàng</th>
                    <th className="pb-3 font-medium">Sản lượng</th>
                    <th className="pb-3 font-medium text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topCustomers.slice(0, 5).map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-slate-700 font-medium max-w-[120px] truncate" title={c.name}>
                        {c.name}
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {c.volume.toLocaleString("vi-VN")} <span className="text-[9px] text-slate-400">KG</span>
                      </td>
                      <td className="py-3 text-blue-600 font-medium text-right">
                        {c.revenue.toLocaleString("vi-VN")} <span className="text-[9px] text-blue-300">đ</span>
                      </td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Production Table */}
        <div className="bg-white p-6 rounded-sm border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-medium text-slate-900 tracking-tight">
                Bảng dữ liệu: Sản lượng thực tế vs kế hoạch
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Đơn vị: Kilogram (KG)
              </p>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Thời gian</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Mục tiêu (Kế hoạch)</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Sản lượng thực tế</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.monthlyTrends?.map((row: any, i: number) => {
                  const pct = row.prodPlan > 0 ? Math.round((row.prodActual / row.prodPlan) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 font-medium">{row.month}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium text-right">{row.prodPlan.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium text-right">{row.prodActual.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${pct >= 100 ? 'bg-emerald-50 text-emerald-600' : pct >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats.monthlyTrends || stats.monthlyTrends.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-sm">Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── BẢNG CHI TIẾT KHÁCH HÀNG TRỌNG TÂM (KÉO DÀI FULL MÀN HÌNH) ── */}
      <div className="bg-white rounded-sm border border-slate-100 shadow-sm overflow-hidden w-full mt-4">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-slate-900 tracking-tight">
              Bảng chi tiết tiến độ khách hàng trọng tâm
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Thống kê sản lượng và doanh thu tích lũy dựa theo mục tiêu kế
              hoạch đề ra
            </p>
          </div>
          <button
            onClick={() =>
              exportDashboardToExcel(
                stats,
                staffRanking,
                topCustomers,
                buildPeriod(),
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-sm font-light text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Xuất dữ liệu
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-3.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-widest w-20">
                  Hạng
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Khách hàng
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Phân khúc
                </th>
                <th className="px-6 py-3.5 text-right text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Sản lượng thực
                </th>
                <th className="px-6 py-3.5 text-right text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Doanh thu tương ứng
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-widest w-52">
                  Tiến độ hoàn thành
                </th>
                <th className="px-6 py-3.5 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topCustomers.map((c: any, i: number) => {
                const target = c.target || 2500;
                const pct = Math.round((c.volume / target) * 100);
                return (
                  <tr
                    key={c.name + i}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <div
                        className={`w-7 h-7 rounded-sm flex items-center justify-center font-medium text-xs shadow-sm ${
                          i === 0
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                            : i === 1
                              ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                              : i === 2
                                ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white"
                                : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}
                      >
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-light text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[220px]">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-wider bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-700">
                      {c.volume.toLocaleString("vi-VN")}{" "}
                      <span className="text-[9px] text-slate-400 font-light ml-0.5">
                        KG
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-blue-600">
                      {c.revenue.toLocaleString("vi-VN")}{" "}
                      <span className="text-[9px] text-blue-300 font-light ml-0.5">
                        đ
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                              pct >= 90
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                : pct >= 70
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-rose-400 to-rose-500"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 tabular-nums w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-tight shadow-sm border ${
                          pct >= 90
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : pct >= 70
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full animate-pulse ${
                            pct >= 90
                              ? "bg-emerald-500"
                              : pct >= 70
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        {pct >= 90
                          ? "Vượt chỉ tiêu"
                          : pct >= 70
                            ? "Cần cố gắng"
                            : "Cảnh báo rủi ro"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
