"use client";

import React, { useState } from "react";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageCarouselProps {
  product: any;
  className?: string;
}

export default function ProductImageCarousel({ product, className = "w-full h-full" }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Extract all images
  let images: string[] = [];
  if (product) {
    if (Array.isArray(product.HinhAnh)) {
      images = product.HinhAnh.filter((i: string) => i && i.trim() !== "");
    } else if (typeof product.HinhAnh === "string" && product.HinhAnh.trim() !== "") {
      images = [product.HinhAnh];
    }
    
    // Nếu cần ảnh từ mã màu
    if (product.DanhSachMaMau && Array.isArray(product.DanhSachMaMau)) {
      product.DanhSachMaMau.forEach((color: any) => {
        if (color.HinhAnh && typeof color.HinhAnh === "string" && color.HinhAnh.trim() !== "" && !images.includes(color.HinhAnh)) {
          images.push(color.HinhAnh);
        }
      });
    }
  }

  // Fallback
  if (images.length === 0) {
    return (
      <img
        src={`https://ui-avatars.com/api/?name=VTSC+Product&background=random`}
        alt={product?.TenDongSon || "Sản phẩm"}
        className={`object-cover ${className}`}
      />
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`relative group/carousel overflow-hidden ${className}`}>
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img
            key={idx}
            src={resolveImageUrl(img, "https://ui-avatars.com/api/?name=VTSC+Product&background=random")}
            alt={`${product?.TenDongSon || "Sản phẩm"} - ${idx + 1}`}
            className="w-full h-full object-cover flex-shrink-0 transition-transform duration-500 group-hover/carousel:scale-110"
          />
        ))}
      </div>
      
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all z-10"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all z-10"
          >
            <ChevronRight size={16} />
          </button>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
