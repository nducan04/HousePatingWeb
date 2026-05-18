"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, Droplets, X, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export default function NewRDRequestPage() {
  const { user } = useAuthStore();
  const isCustomer = user?.role === "KhachHangB2B" || user?.role === "KhachHangB2C";
  const backPath = isCustomer ? "/" : "/rd-tracking";

  const router = useRouter();
  
  const displayName =
    user?.profile?.HoTen ||
    user?.profile?.TenKhachHang ||
    user?.username ||
    "";

  const [formData, setFormData] = useState({
    customer: "",
    colorCode: "",
    colorName: "",
    surface: "",
    substrate: "",
    requirements: "",
    deadline: "",
  });

  useEffect(() => {
    if (isCustomer && displayName) {
      setFormData(prev => ({ ...prev, customer: displayName }));
    }
  }, [isCustomer, displayName]);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save to localStorage
    if (typeof window !== "undefined") {
      const storedRequests = localStorage.getItem("sampleRequests");
      let requests = [];
      if (storedRequests) {
        requests = JSON.parse(storedRequests);
      } else {
        requests = [
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
      }

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

      const nextId = `REQ-${String(requests.length + 1).padStart(3, "0")}`;
      const newRequest = {
        id: nextId,
        customer: formData.customer,
        colorCode: formData.colorCode,
        surface: formData.surface,
        status: "pending",
        date: dateStr,
        deadline: formData.deadline,
      };

      requests.push(newRequest);
      localStorage.setItem("sampleRequests", JSON.stringify(requests));
    }

    alert("✅ Yêu cầu R&D đã được tạo thành công! (Version 1.0)");
    router.push(backPath);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const names = Array.from(e.dataTransfer.files).map((f) => f.name);
    setFiles((prev) => [...prev, ...names]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      <Link
        href={backPath}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium transition-colors mb-6 group no-underline"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Quay lại
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

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Khách hàng *
              </label>
              {isCustomer ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 flex items-center gap-2 cursor-not-allowed">
                  <UserIcon size={16} /> {formData.customer}
                </div>
              ) : (
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
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
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Mã Màu Mục tiêu *
              </label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                type="text"
                placeholder="VD: INT-D2525"
                required
                value={formData.colorCode}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, colorCode: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Tên Màu
              </label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                type="text"
                placeholder="VD: Silver Metallic"
                value={formData.colorName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, colorName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Loại Bề mặt *
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
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

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Lớp nền (Substrate)
              </label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                type="text"
                placeholder="VD: Primer + Topcoat"
                value={formData.substrate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, substrate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                Hạn pha chế *
              </label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                type="date"
                required
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, deadline: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
              Yêu cầu Chi tiết
            </label>
            <textarea
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
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
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                  ? "border-purple-500 bg-purple-50/50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
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
              href={backPath}
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
