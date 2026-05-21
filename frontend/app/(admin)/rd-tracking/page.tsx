"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  FlaskConical,
  Beaker,
  CheckCircle2,
  FlaskRound,
  Plus,
  Loader2,
  X,
  Droplets,
  Package,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import Link from "next/link";
import { paintColors } from "@/lib/data/colors-data";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";

export default function RDTrackingPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (
      user &&
      (user.role === "KhachHangB2B" || user.role === "KhachHangB2C")
    ) {
      router.push("/");
    }
  }, [user, router]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [sampleRequests, setSampleRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchContracts();

    // Load sample requests from localStorage
    if (typeof window !== "undefined") {
      const storedRequests = localStorage.getItem("sampleRequests");
      if (storedRequests) {
        setSampleRequests(JSON.parse(storedRequests));
      } else {
        const defaultRequests = [
          {
            id: "REQ-001",
            customer: "NCC Aluminium",
            colorCode: "INT-D2525",
            surface: "Nhôm định hình",
            status: "pending",
            date: "12/05/2026",
          },
          {
            id: "REQ-002",
            customer: "VPIC Steel",
            colorCode: "RAL-9005",
            surface: "Thép tấm",
            status: "processing",
            date: "11/05/2026",
          },
        ];
        setSampleRequests(defaultRequests);
        localStorage.setItem("sampleRequests", JSON.stringify(defaultRequests));
      }
    }
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rd-tracking");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch R&D logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await api.get("/contracts");
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
    }
  };

  const handleContractChange = (contractId: string) => {
    setSelectedContract(contractId);
    const contract = contracts.find((c) => c._id === contractId);
    if (contract && contract.chiTietHopDong) {
      const colors = contract.chiTietHopDong
        .map((item: any) => item.colorCode)
        .filter(Boolean);
      setAvailableColors(Array.from(new Set(colors)));
    } else {
      setAvailableColors([]);
    }
    setSelectedColor("");
  };

  const handleCreateLog = async () => {
    if (!selectedContract || !selectedColor) {
      alert("Vui lòng chọn hợp đồng và mã màu!");
      return;
    }
    try {
      setCreating(true);
      const res = await api.post("/rd-tracking", {
        ContractID: selectedContract,
        MaMauYeuCau: selectedColor,
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchLogs();
        alert("Đã tạo Log R&D mới thành công!");
      }
    } catch (err) {
      alert("Lỗi khi tạo log mới");
    } finally {
      setCreating(false);
    }
  };

  const STATS = useMemo(() => {
    return {
      total: data.length,
      testing: data.filter(
        (d) => d.TrangThai === "testing" || d.TrangThai === "pending",
      ).length,
      success: data.filter((d) => d.TrangThai === "approved").length,
      fail: data.filter((d) => d.TrangThai === "rejected").length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const colorInfo = paintColors.find((c) => c.code === item.MaMauYeuCau);
      const matchSearch =
        String(item.MaMauYeuCau || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(item.MaNhatKy || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(colorInfo?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "testing" &&
          (item.TrangThai === "testing" || item.TrangThai === "pending")) ||
        (filter === "success" && item.TrangThai === "approved") ||
        (filter === "fail" && item.TrangThai === "rejected");
      return matchSearch && matchFilter;
    });
  }, [data, searchTerm, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <FlaskConical size={22} />
            </span>
            Phân tích R&D
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            Truy xuất và kiểm soát chất lượng (KCS) phòng thí nghiệm
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tổng Số Mẫu Phân Tích
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.total}{" "}
                <span className="text-sm font-bold text-slate-400">Lô</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FlaskConical size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đang Test/Pha chế
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.testing}{" "}
                <span className="text-sm font-bold text-slate-400">Mẫu</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Beaker size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đã Ký Duyệt KCS
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.success}{" "}
                <span className="text-sm font-bold text-slate-400">Mẫu</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lô Mẫu Thất Bại
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.fail}{" "}
                <span className="text-sm font-bold text-slate-400">Mẫu</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FlaskRound size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tra cứu Trace Log Code Lab Model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: "all", label: "Tất cả" },
                { id: "testing", label: "Processing" },
                { id: "success", label: "Approved KCS" },
                { id: "fail", label: "Rejected" },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                    filter === f.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/rd-tracking/new"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer no-underline"
            >
              <Droplets size={18} className="text-purple-600" /> Yêu cầu mẫu thử
            </Link>
            <Link
              href="/rd-tracking/formulas"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer no-underline"
            >
              <FlaskConical size={18} className="text-emerald-600" /> Quản lý
              Công thức
            </Link>
            <Link
              href="/rd-tracking/materials"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer no-underline"
            >
              <Package size={18} className="text-amber-600" /> Nguyên vật liệu
            </Link>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} /> Tạo Log R&D Mới
            </button>
          </div>
        </div>
      </div>

      {/* Create Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Beaker size={18} />
                </div>
                KHỞI TẠO LOG TRUY XUẤT R&D
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                  Chọn Hợp đồng Kinh doanh/Gia công
                </label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  value={selectedContract}
                  onChange={(e) => handleContractChange(e.target.value)}
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.contractId || c.MaHopDong} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                  Mã màu yêu cầu pha chế
                </label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all disabled:opacity-50"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  disabled={!selectedContract}
                >
                  <option value="">-- Chọn mã màu --</option>
                  {availableColors.map((color) => {
                    const info = paintColors.find((c) => c.code === color);
                    return (
                      <option key={color} value={color}>
                        {color} {info ? `- ${info.name}` : ""}
                      </option>
                    );
                  })}
                </select>

                {!selectedContract && (
                  <p className="text-[11px] text-rose-500 font-bold ml-1 mt-1">
                    * Vui lòng chọn hợp đồng trước
                  </p>
                )}

                {selectedColor && (
                  <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-slate-100"
                      style={{
                        background:
                          paintColors.find((c) => c.code === selectedColor)
                            ?.hex || "#333",
                      }}
                    />
                    <div>
                      <div className="text-[14px] font-black text-slate-900">
                        {paintColors.find((c) => c.code === selectedColor)
                          ?.name || "Custom Color"}
                      </div>
                      <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {selectedColor} |{" "}
                        {paintColors.find((c) => c.code === selectedColor)
                          ?.category || "Mixed"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={creating}
                className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateLog}
                disabled={creating || !selectedContract || !selectedColor}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Đang tạo..." : "Xác nhận Khởi tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Requests Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <Droplets size={18} />
          </span>
          Yêu cầu mẫu thử
        </h2>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mã Yêu Cầu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mã Màu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bề mặt
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-purple-50/30 group transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg text-[13px]">
                        {req.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-[14px]">
                      {req.customer}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-[14px]">
                      {req.colorCode}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[14px]">
                      {req.surface}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`status-badge inline-flex items-center gap-1.5 ${req.status === "processing" ? "status-active" : "status-warning"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${req.status === "processing" ? "bg-emerald-500" : "bg-amber-500"}`}
                        ></span>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-500 text-[13px]">
                      {req.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/rd-tracking/${req.id}`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-all cursor-pointer"
                        >
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Existing Data Table with Title */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <FlaskConical size={18} />
          </span>
          Nhật ký Lab Định Biên
        </h2>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ID Lab Định Biên
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mã Màu Yêu Cầu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hợp Đồng
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Số Mẻ Test
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hao Hụt % (Avg)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cập nhật cuối
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Log Tracking
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-20 text-blue-600 font-bold"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-20 text-slate-400 font-medium italic"
                    >
                      Không tìm thấy log R&D nào.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const wastage =
                      item.LichSuPhienBan?.length > 0
                        ? (
                            item.LichSuPhienBan.reduce(
                              (acc: number, cur: any) =>
                                acc +
                                (cur.inputWeight > 0
                                  ? ((cur.inputWeight - cur.outputWeight) /
                                      cur.inputWeight) *
                                    100
                                  : 0),
                              0,
                            ) / item.LichSuPhienBan.length
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-blue-50/30 group transition-colors"
                      >
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-[13px]">
                            {item.MaNhatKy}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg shadow-inner border border-slate-100 flex-shrink-0"
                              style={{
                                background:
                                  paintColors.find(
                                    (c) => c.code === item.MaMauYeuCau,
                                  )?.hex || "#333",
                              }}
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-[14px]">
                                {item.MaMauYeuCau}
                              </div>
                              {paintColors.find(
                                (c) => c.code === item.MaMauYeuCau,
                              ) && (
                                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                                  {
                                    paintColors.find(
                                      (c) => c.code === item.MaMauYeuCau,
                                    )?.name
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700 text-[14px]">
                            {item.ContractID?.MaHopDong || "N/A"}
                          </div>
                          <div className="text-[12px] text-slate-400 font-medium truncate max-w-[150px]">
                            {item.ContractID?.title || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full text-[13px]">
                            {item.LichSuPhienBan?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-amber-600 text-[14px]">
                            {wastage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`status-badge inline-flex items-center gap-1.5 ${item.TrangThai === "approved" ? "status-active" : item.TrangThai === "rejected" ? "status-error" : "status-warning"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${item.TrangThai === "approved" ? "bg-emerald-500" : item.TrangThai === "rejected" ? "bg-rose-500" : "bg-amber-500"}`}
                            ></span>
                            {(item.TrangThai || "testing").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-500 text-[13px]">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/rd-tracking/${item._id}`}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Eye size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
