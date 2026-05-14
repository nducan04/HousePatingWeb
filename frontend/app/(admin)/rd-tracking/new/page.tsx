"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, Droplets, X } from "lucide-react";
import Link from "next/link";

export default function NewRDRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer: "",
    colorCode: "",
    colorName: "",
    surface: "",
    substrate: "",
    requirements: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✅ Yêu cầu R&D đã được tạo thành công! (Version 1.0)");
    router.push("/rd-tracking");
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const names = Array.from(e.dataTransfer.files).map((f) => f.name);
    setFiles((prev) => [...prev, ...names]);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link
        href="/rd-tracking"
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
        style={{ marginBottom: "1.75rem" }}
      >
        <ArrowLeft size={16} /> Quay lại
      </Link>

      <div className="bg-white border border-slate-100 rounded-[24px] shadow-xl shadow-slate-100/50 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
            <Droplets size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Tạo Yêu cầu R&D Mới
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              Yêu cầu sẽ được tạo với Version 1.0
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.75rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Khách hàng *</label>
              <select
                className="form-select"
                required
                value={formData.customer}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, customer: e.target.value }))
                }
              >
                <option value="">Chọn khách hàng</option>
                <option value="NCC Aluminium">NCC Aluminium</option>
                <option value="VPIC Steel">VPIC Steel</option>
                <option value="Daikin Vietnam">Daikin Vietnam</option>
                <option value="Huihoang Interior">Huihoang Interior</option>
                <option value="Eurowindow">Eurowindow</option>
                <option value="Austdoor Group">Austdoor Group</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mã Màu Mục tiêu *</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                type="text"
                placeholder="VD: INT-D2525"
                required
                value={formData.colorCode}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, colorCode: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tên Màu</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                type="text"
                placeholder="VD: Silver Metallic"
                value={formData.colorName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, colorName: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Loại Bề mặt *</label>
              <select
                className="form-select"
                required
                value={formData.surface}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, surface: e.target.value }))
                }
              >
                <option value="">Chọn bề mặt</option>
                <option value="Nhôm định hình">Nhôm định hình</option>
                <option value="Nhôm đúc">Nhôm đúc</option>
                <option value="Nhôm thanh">Nhôm thanh</option>
                <option value="Thép tấm">Thép tấm</option>
                <option value="Thép ống">Thép ống</option>
                <option value="Thép cuộn">Thép cuộn</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lớp nền (Substrate)</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                type="text"
                placeholder="VD: Primer + Topcoat"
                value={formData.substrate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, substrate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "1.75rem" }}>
            <label className="form-label">Yêu cầu Chi tiết</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Mô tả yêu cầu kỹ thuật, độ bóng, ΔE cho phép, ứng dụng..."
              value={formData.requirements}
              onChange={(e) =>
                setFormData((p) => ({ ...p, requirements: e.target.value }))
              }
            />
          </div>

          {/* File Upload */}
          <div style={{ marginTop: "1.75rem" }}>
            <label
              className="form-label"
              style={{ marginBottom: "0.625rem", display: "block" }}
            >
              Ảnh/Tài liệu Đính kèm
            </label>
            <div
              className={`upload-zone ${dragOver ? "dragover" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload
                size={32}
                className="upload-icon"
                style={{ margin: "0 auto 0.625rem" }}
              />
              <p className="upload-text">
                Kéo thả file vào đây hoặc <strong>click để chọn</strong>
              </p>
              <p
                style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}
              >
                PNG, JPG, PDF — Tối đa 10MB
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const names = Array.from(e.target.files || []).map(
                    (f) => f.name,
                  );
                  setFiles((prev) => [...prev, ...names]);
                }}
              />
            </div>
            {files.length > 0 && (
              <div
                style={{
                  marginTop: "0.625rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="badge signed"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setFiles((fls) => fls.filter((_, j) => j !== i))
                    }
                  >
                    📎 {f} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1.125rem",
              justifyContent: "flex-end",
              marginTop: "2.25rem",
            }}
          >
            <Link
              href="/rd-tracking"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-6 py-3 text-base"
            >
              <Plus size={18} /> Tạo Yêu cầu (v1.0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
