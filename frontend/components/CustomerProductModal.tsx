"use client";

import React, { useState } from "react";
import { X, Star, ShoppingCart, Loader2, ChevronLeft, ChevronRight, CheckCircle2, QrCode } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import { QRCodeCanvas } from "qrcode.react";

interface CustomerProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (sp: any, quantity: number) => void;
  cartLoading: string;
}

export default function CustomerProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  cartLoading
}: CustomerProductModalProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !product) return null;

  // Xử lý mảng hình ảnh
  let images: string[] = [];
  if (Array.isArray(product.HinhAnh)) {
    images = product.HinhAnh.filter((i: string) => i && i.trim() !== "");
  } else if (typeof product.HinhAnh === "string" && product.HinhAnh.trim() !== "") {
    images = [product.HinhAnh];
  }
  
  if (product.DanhSachMaMau && Array.isArray(product.DanhSachMaMau)) {
    product.DanhSachMaMau.forEach((color: any) => {
      if (color.HinhAnh && typeof color.HinhAnh === "string" && color.HinhAnh.trim() !== "" && !images.includes(color.HinhAnh)) {
        images.push(color.HinhAnh);
      }
    });
  }

  // Nếu mảng rỗng thì để ảnh mặc định
  if (images.length === 0) {
    images = [""];
  }

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const updateQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > product.TongTonKho) return product.TongTonKho;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (quantity > product.TongTonKho) {
      alert(`Trong kho chỉ còn ${product.TongTonKho} sản phẩm!`);
      return;
    }
    onAddToCart(product, quantity);
    setSuccessMsg("Đã thêm vào giỏ!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const ratings = product.DanhGia || [];
  const avgRating = ratings.length > 0 ? Number((ratings.reduce((acc: number, r: any) => acc + (r.SoSao || 0), 0) / ratings.length).toFixed(1)) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Cột trái: Hình ảnh */}
        <div className="w-full md:w-1/2 relative bg-slate-800/50 min-h-[300px] flex items-center p-6 overflow-hidden">
          <div 
            className="flex w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
          >
            {images.map((img, idx) => (
              <img 
                key={idx}
                src={resolveImageUrl(img, "https://ui-avatars.com/api/?name=VTSC+Product&background=random")} 
                alt={`${product.TenDongSon} - ${idx + 1}`} 
                className="w-full h-auto object-contain max-h-[400px] rounded-lg shadow-lg flex-shrink-0"
              />
            ))}
          </div>
          
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImg}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-blue-600 transition-colors border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNextImg}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-blue-600 transition-colors border border-white/10"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIndex ? "bg-blue-500 w-4" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
             <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${product.TongTonKho > 0 ? 'bg-emerald-500/90 text-white border border-emerald-400/30' : 'bg-red-500/90 text-white border border-red-400/30'}`}>
                {product.TongTonKho > 0 ? 'Còn hàng' : 'Hết hàng'}
             </span>
             <span className="px-3 py-1 bg-blue-600/90 text-white rounded-md text-[11px] font-bold uppercase tracking-wider border border-blue-400/30">
               {product.PhanLoai}
             </span>
          </div>
        </div>

        {/* Cột phải: Thông tin */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-[500px] overflow-y-auto custom-scrollbar">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">{product.ThuongHieu}</p>
          <h2 className="text-2xl font-bold text-white mb-3">{product.TenDongSon}</h2>
          
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-1">
              <Star size={16} className={avgRating > 0 ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
              <span className="text-sm text-slate-300 font-bold ml-1">{avgRating > 0 ? `${avgRating}` : "Chưa có"}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-400 font-medium">{ratings.length} đánh giá</span>
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-400 font-medium">Đã bán: <span className="text-white font-bold">{product.SoLuongDaBan || 0}</span></span>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-emerald-400">{(product.DonGiaCoSo || 0).toLocaleString()} ₫</span>
            <span className="text-slate-400 ml-2">/ {product.DonViTinh || "Kg"}</span>
          </div>
          
          <div className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-white/5 text-sm text-slate-300 leading-relaxed font-medium">
            {product.MoTa || "Sản phẩm này chưa có bài mô tả chi tiết."}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Mã sản phẩm</p>
                <p className="text-white font-medium">{product.MaSanPham}</p>
             </div>
             <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Tồn kho hiện tại</p>
                <p className="text-white font-medium">{product.TongTonKho} {product.DonViTinh}</p>
             </div>
          </div>

<<<<<<< Updated upstream
=======
          {product.DanhSachMaMau && product.DanhSachMaMau.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Chọn Màu Sắc</p>
              <div className="bg-slate-800/30 rounded-lg border border-white/5 overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400 text-xs">
                    <tr>
                      <th className="py-2 px-3 font-medium">Màu</th>
                      <th className="py-2 px-3 font-medium">Mã Màu</th>
                      <th className="py-2 px-3 font-medium">Tên Màu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {product.DanhSachMaMau.map((c: any) => (
                      <tr 
                        key={c.MaMau} 
                        onClick={() => setSelectedColorCode(c.MaMau)}
                        className={`cursor-pointer transition-colors hover:bg-white/5 ${selectedColorCode === c.MaMau ? 'bg-blue-600/20' : ''}`}
                      >
                        <td className="py-2 px-3">
                          <div className="w-6 h-6 rounded-full shadow-inner border border-white/10 flex items-center justify-center" style={{ backgroundColor: c.HexCode || '#ccc' }}>
                            {selectedColorCode === c.MaMau && <CheckCircle2 size={12} className="text-white drop-shadow-md" />}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-white font-medium">{c.MaMau}</td>
                        <td className="py-2 px-3 text-slate-300">{c.TenMau}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QR Code Truy xuất nguồn gốc */}
          <div className="mb-6 p-4 bg-slate-800/30 rounded-lg border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
              <QRCodeCanvas
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace/${product._id}`}
                size={70}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"Q"}
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                <QrCode size={16} className="text-blue-400" />
                Truy xuất nguồn gốc
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Khách hàng có thể quét mã QR này để xem thông tin hóa đơn, ngày sản xuất, hạn sử dụng và quy trình.
              </p>
              <a
                href={`/trace/${product._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
              >
                Xem trước trang truy xuất ↗
              </a>
            </div>
          </div>

>>>>>>> Stashed changes
          {/* Action Area */}
          <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
            {product.TongTonKho > 0 ? (
              <div className="flex gap-4">
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/10 w-32 h-12">
                  <button 
                    onClick={() => updateQuantity(-1)}
                    className="w-10 h-full flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-md font-bold transition-colors"
                  >-</button>
                  <input 
                    type="number" 
                    min="1" 
                    max={product.TongTonKho}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    className="w-full text-center bg-transparent border-none text-white font-bold outline-none"
                  />
                  <button 
                    onClick={() => updateQuantity(1)}
                    className="w-10 h-full flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-md font-bold transition-colors"
                  >+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={cartLoading === product._id}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {cartLoading === product._id ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : successMsg ? (
                    <><CheckCircle2 size={20} /> {successMsg}</>
                  ) : (
                    <><ShoppingCart size={20} /> Thêm vào giỏ hàng</>
                  )}
                </button>
              </div>
            ) : (
              <div className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-400 font-bold rounded-lg text-center">
                Sản phẩm tạm thời hết hàng
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
