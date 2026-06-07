"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Megaphone,
  FileText,
  Send,
  Users,
  FileCheck,
  X,
  Upload,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "@/lib/utils/axiosAuth";

const API_PATH = "/tin-tuc";
import { resolveImageUrl, BACKEND_URL } from "@/lib/utils/imageUrl";

interface TinTuc {
  _id?: string;
  MaTinTuc: string;
  TieuDe: string;
  Abstract?: string;
  NoiDung: string;
  HinhAnh: string;
  GhiChu: string;
  NhanVienDang?: {
    MaNV: string;
    HoTen: string;
  };
  TrangThai: "Draft" | "Published";
  NgayDang?: string;
  createdAt?: string;
}

const getImageUrl = (path: any) => {
  return resolveImageUrl(path);
};

export default function TinTucPage() {
  const [data, setData] = useState<TinTuc[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Modal STates
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState<TinTuc>({
    MaTinTuc: "",
    TieuDe: "",
    Abstract: "",
    NoiDung: "",
    HinhAnh: "",
    GhiChu: "",
    TrangThai: "Published",
  });

  const printRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(API_PATH);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    setUploading(true);
    try {
      const res = await api.post("/files/upload-image", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, HinhAnh: res.data.url }));
        alert("Tải ảnh lên thành công!");
      }
    } catch (err) {
      alert("Lỗi khi tải ảnh lên");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const exportToPDF = async (item: TinTuc) => {
    // We will use html2canvas to capture a preview
    // For that, we temp update formData to the selected item and wait for render
    setFormData(item);
    setExporting(true);

    // Wait for the DOM to update
    setTimeout(async () => {
      if (!printRef.current) return;
      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`VTSC_TinTuc_${item.MaTinTuc}.pdf`);
      } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Lỗi khi xuất PDF. Vui lòng thử lại.");
      } finally {
        setExporting(false);
      }
    }, 500);
  };

  const openForm = (item?: TinTuc) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        MaTinTuc: `TT${Date.now().toString().slice(-6)}`,
        TieuDe: "",
        Abstract: "",
        NoiDung: "",
        HinhAnh: "",
        GhiChu: "",
        TrangThai: "Published",
      });
    }
    setIsModalOpen(true);
  };

  const openDetail = (item: TinTuc) => {
    setFormData(item);
    setIsDetailOpen(true);
  };

  const submitForm = async () => {
    try {
      if (formData._id) {
        await api.put(`${API_PATH}/${formData._id}`, formData);
      } else {
        await api.post(API_PATH, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi thao tác");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Chắc chắn xóa bài viết này?")) return;
    try {
      await api.delete(`${API_PATH}/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const STATS = {
    total: data.length,
    published: data.filter((d) => d.TrangThai === "Published").length,
    drafts: data.filter((d) => d.TrangThai !== "Published").length,
    views: 0,
  };

  const filteredData = data.filter((item) => {
    const matchSearch = item.TieuDe?.toLowerCase().includes(
      searchTerm.toLowerCase(),
    );
    const matchFilter =
      filter === "all" ||
      (filter === "published" && item.TrangThai === "Published") ||
      (filter === "draft" && item.TrangThai !== "Published");
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-8 pb-32">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
            <Megaphone size={24} />
          </div>
          <p className="text-xs font-bold text-blue-900/60 uppercase tracking-wider mb-1">
            Tổng Chiến Dịch
          </p>
          <h3 className="text-3xl font-bold text-blue-950">{STATS.total}</h3>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Megaphone size={120} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-xl border border-emerald-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
            <Send size={24} />
          </div>
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-1">
            Đã Xuất Bản
          </p>
          <h3 className="text-3xl font-bold text-emerald-950">
            {STATS.published}
          </h3>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Send size={120} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-600/20 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <p className="text-xs font-bold text-amber-900/60 uppercase tracking-wider mb-1">
            Nháp / Lên lịch
          </p>
          <h3 className="text-3xl font-bold text-amber-950">{STATS.drafts}</h3>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <FileText size={120} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-100 relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <p className="text-xs font-bold text-purple-900/60 uppercase tracking-wider mb-1">
            Tổng Tương Tác
          </p>
          <h3 className="text-3xl font-bold text-purple-950">
            {STATS.views.toLocaleString()}
          </h3>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 mb-6 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Tìm chiến dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-slate-50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
            {[
              { id: "all", label: "Tất cả" },
              { id: "published", label: "Đã xuất bản" },
              { id: "draft", label: "Bản nháp" },
            ].map((f) => (
              <button
                key={f.id}
                className={`${filter === f.id ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"} whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="w-full xl:w-auto bg-blue-600 text-white rounded-xl px-6 py-3 font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Soạn Bài Mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Chiến Dịch Truyền Thông
                </th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Trạng Thái
                </th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Biên Tập Viên
                </th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px] text-right">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onDoubleClick={() => openDetail(item)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-sm relative group-hover:shadow-md transition-all">
                        {item.HinhAnh ? (
                          <img
                            src={getImageUrl(item.HinhAnh)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={20} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          onClick={() => openDetail(item)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors text-left line-clamp-1"
                        >
                          {item.TieuDe}
                        </button>
                        <div className="text-[11px] font-semibold text-slate-500 mt-1.5 flex items-center gap-2">
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50">
                            {item.MaTinTuc}
                          </span>
                          <span className="line-clamp-1 max-w-xs">
                            {item.Abstract || "Chưa có mô tả..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.TrangThai === "Published" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Bản nháp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {item.NhanVienDang?.HoTen?.charAt(0) || "A"}
                      </div>
                      <span className="font-bold text-slate-700">
                        {item.NhanVienDang?.HoTen || "Admin"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToPDF(item);
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:scale-110 transition-all"
                        title="Xuất PDF"
                      >
                        <FileCheck size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openForm(item);
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id!);
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-110 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <FileText size={48} className="mb-4 text-slate-200" />
                      <p className="font-bold">Không tìm thấy chiến dịch nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Soạn Bài Tức Thời */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                  <Edit size={20} />
                </div>
                {formData._id ? "Cập Nhật Chiến Dịch" : "Soạn Chiến Dịch Mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Mã Bài Viết
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={formData.MaTinTuc}
                    onChange={(e) =>
                      setFormData({ ...formData, MaTinTuc: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Tiêu Đề (*)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={formData.TieuDe}
                    onChange={(e) =>
                      setFormData({ ...formData, TieuDe: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Ảnh Bìa / Banner
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {formData.HinhAnh ? (
                    <div className="relative w-40 h-28 rounded-lg overflow-hidden group shrink-0 border border-slate-200 shadow-sm">
                      <img
                        src={getImageUrl(formData.HinhAnh)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors backdrop-blur-md">
                          <Edit size={14} />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="w-40 h-28 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all shrink-0">
                      <Upload size={24} className="mb-2" />
                      <span className="text-[10px] font-bold">Tải ảnh lên</span>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all mt-2"
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    value={formData.HinhAnh}
                    onChange={(e) =>
                      setFormData({ ...formData, HinhAnh: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Mô tả ngắn (Teaser)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Mô tả tóm tắt thu hút độc giả..."
                  value={formData.Abstract}
                  onChange={(e) =>
                    setFormData({ ...formData, Abstract: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nội Dung Chi Tiết (*)
                </label>
                <textarea
                  rows={10}
                  className="w-full bg-slate-50 border-none rounded-lg px-5 py-4 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none custom-scrollbar font-medium leading-relaxed"
                  placeholder="Soạn nội dung bài viết..."
                  value={formData.NoiDung}
                  onChange={(e) =>
                    setFormData({ ...formData, NoiDung: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Trạng Thái
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                    value={formData.TrangThai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        TrangThai: e.target.value as any,
                      })
                    }
                  >
                    <option value="Published">Xuất bản (Hiển thị ngay)</option>
                    <option value="Draft">Bản nháp (Lưu tạm)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Ghi chú nội bộ
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Ghi chú cho BTV khác..."
                    value={formData.GhiChu}
                    onChange={(e) =>
                      setFormData({ ...formData, GhiChu: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 items-center">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={submitForm}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Lưu Chiến Dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Area for PDF Export */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          ref={printRef}
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            background: "#fff",
            color: "#000",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #333",
              paddingBottom: "10mm",
              marginBottom: "10mm",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                margin: "0 0 5px 0",
                color: "#1a1a1a",
                fontWeight: "bold",
              }}
            >
              VTSC PAINTPRO
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
              HỆ THỐNG QUẢN TRỊ TIN TỨC & TRUYỀN THÔNG
            </p>
          </div>

          {/* Metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10mm",
              fontSize: "12px",
            }}
          >
            <div>
              <strong>Mã bài viết:</strong> {formData.MaTinTuc}
              <br />
              <strong>Người đăng:</strong>{" "}
              {formData.NhanVienDang?.HoTen || "Admin"}
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Ngày lập:</strong>{" "}
              {new Date().toLocaleDateString("vi-VN")}
              <br />
              <strong>Trạng thái:</strong> {formData.TrangThai}
            </div>
          </div>

          {/* Banner Image */}
          {formData.HinhAnh && (
            <div style={{ marginBottom: "10mm" }}>
              <img
                src={getImageUrl(formData.HinhAnh)}
                alt="Banner"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "400px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}

          {/* Article Title */}
          <h2
            style={{
              fontSize: "24px",
              marginBottom: "5mm",
              color: "#000",
              borderLeft: "5px solid #000",
              paddingLeft: "15px",
            }}
          >
            {formData.TieuDe}
          </h2>

          {/* Teaser */}
          {formData.Abstract && (
            <div
              style={{
                background: "#f9f9f9",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "10mm",
                borderLeft: "3px solid #666",
                fontStyle: "italic",
              }}
            >
              <strong>Tóm tắt quảng cáo:</strong> {formData.Abstract}
            </div>
          )}

          {/* Main Content */}
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              textAlign: "justify",
            }}
          >
            {formData.NoiDung || "Không có nội dung chi tiết."}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "30mm",
              borderTop: "1px solid #eee",
              paddingTop: "10mm",
              textAlign: "center",
              color: "#999",
              fontSize: "11px",
            }}
          >
            <p>© 2024 VTSC PaintPro. Tất cả các quyền được bảo lưu.</p>
            <p>Tài liệu này được trích xuất từ hệ thống quản trị nội bộ.</p>
          </div>
        </div>
      </div>

      {/* Modern Detail View (READ ONLY) */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-[110] flex justify-center bg-slate-100 p-0 md:p-8 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
          <div className="bg-white md:rounded-xl w-full max-w-5xl flex flex-col shadow-sm relative min-h-full md:min-h-0 md:my-auto md:h-max overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header / Breadcrumb */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span className="cursor-pointer hover:text-blue-600 transition-colors">
                  Trang chủ
                </span>
                <span>/</span>
                <span className="cursor-pointer hover:text-blue-600 transition-colors">
                  Tin tức
                </span>
                <span>/</span>
                <span className="text-slate-800 font-bold truncate max-w-[200px] md:max-w-sm">
                  {formData.TieuDe}
                </span>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X size={16} /> Quay lại
              </button>
            </div>

            <div className="px-8 md:px-24 py-12 md:py-16 bg-white">
              {/* Tag */}
              <div className="inline-flex items-center px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full font-bold text-[11px] uppercase tracking-widest mb-6">
                {formData.Abstract || "Góc Nhìn Nghệ Thuật"}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-sans font-bold text-slate-900 leading-[1.3] mb-8">
                {formData.TieuDe}
              </h1>

              {/* Author Info */}
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-lg">
                  {formData.NhanVienDang?.HoTen?.charAt(0) || "T"}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {formData.NhanVienDang?.HoTen || "Trần Quản Trị"}
                  </div>
                  <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <FileText size={12} />{" "}
                    {formData.createdAt
                      ? new Date(formData.createdAt).toLocaleDateString(
                          "vi-VN",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )
                      : "Thứ Tư, 22/05/2026"}
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {formData.HinhAnh && (
                <div className="w-full mb-12 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <img
                    src={getImageUrl(formData.HinhAnh)}
                    className="w-full h-auto object-cover max-h-[600px]"
                    alt="Cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-slate prose-lg max-w-none font-sans text-slate-700 leading-[2] prose-headings:font-sans prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl whitespace-pre-wrap">
                {formData.NoiDung}
              </div>

              {/* Footer / Tags */}
              <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900">
                    Tags:
                  </span>
                  <span className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer">
                    Sơn Nội Thất
                  </span>
                  <span className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer">
                    Sơn Ngoại Thất
                  </span>
                  <span className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer">
                    Kiến Thức Ngành Sơn
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-500">
                    Chia sẻ:
                  </span>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <Megaphone size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <Send size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <FileText size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
