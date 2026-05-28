"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils/imageUrl";

interface IPFSImageProps {
  cid: string;
  alt?: string;
  className?: string; 
}

export default function IPFSImage({ cid, alt = "Image", className = "" }: IPFSImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const finalUrl = resolveImageUrl(cid);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 border border-slate-200/50 ${className}`}>
      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 animate-pulse z-10">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-[9px] text-slate-400 font-bold mt-1.5 tracking-wider">Loading...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError || !finalUrl ? (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-400 text-center min-h-[150px] w-full h-full">
          <span className="text-xs font-black text-rose-500">Lỗi tải ảnh</span>
        </div>
      ) : (
        <img
          src={finalUrl}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full object-cover rounded-xl shadow-sm transition-all duration-500 ${
            isLoading ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        />
      )}
    </div>
  );
}
