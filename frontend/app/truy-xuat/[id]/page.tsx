"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Factory, Calendar, FileText, AlertCircle, Package } from "lucide-react";
import axios from "axios";

const getAvatarUrl = (path: any) => {
  let resolvedPath = path;
  if (Array.isArray(path)) {
    resolvedPath = path[0];
  }
  if (!resolvedPath || typeof resolvedPath !== "string" || resolvedPath === "undefined" || resolvedPath === "null") return "";
  if (resolvedPath.startsWith("http")) return resolvedPath;
  if (resolvedPath.startsWith("Qm") || resolvedPath.startsWith("bafy")) {
    return `https://gateway.pinata.cloud/ipfs/${resolvedPath}`;
  }
  const cleanPath = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
  const origin = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5000` : "http://localhost:5000";
  return `${origin}${cleanPath}`;
};

// Helper: Tự động format đoạn text dài có chứa gạch đầu dòng, dấu sao hoặc chữ in hoa thành HTML dễ nhìn
const formatTextToHTML = (text: string) => {
  if (!text) return "";
  let formatted = text
    .replace(/(?:\.\s+|\s|^)([-–+*])\s/g, '\n$1 ')
    .replace(/(?:\.\s+|\s|^)(\(\*\))\s/g, '\n$1 ')
    .replace(/\.\s+([A-ZÀ-Ỹ][A-ZÀ-Ỹ\s]{5,})/g, '.\n\n$1\n');

  return formatted.split('\n').map((line, index) => {
    if (!line.trim()) return <br key={index} />;
    const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 8 && !line.includes('–') && !line.includes('-');
    const isListItem = line.trim().startsWith('-') || line.trim().startsWith('–') || line.trim().startsWith('(*)') || line.trim().startsWith('+');
    
    return (
      <span 
        key={index} 
        className={`block ${isHeading ? 'font-bold text-slate-800 mt-3 mb-1 text-[13px]' : 'mb-1'} ${isListItem ? 'pl-3 relative before:content-[""] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-400 before:rounded-full' : ''}`}
      >
        {line}
      </span>
    );
  });
};

export default function TruyXuatNguonGocPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/san-pham-son/${id}`);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          setError("Không tìm thấy thông tin sản phẩm");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi khi truy xuất dữ liệu sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải thông tin truy xuất...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-800">Truy xuất thất bại</h1>
        <p className="text-slate-500 mt-2">{error || "Sản phẩm không tồn tại hoặc mã QR không hợp lệ."}</p>
      </div>
    );
  }

  const truyXuat = product.TruyXuatNguonGoc || {};
  const imageArray = Array.isArray(product.HinhAnh) ? product.HinhAnh : (product.HinhAnh ? [product.HinhAnh] : []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <CheckCircle2 size={48} className="mx-auto mb-3 text-white/90 relative z-10" />
          <h1 className="text-2xl font-bold relative z-10">Sản phẩm Chính hãng</h1>
          <p className="text-blue-100 mt-1 relative z-10 opacity-90 text-sm">
            Thông tin đã được xác thực qua hệ thống truy xuất nguồn gốc
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8">

          {/* Thông tin cơ bản */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {imageArray.length > 0 ? (
              <img
                src={getAvatarUrl(imageArray[0])}
                alt={product.TenDongSon}
                className="w-full md:w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-full md:w-32 h-32 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                <Package size={32} className="text-slate-400" />
              </div>
            )}

            <div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md mb-2">
                {product.MaSanPham}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{product.TenDongSon}</h2>
              <div className="text-sm text-slate-600">
                {product.MoTa ? formatTextToHTML(product.MoTa) : "Chưa có mô tả."}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Ngày sản xuất */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Calendar className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày sản xuất</p>
                <p className="font-semibold text-slate-900">
                  {truyXuat.NgaySanXuat ? new Date(truyXuat.NgaySanXuat).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {/* Hạn sử dụng */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hạn sử dụng</p>
                <p className="font-semibold text-slate-900">
                  {truyXuat.HanSuDung || "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {/* Quy trình sản xuất */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 md:col-span-2">
              <Factory className="text-green-500 shrink-0 mt-0.5" size={20} />
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quy trình sản xuất</p>
                <div className="text-sm text-slate-700 leading-relaxed">
                  {truyXuat.QuyTrinhSanXuat ? formatTextToHTML(truyXuat.QuyTrinhSanXuat) : "Hệ thống đang cập nhật chi tiết quy trình sản xuất."}
                </div>
              </div>
            </div>

            {/* Hóa đơn mua sơn */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 md:col-span-2">
              <FileText className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chứng từ / Hóa đơn</p>
                  <p className="text-sm text-slate-700">
                    {truyXuat.HoaDonMuaSon ? "Đã đính kèm chứng từ hợp lệ" : "Chưa có chứng từ đính kèm"}
                  </p>
                </div>
                {truyXuat.HoaDonMuaSon && (
                  <a
                    href={truyXuat.HoaDonMuaSon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-sm font-semibold transition-colors text-center"
                  >
                    Xem chứng từ
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Hệ thống truy xuất nguồn gốc sản phẩm © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
