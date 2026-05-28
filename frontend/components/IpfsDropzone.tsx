"use client";

import { useState, useRef } from "react";
import { CloudUpload, ImagePlus, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function IpfsDropzone({ onCidChange, size = "large" }: { onCidChange: (cid: string) => void, size?: "small" | "large" }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageCid, setImageCid] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";

  const uploadToIPFS = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ định dạng ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh vượt quá giới hạn 10MB");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      setImageCid(data.IpfsHash);
      onCidChange(data.IpfsHash);
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload lên IPFS");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToIPFS(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToIPFS(file);
  };

  const handleRemove = () => {
    setImageCid("");
    setError("");
    onCidChange("");
  };

  const publicUrl = imageCid ? `${IPFS_GATEWAY}/${imageCid}` : "";

  return (
    <div className="space-y-3">
      {imageCid ? (
        <div className={`relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 ${size === 'small' ? 'h-32' : 'h-56'}`}>
          <img src={publicUrl} alt="IPFS preview" className="w-full h-full object-cover rounded-xl" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white/70 font-mono leading-tight truncate">CID: {imageCid}</p>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-300 hover:text-blue-200 font-semibold underline" onClick={(e) => e.stopPropagation()}>Xem trên IPFS Gateway ↗</a>
          </div>
          <button type="button" onClick={handleRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-md backdrop-blur-sm z-10" title="Xóa ảnh"><X size={13} strokeWidth={2.5} /></button>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md"><CheckCircle2 size={10} />Đã lưu IPFS</div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl ${size === 'small' ? 'p-4' : 'p-8'} text-center cursor-pointer transition-all duration-200 ${isDragOver ? "border-purple-400 bg-purple-50/60 scale-[1.01]" : isUploading ? "border-blue-300 bg-blue-50/50 cursor-wait" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"}`}
          onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Loader2 size={20} className="text-blue-600 animate-spin" /></div>
              {size === 'large' && <div><p className="text-sm font-bold text-slate-700">Đang tải lên...</p></div>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDragOver ? "bg-purple-100 text-purple-600 scale-110" : "bg-slate-100 text-slate-400"}`}>
                {isDragOver ? <CloudUpload size={20} /> : <ImagePlus size={20} />}
              </div>
              <div>
                <p className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-bold text-slate-600`}>{isDragOver ? "Thả ảnh vào đây!" : "Kéo thả ảnh hoặc click"}</p>
                {size === 'large' && <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — Tối đa 10MB</p>}
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}
