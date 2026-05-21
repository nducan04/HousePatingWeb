"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, CheckCircle, Loader2, AreaChart } from "lucide-react";

interface IPFSUploaderProps {
  onUploadSuccess?: (cid: string) => void;
}

export default function IPFSUploader({ onUploadSuccess }: IPFSUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file ảnh hợp lệ (PNG, JPG, WEBP, GIF, ...).");
      return;
    }

    setIsUploading(true);
    setError(null);
    setCid(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã xảy ra lỗi trong quá trình upload");
      }

      if (data.IpfsHash) {
        setCid(data.IpfsHash);
        if (onUploadSuccess) {
          onUploadSuccess(data.IpfsHash);
        }
      } else {
        throw new Error("Không tìm thấy mã CID từ API phản hồi.");
      }
    } catch (err: any) {
      console.error("Lỗi upload:", err);
      setError(err.message || "Không thể tải ảnh lên IPFS. Vui lòng kiểm tra lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${dragActive
            ? "border-blue-500 bg-blue-50/50 shadow-sm"
            : "border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-black text-slate-500 animate-pulse tracking-wide">
              Đang upload ảnh lên mạng lưới IPFS...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 group">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/60 text-slate-400 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-7 h-7 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                Nhấn hoặc kéo thả ảnh để upload lên IPFS
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Hỗ trợ định dạng PNG, JPG, GIF, WEBP...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Success Alert */}
      {cid && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50/80 border border-emerald-100 rounded-xl text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-xs font-black text-emerald-900">Upload IPFS thành công!</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono break-all bg-white py-1 px-2 rounded-lg border border-emerald-100 select-all selection:bg-emerald-200 flex-1 text-emerald-700">
                {cid}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-xs font-bold bg-rose-50 border border-rose-100 text-rose-600 rounded-xl animate-in fade-in duration-300">
          {error}
        </div>
      )}
    </div>
  );
}
