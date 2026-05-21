"use client";

// ═══════════════════════════════════════════════════════════
//  Luồng dữ liệu IPFS:
//  1. Người dùng chọn / kéo thả ảnh → file được lưu vào state
//  2. Gọi POST /api/upload-ipfs với multipart/form-data
//  3. API trả về { IpfsHash: "Qm..." }  →  lưu vào state `imageCid`
//  4. Ghép URL công khai: https://gateway.pinata.cloud/ipfs/${imageCid}
//  5. Render <img> preview + nút X để reset
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Droplets,
  X,
  User as UserIcon,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

// ─── IPFS Gateway công khai ──────────────────────────────
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";

// ─── Sub-component: IPFS Image Dropzone ─────────────────
function IpfsDropzone({
  onCidChange,
}: {
  onCidChange: (cid: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageCid, setImageCid] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Gọi API upload ──────────────────────────────────────
  const uploadToIPFS = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ định dạng ảnh (PNG, JPG, WEBP...)");
      return;
    }
    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh vượt quá giới hạn 10MB");
      return;
    }

    setError("");
    setIsUploading(true); // ── Bắt đầu trạng thái loading

    try {
      const fd = new FormData();
      fd.append("file", file);

      // POST multipart/form-data → Next.js API route
      const res = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      // ── Lưu CID, thông báo lên parent form ──────────────
      setImageCid(data.IpfsHash);
      onCidChange(data.IpfsHash);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi upload lên IPFS");
    } finally {
      setIsUploading(false); // ── Kết thúc loading
    }
  };

  // ── Xử lý chọn file từ input ────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToIPFS(file);
    // Reset input để cho phép chọn lại cùng file
    e.target.value = "";
  };

  // ── Xử lý kéo thả ──────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToIPFS(file);
  };

  // ── Xóa ảnh, reset toàn bộ state ───────────────────────
  const handleRemove = () => {
    setImageCid("");
    setError("");
    onCidChange("");
  };

  // ── URL công khai từ CID ─────────────────────────────────
  const publicUrl = imageCid ? `${IPFS_GATEWAY}/${imageCid}` : "";

  // ═══════════ RENDER ════════════════════════════════════
  return (
    <div className="space-y-3">
      {/* ── State 3: Đã upload thành công → Hiển thị preview ── */}
      {imageCid ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          {/* Ảnh preview dạng object-cover */}
          <img
            src={publicUrl}
            alt="IPFS preview"
            className="w-full h-56 object-cover rounded-xl"
          />

          {/* Overlay thông tin CID */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white/70 font-mono leading-tight truncate">
              CID: {imageCid}
            </p>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-300 hover:text-blue-200 font-semibold underline"
              onClick={(e) => e.stopPropagation()}
            >
              Xem trên IPFS Gateway ↗
            </a>
          </div>

          {/* Nút X xóa ảnh — góc trên bên phải */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-md backdrop-blur-sm z-10"
            title="Xóa ảnh"
          >
            <X size={13} strokeWidth={2.5} />
          </button>

          {/* Badge trạng thái */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md">
            <CheckCircle2 size={10} />
            Đã lưu IPFS
          </div>
        </div>
      ) : (
        // ── State 1 & 2: Chưa có ảnh hoặc đang upload ──────
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-purple-400 bg-purple-50/60 scale-[1.01]"
              : isUploading
              ? "border-blue-300 bg-blue-50/50 cursor-wait"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            // ── State 2: Đang upload ─────────────────────────
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2
                  size={24}
                  className="text-blue-600 animate-spin"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Đang tải lên IPFS...
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vui lòng chờ, quá trình này có thể mất vài giây
                </p>
              </div>
              {/* Animated progress bar */}
              <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            // ── State 1: Chờ chọn file ───────────────────────
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isDragOver
                    ? "bg-purple-100 text-purple-600 scale-110"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDragOver ? (
                  <CloudUpload size={24} />
                ) : (
                  <ImagePlus size={24} />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-600">
                  {isDragOver
                    ? "Thả ảnh vào đây!"
                    : "Kéo thả ảnh hoặc click để chọn"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, WEBP — Tối đa 10MB · Lưu trên IPFS phi tập trung
                </p>
              </div>
            </div>
          )}

          {/* Input file ẩn */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* ── Thông báo lỗi ─────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Main Page: Form Tạo Yêu cầu R&D
// ═══════════════════════════════════════════════════════════
export default function NewRDRequestPage() {
  const { user } = useAuthStore();
  const isCustomer =
    user?.role === "KhachHangB2B" || user?.role === "KhachHangB2C";
  const backPath = isCustomer ? "/" : "/rd-tracking";

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryColorCode = searchParams ? searchParams.get("colorCode") || "" : "";
  const queryColorName = searchParams ? searchParams.get("colorName") || "" : "";

  const displayName =
    user?.profile?.HoTen ||
    user?.profile?.TenKhachHang ||
    user?.username ||
    "";

  const [formData, setFormData] = useState({
    customer: "",
    colorCode: queryColorCode,
    colorName: queryColorName,
    surface: "",
    substrate: "",
    requirements: "",
    deadline: "",
  });

  // CID trả về từ IPFS sau khi upload thành công
  const [imageCid, setImageCid] = useState<string>("");

  useEffect(() => {
    if (isCustomer && displayName) {
      setFormData((prev) => ({ ...prev, customer: displayName }));
    }
  }, [isCustomer, displayName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Lưu vào localStorage kèm CID ảnh
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
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${now.getFullYear()}`;

      const nextId = `REQ-${String(requests.length + 1).padStart(3, "0")}`;
      const newRequest = {
        id: nextId,
        customer: formData.customer,
        colorCode: formData.colorCode,
        surface: formData.surface,
        status: "pending",
        date: dateStr,
        deadline: formData.deadline,
        // ── Lưu CID ảnh IPFS vào request ─────────────────
        imageCid: imageCid || null,
        imageUrl: imageCid ? `${IPFS_GATEWAY}/${imageCid}` : null,
      };

      requests.push(newRequest);
      localStorage.setItem("sampleRequests", JSON.stringify(requests));
    }

    alert("✅ Yêu cầu R&D đã được tạo thành công! (Version 1.0)");
    router.push(backPath);
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
            {/* Khách hàng */}
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

            {/* Mã màu */}
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

            {/* Tên màu */}
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

            {/* Loại bề mặt */}
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

            {/* Substrate */}
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

            {/* Deadline */}
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

          {/* Yêu cầu chi tiết */}
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

          {/* ══════════════════════════════════════════════════
               IPFS IMAGE UPLOAD — Tích hợp Dropzone + Preview
               Luồng: Chọn ảnh → POST /api/upload-ipfs → nhận CID
                       → ghép URL Gateway → hiển thị <img> preview
          ═══════════════════════════════════════════════════ */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
              Ảnh Màu Tham chiếu
              <span className="text-[10px] font-black text-purple-500 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                IPFS · Phi tập trung
              </span>
            </label>

            {/* Dropzone component — nhận callback khi có CID mới */}
            <IpfsDropzone onCidChange={setImageCid} />

            {/* Hiển thị CID text nếu đã upload */}
            {imageCid && (
              <p className="text-[11px] text-slate-400 font-mono px-1">
                <span className="text-slate-500 font-bold">CID:</span>{" "}
                {imageCid}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-2">
            <Link
              href={backPath}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
            >
              <Plus size={18} /> Tạo Yêu cầu (v1.0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
