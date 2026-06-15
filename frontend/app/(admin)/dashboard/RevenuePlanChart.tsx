"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { TrendingUp, Award, Calendar, DollarSign, Loader2, Target, X, BarChart3 } from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { toast } from "@/lib/utils/notification";
import { useAuthStore } from "@/lib/store/authStore";

// Tooltip cho chế độ 1 năm
const SingleYearTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const thucTe = data.thucTe ?? 0;
    const keHoach = data.keHoach ?? 0;
    const phanTram = keHoach > 0 ? ((thucTe / keHoach) * 100).toFixed(1) : "0.0";
    const chenh = thucTe - keHoach;
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xl z-[100] min-w-[200px]">
        <p className="text-slate-900 font-extrabold text-sm mb-3 flex items-center gap-1.5 border-w border-slate-100 pb-2">
          <Calendar size={13} className="text-blue-400" />{label}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between gap-6">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Thực tế</span>
            <span className="text-xs font-black text-blue-600">{thucTe.toFixed(2)} Tỷ</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Kế hoạch</span>
            <span className="text-xs font-black text-slate-600">{keHoach.toFixed(2)} Tỷ</span>
          </div>
          <div className="flex justify-between gap-6 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Hoàn thành</span>
            <span className={`text-xs font-black ${parseFloat(phanTram) >= 100 ? "text-emerald-600" : "text-amber-500"}`}>{phanTram}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Chênh lệch</span>
            <span className={`text-xs font-black ${chenh >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{chenh >= 0 ? "+" : ""}{chenh.toFixed(2)} Tỷ</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip cho chế độ so sánh đa năm
const MultiYearTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xl z-[100] min-w-[220px]">
        <p className="text-slate-900 font-extrabold text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <BarChart3 size={13} className="text-blue-400" />So sánh: {label}
        </p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between gap-6">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name}
              </span>
              <span className="text-xs font-black" style={{ color: p.color }}>{Number(p.value).toFixed(2)} Tỷ</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface RevenuePlanChartProps {
  year?: "2026" | "2025" | "2024";
}

export default function RevenuePlanChart({ year }: RevenuePlanChartProps) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const isAdminOrDirector = user?.role === "Admin" || user?.role === "Director";

  const [selectedYear, setSelectedYear] = useState<"2026" | "2025" | "2024">(year || "2026");
  const [selectedFilter, setSelectedFilter] = useState<"month" | "quarter" | "year">("month");

  useEffect(() => {
    if (year) {
      setSelectedYear(year);
    }
  }, [year]);

  const [chartData, setChartData] = useState<any[]>([]);
  const [multiYearData, setMultiYearData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<"month" | "quarter" | "year">("month");
  const [targetYear, setTargetYear] = useState("2026");
  const [targetMonth, setTargetMonth] = useState("1");
  const [targetQuarter, setTargetQuarter] = useState("1");
  const [targetAmount, setTargetAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const YEARS_LIST = ["2024", "2025", "2026"];
  const YEAR_COLORS: Record<string, { actual: string; plan: string }> = {
    "2024": { actual: "#06b6d4", plan: "#a5f3fc" },
    "2025": { actual: "#3b82f6", plan: "#bfdbfe" },
    "2026": { actual: "#8b5cf6", plan: "#ddd6fe" },
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      if (selectedFilter === "year") {
        // Chế độ so sánh đa năm: fetch tất cả năm song song
        const results = await Promise.all(
          YEARS_LIST.map(y => api.get("/reports/revenue", { params: { year: y, filter: "year" } }))
        );
        // Dạng dữ liệu grouped bar: mỗi item là 1 năm có thucTe và keHoach
        const grouped = YEARS_LIST.map((y, i) => ({
          name: y,
          thucTe: (results[i].data.data?.[0]?.thucTe ?? 0) / 1e9,
          keHoach: (results[i].data.data?.[0]?.keHoach ?? 0) / 1e9,
        }));
        setMultiYearData(grouped);
      } else {
        const res = await api.get("/reports/revenue", { params: { year: selectedYear, filter: selectedFilter } });
        if (res.data.success) {
          setChartData(res.data.data.map((item: any) => ({
            name: item.name,
            thucTe: item.thucTe / 1e9,
            keHoach: item.keHoach / 1e9,
          })));
        }
      }
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu biểu đồ doanh thu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchRevenueData();
    }
  }, [selectedYear, selectedFilter, isLoading, isAuthenticated]);

  const handleSaveTarget = async () => {
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) < 0) {
      toast.warning("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    try {
      setIsSaving(true);
      // Quy đổi từ Tỷ VNĐ sang VNĐ
      const amountInVND = Number(targetAmount) * 1000000000;

      await api.post("/reports/targets", {
        type: targetType,
        year: Number(targetYear),
        month: targetType === "month" ? Number(targetMonth) : null,
        quarter: targetType === "quarter" ? Number(targetQuarter) : null,
        targetAmount: amountInVND,
      });

      toast.success("Thiết lập mục tiêu thành công!");
      setIsModalOpen(false);

      // Tải lại data nếu năm mục tiêu lưu trùng với năm hiển thị
      if (selectedYear === targetYear) {
        fetchRevenueData();
      }
    } catch (error) {
      console.error("Lỗi khi lưu mục tiêu:", error);
      toast.error("Có lỗi xảy ra khi lưu mục tiêu.");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic calculations
  const totalThucTe = chartData.reduce((sum, item) => sum + item.thucTe, 0);
  const totalKeHoach = chartData.reduce((sum, item) => sum + item.keHoach, 0);
  const totalRate = totalKeHoach > 0 ? ((totalThucTe / totalKeHoach) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md relative">
        {/* Header section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedFilter === "year" ? "So sánh Doanh thu các Năm" : `Tổng quan Doanh thu ${selectedYear}`}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {selectedFilter === "year" ? "2024 vs 2025 vs 2026 — Đơn vị: Tỷ VNĐ" : "Đơn vị: Tỷ VNĐ"}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm">
                <DollarSign size={12} />
                Thực tế: {totalThucTe.toFixed(1)} Tỷ
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                <Award size={12} />
                Đạt: {totalRate}% KH
              </span>
            </div>

            {/* Set Target Button */}
            {isAdminOrDirector && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Target size={16} />
                <span className="hidden sm:inline">Thiết lập mục tiêu</span>
              </button>
            )}

            {/* Filter Select Box */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as "month" | "quarter" | "year")}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
              disabled={loading}
            >
              <option value="month">Theo Tháng</option>
              <option value="quarter">Theo Quý</option>
              <option value="year">Cả Năm</option>
            </select>

            {/* Year Select Box */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
              disabled={loading}
            >
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
            </select>
          </div>
        </div>

        <div className="h-[400px] w-full mt-4 min-w-0">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-400 animate-pulse">Đang đồng bộ dữ liệu doanh thu...</p>
            </div>
          ) : selectedFilter === "year" ? (
            // ── CHẾ ĐỘ SO SÁNH ĐA NĂM ──
            <ResponsiveContainer width="100%" height={400} minWidth={0}>
              <BarChart data={multiYearData} margin={{ top: 30, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                  dy={8}
                  label={{ value: "Doanh thu các năm", position: "insideBottom", offset: -20, fill: "#94a3b8", fontSize: 14, fontWeight: 800 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(v) => `${v.toFixed(0)} Tỷ`}
                  label={{ value: "Doanh thu (Tỷ VNĐ)", angle: -90, position: "insideLeft", offset: 10, fill: "#94a3b8", fontSize: 18, fontWeight: 600 }}
                />
                <Tooltip content={<MultiYearTooltip />} cursor={{ fill: "rgba(139,92,246,0.05)" }} />
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={10}
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 700, color: "#64748b" }}
                />
                <Bar dataKey="thucTe" name="Doanh thu thực tế" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={48} />
                <Bar dataKey="keHoach" name="Kế hoạch" fill="#ff0000" radius={[4, 4, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // ── CHẾ ĐỘ 1 NĂM (THÁNG / QUÝ) ──
            <ResponsiveContainer width="100%" height={400} minWidth={0}>
              <ComposedChart data={chartData} margin={{ top: 30, right: 20, left: 10, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorThucTe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                  dy={8}
                  label={{ value: selectedFilter === "month" ? "Tháng" : "Quý", position: "insideBottom", offset: -20, fill: "#94a3b8", fontSize: 18, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(v) => `${v.toFixed(0)} Tỷ`}
                  label={{ value: "Doanh thu (Tỷ VNĐ)", angle: -90, position: "insideLeft", offset: 15, fill: "#94a3b8", fontSize: 14, fontWeight: 600 }}
                />
                <Tooltip content={<SingleYearTooltip />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={10}
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 700, color: "#64748b" }}
                />
                <Bar dataKey="thucTe" name="Doanh thu thực tế" fill="url(#colorThucTe)"
                  radius={[4, 4, 0, 0]} barSize={selectedFilter === "quarter" ? 40 : 24}
                />
                <Line type="monotone" dataKey="keHoach" name="Kế hoạch đề ra"
                  stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#fff", stroke: "#94a3b8", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* MODAL THIẾT LẬP MỤC TIÊU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-w border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Thiết lập Mục tiêu Doanh thu
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Năm */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Năm áp dụng
                  </label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold outline-none transition-all"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>

                {/* Phân loại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Loại mục tiêu
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold outline-none transition-all"
                  >
                    <option value="month">Theo Tháng</option>
                    <option value="quarter">Theo Quý</option>
                    <option value="year">Cả Năm</option>
                  </select>
                </div>
              </div>

              {/* Tháng / Quý */}
              {targetType === "month" && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Chọn Tháng
                  </label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold outline-none transition-all"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === "quarter" && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Chọn Quý
                  </label>
                  <select
                    value={targetQuarter}
                    onChange={(e) => setTargetQuarter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold outline-none transition-all"
                  >
                    {[1, 2, 3, 4].map((q) => (
                      <option key={q} value={q}>
                        Quý {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Số tiền */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Chỉ tiêu đặt ra (Tỷ VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="Ví dụ: 2.5"
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Tỷ
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                  💡 Nhập số thực. Ví dụ: nhập <strong className="text-slate-600">2.5</strong> tương đương 2 tỷ 500 triệu.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveTarget}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Lưu mục tiêu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
