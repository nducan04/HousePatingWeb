"use client";

import React, { useState } from "react";
import { X, Star, ShoppingCart, Loader2, ChevronLeft, ChevronRight, CheckCircle2, QrCode } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import { QRCodeCanvas } from "qrcode.react";
import { paintColors } from "@/lib/data/colors-data";
import { useAuthStore } from "@/lib/store/authStore";

interface CustomerProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (sp: any, quantity: number, colorCode?: string) => void;
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
  const [selectedColorCode, setSelectedColorCode] = useState<string>("");

  const { user } = useAuthStore();
  const getDisplayPrice = (basePrice: number) => {
    if (!basePrice) return 0;
    const multiplier = user?.role === 'KhachHangB2B' ? 1.2 : 1.3;
    return basePrice * multiplier;
  };

  React.useEffect(() => {
    setSelectedColorCode("");
  }, [product]);

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
    if (product.DanhSachMaMau && product.DanhSachMaMau.length > 0 && !selectedColorCode) {
      alert("Vui lòng chọn màu sơn mong muốn ở bên dưới trước khi thêm vào giỏ hàng!");
      return;
    }
    onAddToCart(product, quantity, selectedColorCode);
    setSuccessMsg("Đã thêm vào giỏ!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const ratings = product.DanhGia || [];
  const avgRating = ratings.length > 0 ? Number((ratings.reduce((acc: number, r: any) => acc + (r.SoSao || 0), 0) / ratings.length).toFixed(1)) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl md:h-[85vh] max-h-[800px] min-h-[550px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200/80 shadow-sm"
        >
          <X size={18} />
        </button>

        {/* Cột trái: Hình ảnh */}
        <div className="w-full md:w-1/2 relative bg-slate-50 md:h-full min-h-[350px] flex items-center justify-center p-6 overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-slate-700 hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md border border-slate-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNextImg}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-slate-700 hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md border border-slate-200"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIndex ? "bg-blue-600 w-4" : "bg-slate-300"}`}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
             <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${product.TongTonKho > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {product.TongTonKho > 0 ? 'Còn hàng' : 'Hết hàng'}
             </span>
             <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold uppercase tracking-wider">
               {product.PhanLoai}
             </span>
          </div>
        </div>

        {/* Cột phải: Thông tin */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col md:h-full overflow-y-auto custom-scrollbar bg-white">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">{product.ThuongHieu}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">{product.TenDongSon}</h2>
          
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1">
              <Star size={16} className={avgRating > 0 ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
              <span className="text-sm text-slate-700 font-bold ml-1">{avgRating > 0 ? `${avgRating}` : "Chưa có"}</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-500 font-medium">{ratings.length} đánh giá</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-500 font-medium">Đã bán: <span className="text-slate-800 font-bold">{product.SoLuongDaBan || 0}</span></span>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-extrabold text-emerald-600">{getDisplayPrice(product.DonGiaCoSo).toLocaleString()} ₫</span>
            <span className="text-slate-500 ml-2 text-sm">/ {product.DonViTinh || "Thùng"}</span>
          </div>
          
          <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
            {product.MoTa || "Sản phẩm này chưa có bài mô tả chi tiết."}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Mã sản phẩm</p>
                <p className="text-slate-800 font-semibold">{product.MaSanPham}</p>
             </div>
             <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Tồn kho hiện tại</p>
                <p className="text-slate-800 font-semibold">{product.TongTonKho} {product.DonViTinh}</p>
             </div>
          </div>

          {product.DanhSachMaMau && product.DanhSachMaMau.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Chọn Màu Sắc</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[260px] overflow-y-auto custom-scrollbar shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Màu</th>
                      <th className="py-2.5 px-4 font-semibold">Mã Màu</th>
                      <th className="py-2.5 px-4 font-semibold">Tên Màu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.DanhSachMaMau.map((c: any) => (
                      <tr 
                        key={c.MaMau} 
                        onClick={() => setSelectedColorCode(prev => prev === c.MaMau ? "" : c.MaMau)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${selectedColorCode === c.MaMau ? 'bg-blue-50/80' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="w-7 h-7 rounded-full shadow-inner border border-slate-300 flex items-center justify-center relative" style={{ backgroundColor: paintColors.find((pc) => pc.code === c.MaMau)?.hex || c.HexCode || '#ccc' }}>
                            {selectedColorCode === c.MaMau && (
                              <CheckCircle2 size={16} className="text-white fill-blue-600 drop-shadow-sm absolute" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{c.MaMau}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{paintColors.find((pc) => pc.code === c.MaMau)?.name || c.TenMau}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QR Code Truy xuất nguồn gốc */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
              <QRCodeCanvas
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace/${product._id}`}
                size={70}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"Q"}
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <QrCode size={16} className="text-blue-600" />
                Truy xuất nguồn gốc
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-2">
                Khách hàng có thể quét mã QR này để xem thông tin hóa đơn, ngày sản xuất, hạn sử dụng và quy trình.
              </p>
              <a
                href={`/trace/${product._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Xem trước trang truy xuất ↗
              </a>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
            {product.TongTonKho > 0 ? (
              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={cartLoading === product._id}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
              <div className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-xl text-center">
                Sản phẩm tạm thời hết hàng
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
