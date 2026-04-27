"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Layers,
  Droplet,
  Box,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Eye,
  Star
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import * as XLSX from "xlsx";

interface MaMau {
  _id: string;
  MaMau: string;
  TenMau: string;
  HexCode: string;
  TrangThai: boolean;
}

interface DanhGia {
  _id?: string;
  KhachHang: string;
  SoSao: number;
  BinhLuan: string;
  NgayDanhGia: string;
}

interface SanPham {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  ThuongHieu: string;
  PhanLoai: string;
  DonGiaCoSo: number;
  MaMau: string;
  DanhSachMaMau?: MaMau[];
  MoTa?: string;
  DonViTinh?: string;
  TonKho?: number;
  SoLuongDaBan?: number;
  DanhGia?: DanhGia[];
  HinhAnh?: string;
  MoTaSanPham?: string;
}

export default function SanPhamPage() {
  const { user } = useAuthStore();
  const isAdminOrEmployee = user?.role === "Admin" || user?.role === "NhanVien";

  const [sanPhams, setSanPhams] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartLoading, setCartLoading] = useState("");
  const [cartMessage, setCartMessage] = useState({ id: "", text: "" });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: "",
    MaSanPham: "",
    TenDongSon: "",
    MaMau: "",
    ThuongHieu: "AkzoNobel",
    PhanLoai: "Sơn tĩnh điện",
    DonGiaCoSo: 0,
    MoTa: "",
    DonViTinh: "Thùng",
    TonKho: 0,
    HinhAnh: "",
    MoTaSanPham: "",
  });

  const [isUploading, setIsUploading] = useState(false);

  const fetchSanPhams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterType !== "all") params.append("phanLoai", filterType);
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      const res = await api.get(`/san-pham-son?${params.toString()}`);
      if (res.data.success) {
        setSanPhams(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching san pham:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSanPhams();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType, currentPage]);

  const addToCart = async (sp: SanPham) => {
    setCartLoading(sp._id);
    try {
      const sessionId = user?.id || "GUEST_SESSION";
      const res = await api.post(`/gio-hang/${sessionId}`, {
        SanPhamId: sp._id,
        SoLuong: 1,
      });
      if (res.data.success) {
        setCartMessage({ id: sp._id, text: "Đã thêm!" });
        setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
      }
    } catch (err) {
      console.error(err);
      setCartMessage({ id: sp._id, text: "Lỗi!" });
      setTimeout(() => setCartMessage({ id: "", text: "" }), 2000);
    } finally {
      setCartLoading("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/san-pham-son/${formData._id}`, formData);
      } else {
        const { _id, ...dataToCreate } = formData;
        await api.post("/san-pham-son", dataToCreate);
      }
      setIsModalOpen(false);
      fetchSanPhams();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Có lỗi xảy ra khi lưu!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa dòng sơn này?")) return;
    try {
      await api.delete(`/san-pham-son/${id}`);
      fetchSanPhams();
    } catch (error) {
      alert("Không thể xóa sản phẩm!");
    }
  };

  const openForm = (item?: SanPham) => {
    if (item) {
      setFormData({
        _id: item._id,
        MaSanPham: item.MaSanPham,
        TenDongSon: item.TenDongSon,
        MaMau: item.MaMau || "",
        ThuongHieu: item.ThuongHieu,
        PhanLoai: item.PhanLoai,
        DonGiaCoSo: item.DonGiaCoSo,
        MoTa: item.MoTa || "",
        DonViTinh: item.DonViTinh || "Thùng",
        TonKho: item.TonKho || 0,
        HinhAnh: item.HinhAnh || "",
        MoTaSanPham: item.MoTaSanPham || "",
      });
    } else {
      setFormData({
        _id: "",
        MaSanPham: "SP" + Date.now().toString().slice(-4),
        TenDongSon: "",
        MaMau: "",
        ThuongHieu: "AkzoNobel",
        PhanLoai: "Sơn tĩnh điện",
        DonGiaCoSo: 0,
        MoTa: "",
        DonViTinh: "Thùng",
        TonKho: 0,
        HinhAnh: "",
        MoTaSanPham: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append("image", file);

    try {
      setIsUploading(true);
      const res = await api.post("/files/upload-image", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setFormData({ ...formData, HinhAnh: res.data.url });
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Không thể upload ảnh, vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewProduct = (product: SanPham) => {
    setSelectedProduct(product);
    setIsViewOpen(true);
  };

  const exportToExcel = () => {
    const dataToExport = sanPhams.map((sp) => ({
      "Mã SP": sp.MaSanPham,
      "Tên Dòng Sơn": sp.TenDongSon,
      "Thương Hiệu": sp.ThuongHieu,
      "Phân Loại": sp.PhanLoai,
      "Đơn Giá": sp.DonGiaCoSo,
      "Tồn Kho": sp.TonKho || 0,
      "Đơn Vị Tính": sp.DonViTinh || "Thùng",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "San-Pham");
    XLSX.writeFile(
      workbook,
      `VTSC_Danh_Sach_San_Pham_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`,
    );
  };

  const STATS = {
    total: sanPhams.length,
    tinhDien: sanPhams.filter((t) => t.PhanLoai === "Sơn tĩnh điện").length,
    tauBien: sanPhams.filter((t) => t.PhanLoai === "Sơn tàu biển").length,
    congNghiep: sanPhams.filter((t) => t.PhanLoai === "Sơn công nghiệp").length,
  };

  const getAvatarUrl = (path: string) => {
    if (!path || path === 'undefined' || path === 'null') return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const origin = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000';
    return `${origin}${cleanPath}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Package size={22} />
            </div>
            Danh mục Sản phẩm
          </h1>
          <p className="text-slate-400 font-medium mt-1">Quản lý dòng sơn, thương hiệu và thông số kỹ thuật sản phẩm</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Tổng sản phẩm", value: STATS.total, unit: "Dòng sơn", icon: Package, color: "blue" },
          { label: "Sơn tĩnh điện", value: STATS.tinhDien, unit: "Dòng", icon: Layers, color: "emerald" },
          { label: "Sơn tàu biển", value: STATS.tauBien, unit: "Dòng", icon: Droplet, color: "purple" },
          { label: "Sơn công nghiệp", value: STATS.congNghiep, unit: "Dòng", icon: Box, color: "amber" },
        ].map((item, i) => (
          <div key={i} className="kpi-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{item.value} <span className="text-sm font-bold text-slate-400">{item.unit}</span></h3>
              </div>
              <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tìm mã SP, tên dòng sơn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: "all", label: "Tất cả" },
                { id: "Sơn tĩnh điện", label: "Tĩnh điện" },
                { id: "Sơn tàu biển", label: "Tàu biển" },
                { id: "Sơn công nghiệp", label: "Công nghiệp" },
              ].map(f => (
                <button
                  key={f.id}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${filterType === f.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  onClick={() => setFilterType(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
            >
              <Download size={18} /> Xuất Excel
            </button>
            {isAdminOrEmployee && (
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                onClick={() => openForm()}
              >
                <Plus size={18} /> Thêm Sản phẩm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="w-20 text-center">Ảnh</th>
                <th>Mã SP</th>
                <th>Dòng sản phẩm</th>
                <th>Thương hiệu / Loại</th>
                <th>Đơn giá</th>
                <th className="text-right">Tồn kho</th>
                <th className="text-center">Phiên bản</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-20 text-blue-600 font-bold">Đang tải dữ liệu...</td></tr>
              ) : sanPhams.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">Không tìm thấy sản phẩm.</td></tr>
              ) : sanPhams.map(item => (
                <tr key={item._id} className="hover:bg-blue-50/30 group">
                  <td className="text-center">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm mx-auto group-hover:scale-105 transition-transform">
                      {item.HinhAnh ? (
                        <img
                          src={getAvatarUrl(item.HinhAnh)}
                          alt="Img"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.TenDongSon) + '&background=random';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[13px]">{item.MaSanPham}</span>
                  </td>
                  <td className="min-w-[200px]">
                    <div className="font-bold text-slate-900 text-[15px] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleViewProduct(item)}>
                      {item.TenDongSon}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider line-clamp-1">{item.MoTa || 'Chưa có mô tả ngắn'}</div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800 text-[14px]">{item.ThuongHieu}</div>
                    <div className="text-[12px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">{item.PhanLoai}</div>
                  </td>
                  <td>
                    <div className="font-black text-emerald-600 text-[15px]">{item.DonGiaCoSo.toLocaleString()} ₫</div>
                    <div className="text-[11px] text-slate-400 font-bold">per {item.DonViTinh}</div>
                  </td>
                  <td className="text-right">
                    <div className={`font-black text-[16px] ${(item.TonKho || 0) < 10 ? 'text-rose-500' : 'text-slate-900'}`}>
                      {item.TonKho || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.DonViTinh}</div>
                  </td>
                  <td className="text-center">
                    <span className="status-badge status-active">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      {item.DanhSachMaMau?.length || 0} SKU
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer shadow-sm" title="Thêm vào giỏ">
                        <ShoppingCart size={18} />
                      </button>
                      <button onClick={() => handleViewProduct(item)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                        <Eye size={18} />
                      </button>
                      {isAdminOrEmployee && (
                        <>
                          <button onClick={() => openForm(item)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-[13px] font-bold text-slate-400">Trang {currentPage} / {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`w-10 h-10 rounded-xl text-[13px] font-black transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hồ sơ sản phẩm: {selectedProduct.MaSanPham}</h2>
              <button onClick={() => setIsViewOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">×</button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1">
                  <div className="aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                    <img src={getAvatarUrl(selectedProduct.HinhAnh || '')} alt={selectedProduct.TenDongSon} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-6">
                  <div>
                    <span className="text-[11px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">{selectedProduct.PhanLoai}</span>
                    <h1 className="text-3xl font-black text-slate-900 mt-2">{selectedProduct.TenDongSon}</h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-wider">{selectedProduct.ThuongHieu}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[24px]">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Đơn giá cơ sở</p>
                      <p className="text-2xl font-black text-emerald-600">{selectedProduct.DonGiaCoSo?.toLocaleString()} ₫</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Tồn kho hiện tại</p>
                      <p className="text-2xl font-black text-slate-900">{selectedProduct.TonKho || 0} <span className="text-sm text-slate-400">{selectedProduct.DonViTinh}</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Thông tin kỹ thuật & Mô tả</p>
                    <p className="text-slate-600 leading-relaxed font-medium">{selectedProduct.MoTa || 'Chưa có thông tin chi tiết.'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">Danh sách mã màu SKU ({selectedProduct.DanhSachMaMau?.length || 0})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {selectedProduct.DanhSachMaMau?.map((m, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center gap-2">
                      <div className="w-full aspect-square rounded-xl shadow-inner border border-slate-50" style={{ background: m.HexCode }}></div>
                      <span className="text-[11px] font-black text-slate-700">{m.MaMau}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">Phản hồi khách hàng</h3>
                <div className="space-y-4">
                  {selectedProduct.DanhGia?.length ? selectedProduct.DanhGia.map((dg, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-[24px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{dg.KhachHang}</span>
                        <span className="text-[12px] font-bold text-slate-400">{new Date(dg.NgayDanhGia).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < dg.SoSao ? "currentColor" : "none"} />)}
                      </div>
                      <p className="text-[14px] text-slate-600 font-medium">{dg.BinhLuan}</p>
                    </div>
                  )) : <p className="text-center py-10 text-slate-400 italic font-medium">Chưa có đánh giá nào.</p>}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-center">
              <button onClick={() => setIsViewOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Cập nhật thông tin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900">{formData._id ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">×</button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-colors cursor-pointer relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                  {formData.HinhAnh ? (
                    <div className="relative group/img">
                      <img src={getAvatarUrl(formData.HinhAnh)} alt="Product" className="w-40 h-40 rounded-3xl object-cover shadow-xl border-4 border-white" />
                      <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <Plus className="text-white" size={24} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors mb-3">
                        <Plus size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Tải ảnh sản phẩm</p>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã sản phẩm</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.MaSanPham} onChange={e => setFormData({ ...formData, MaSanPham: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Dòng sản phẩm</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.TenDongSon} onChange={e => setFormData({ ...formData, TenDongSon: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Phân loại</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.PhanLoai} onChange={e => setFormData({ ...formData, PhanLoai: e.target.value })}>
                    <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                    <option value="Sơn tàu biển">Sơn tàu biển</option>
                    <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                    <option value="Sơn nội thất">Sơn nội thất</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Thương hiệu</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.ThuongHieu} onChange={e => setFormData({ ...formData, ThuongHieu: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Đơn giá cơ sở</label>
                  <input type="number" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.DonGiaCoSo} onChange={e => setFormData({ ...formData, DonGiaCoSo: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Đơn vị tính</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.DonViTinh} onChange={e => setFormData({ ...formData, DonViTinh: e.target.value })}>
                    <option value="Thùng">Thùng</option>
                    <option value="Kg">Kg</option>
                    <option value="Lít">Lít</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mô tả chi tiết</label>
                  <textarea rows={4} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 resize-none" value={formData.MoTa} onChange={e => setFormData({ ...formData, MoTa: e.target.value })}></textarea>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">Hủy</button>
              <button onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Lưu sản phẩm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
