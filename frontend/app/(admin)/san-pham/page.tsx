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
  Eye,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import * as XLSX from "xlsx";

interface MaMau {
  _id?: string;
  MaMau: string;
  TenMau: string;
  HexCode: string;
  HinhAnh?: string;
  TonKhoKhaDung: number;
  TonKhoTamGiu: number;
  NguongCanhBao: number;
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
  DanhSachMaMau?: MaMau[];
  MoTa?: string;
  DonViTinh?: string;
  TongTonKho?: number;
  SoLuongDaBan?: number;
  DanhGia?: DanhGia[];
  HinhAnh?: string;
  MoTaSanPham?: string;
}

// Mock Data để render giao diện đẹp mắt
const MOCK_DATA: SanPham[] = [
  {
    _id: "1",
    MaSanPham: "STD-EP01",
    TenDongSon: "Sơn Tĩnh Điện Epoxy Bóng Trong Nhà",
    ThuongHieu: "AkzoNobel",
    PhanLoai: "Sơn tĩnh điện",
    DonGiaCoSo: 65000,
    MoTa: "Sơn bột tĩnh điện Epoxy có độ bóng cao, chịu va đập tốt, chuyên dùng cho nội thất gia đình và văn phòng.",
    DonViTinh: "Kg",
    TongTonKho: 1250,
    HinhAnh: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&q=80&w=100&h=100",
    DanhSachMaMau: [{ MaMau: "WHT01", TenMau: "Trắng", HexCode: "#FFFFFF", TonKhoKhaDung: 500, TonKhoTamGiu: 0, NguongCanhBao: 100, TrangThai: true }]
  },
  {
    _id: "2",
    MaSanPham: "STB-PU05",
    TenDongSon: "Sơn Tàu Biển Chống Hà PU",
    ThuongHieu: "Jotun",
    PhanLoai: "Sơn tàu biển",
    DonGiaCoSo: 145000,
    MoTa: "Sơn phủ Polyurethane chống hà, chống ăn mòn nước biển, độ bền màu cao dùng cho mạn tàu.",
    DonViTinh: "Lít",
    TongTonKho: 0, // Test case hết hàng
    HinhAnh: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=100&h=100",
    DanhSachMaMau: []
  },
  {
    _id: "3",
    MaSanPham: "SCN-AK03",
    TenDongSon: "Sơn Công Nghiệp Alkyd Nhanh Khô",
    ThuongHieu: "Nippon",
    PhanLoai: "Sơn công nghiệp",
    DonGiaCoSo: 85000,
    MoTa: "Hệ sơn Alkyd khô nhanh, phù hợp sơn kết cấu thép mạ kẽm trong nhà xưởng.",
    DonViTinh: "Thùng",
    TongTonKho: 45,
    HinhAnh: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=100&h=100",
    DanhSachMaMau: []
  },
  {
    _id: "4",
    MaSanPham: "STD-PE02",
    TenDongSon: "Sơn Tĩnh Điện Polyester Ngoài Trời",
    ThuongHieu: "KCC",
    PhanLoai: "Sơn tĩnh điện",
    DonGiaCoSo: 72000,
    MoTa: "Kháng UV cực tốt, chống phai màu, chịu thời tiết khắc nghiệt. Phù hợp cho khung nhôm cửa kính.",
    DonViTinh: "Kg",
    TongTonKho: 320,
    HinhAnh: "https://images.unsplash.com/photo-1502325966718-85a90488dc29?auto=format&fit=crop&q=80&w=100&h=100",
    DanhSachMaMau: []
  }
];

export default function SanPhamPage() {
  const { user } = useAuthStore();
  const isAdminOrEmployee = user?.role === "Admin" || user?.role === "NhanVien";

  const [sanPhams, setSanPhams] = useState<SanPham[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
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
    ThuongHieu: "AkzoNobel",
    PhanLoai: "Sơn tĩnh điện",
    DonGiaCoSo: 0,
    MoTa: "",
    DonViTinh: "Kg",
    HinhAnh: "",
    MoTaSanPham: "",
    DanhSachMaMau: [] as MaMau[],
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
      if (res.data.success && res.data.data.length > 0) {
        setSanPhams(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching san pham:", error);
      // Fallback giữ nguyên mock data nếu API lỗi
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

  const handleAddColor = () => {
    setFormData({
      ...formData,
      DanhSachMaMau: [
        ...formData.DanhSachMaMau,
        {
          MaMau: "",
          TenMau: "",
          HexCode: "#000000",
          TonKhoKhaDung: 0,
          TonKhoTamGiu: 0,
          NguongCanhBao: 200,
          TrangThai: true,
        },
      ],
    });
  };

  const handleRemoveColor = (index: number) => {
    const newList = [...formData.DanhSachMaMau];
    newList.splice(index, 1);
    setFormData({ ...formData, DanhSachMaMau: newList });
  };

  const handleColorChange = (index: number, field: keyof MaMau, value: any) => {
    const newList = [...formData.DanhSachMaMau];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, DanhSachMaMau: newList });
  };

  const openForm = (item?: SanPham) => {
    if (item) {
      setFormData({
        _id: item._id,
        MaSanPham: item.MaSanPham,
        TenDongSon: item.TenDongSon,
        ThuongHieu: item.ThuongHieu,
        PhanLoai: item.PhanLoai,
        DonGiaCoSo: item.DonGiaCoSo,
        MoTa: item.MoTa || "",
        DonViTinh: item.DonViTinh || "Kg",
        HinhAnh: item.HinhAnh || "",
        MoTaSanPham: item.MoTaSanPham || "",
        DanhSachMaMau: item.DanhSachMaMau || [],
      });
    } else {
      setFormData({
        _id: "",
        MaSanPham: "SP" + Date.now().toString().slice(-4),
        TenDongSon: "",
        ThuongHieu: "AkzoNobel",
        PhanLoai: "Sơn tĩnh điện",
        DonGiaCoSo: 0,
        MoTa: "",
        DonViTinh: "Kg",
        HinhAnh: "",
        MoTaSanPham: "",
        DanhSachMaMau: [],
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
      "Tồn Kho Tổng": sp.TongTonKho || 0,
      "Đơn Vị Tính": sp.DonViTinh || "Kg",
      "Số Lượng SKU": sp.DanhSachMaMau?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "San-Pham");
    XLSX.writeFile(
      workbook,
      `VTSC_Danh_Sach_San_Pham_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`
    );
  };

  const STATS = {
    total: sanPhams.length,
    tinhDien: sanPhams.filter((t) => t.PhanLoai === "Sơn tĩnh điện").length,
    tauBien: sanPhams.filter((t) => t.PhanLoai === "Sơn tàu biển").length,
    congNghiep: sanPhams.filter((t) => t.PhanLoai === "Sơn công nghiệp").length,
  };

  const getAvatarUrl = (path: string) => {
    if (!path || path === "undefined" || path === "null") return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const origin =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : "http://localhost:5000";
    return `${origin}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-900 space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng sản phẩm", value: STATS.total, icon: Package, color: "blue" },
          { label: "Sơn tĩnh điện", value: STATS.tinhDien, icon: Layers, color: "emerald" },
          { label: "Sơn tàu biển", value: STATS.tauBien, icon: Droplet, color: "violet" },
          { label: "Sơn công nghiệp", value: STATS.congNghiep, icon: Box, color: "amber" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{item.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${item.color}-50 text-${item.color}-600`}>
              <item.icon strokeWidth={1.5} size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="relative w-full lg:w-72">
          <Search strokeWidth={1.5} size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow shadow-sm"
            placeholder="Tìm mã SP, tên dòng sơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Middle: Pill Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto w-full lg:w-auto">
          {[
            { id: "all", label: "Tất cả" },
            { id: "Sơn tĩnh điện", label: "Tĩnh điện" },
            { id: "Sơn tàu biển", label: "Tàu biển" },
            { id: "Sơn công nghiệp", label: "Công nghiệp" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === f.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={exportToExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download strokeWidth={1.5} size={16} /> Xuất Excel
          </button>
          {isAdminOrEmployee && (
            <button
              onClick={() => openForm()}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus strokeWidth={2} size={16} /> Thêm Sản phẩm
            </button>
          )}
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">Ảnh</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã SP</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Dòng sản phẩm</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thương hiệu / Loại</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Đơn giá</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tồn kho</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : sanPhams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-500">
                    Không tìm thấy sản phẩm.
                  </td>
                </tr>
              ) : (
                sanPhams.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Ảnh */}
                    <td className="px-6 py-3 text-center">
                      <div className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center mx-auto">
                        {item.HinhAnh ? (
                          <img
                            src={getAvatarUrl(item.HinhAnh)}
                            alt={item.TenDongSon}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.TenDongSon)}&background=f8fafc&color=94a3b8`;
                            }}
                          />
                        ) : (
                          <ImageIcon strokeWidth={1.5} size={20} className="text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Mã SP */}
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        {item.MaSanPham}
                      </span>
                    </td>

                    {/* Dòng sản phẩm (2 dòng) */}
                    <td className="px-6 py-3">
                      <div className="flex flex-col justify-center">
                        <p
                          className="font-semibold text-slate-900 text-sm cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleViewProduct(item)}
                        >
                          {item.TenDongSon}
                        </p>
                        <p className="truncate max-w-[280px] text-xs text-slate-500 mt-0.5" title={item.MoTa}>
                          {item.MoTa || "Không có mô tả"}
                        </p>
                      </div>
                    </td>

                    {/* Thương hiệu / Loại */}
                    <td className="px-6 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        {item.ThuongHieu} - {item.PhanLoai}
                      </span>
                    </td>

                    {/* Đơn giá */}
                    <td className="px-6 py-3 text-right">
                      <p className="font-semibold text-slate-900 text-sm">
                        {item.DonGiaCoSo.toLocaleString()} ₫
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase">
                        per {item.DonViTinh}
                      </p>
                    </td>

                    {/* Tồn kho */}
                    <td className="px-6 py-3 text-right">
                      {item.TongTonKho === 0 ? (
                        <span className="px-2 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-md">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">
                          {item.TongTonKho?.toLocaleString() || 0}
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleViewProduct(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye strokeWidth={1.5} size={18} />
                        </button>
                        {isAdminOrEmployee && (
                          <>
                            <button
                              onClick={() => openForm(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit strokeWidth={1.5} size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 strokeWidth={1.5} size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang (Pagination) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Trang <span className="text-slate-900 font-semibold">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft strokeWidth={1.5} size={18} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight strokeWidth={1.5} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Cập nhật thông tin (Refactored to match minimal style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {formData._id ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Image Upload Area */}
                <div className="col-span-1 md:col-span-2 relative">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Ảnh sản phẩm</label>
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer relative overflow-hidden group">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                    {formData.HinhAnh ? (
                      <div className="relative group/img">
                        <img src={getAvatarUrl(formData.HinhAnh)} alt="Product" className="w-32 h-32 rounded-lg object-cover shadow-sm border border-slate-200" />
                        <div className="absolute inset-0 bg-slate-900/40 rounded-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Edit className="text-white" size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={28} className="text-slate-400" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-slate-500">Nhấn để tải ảnh lên</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Mã sản phẩm</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.MaSanPham}
                    onChange={(e) => setFormData({ ...formData, MaSanPham: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tên dòng sơn</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.TenDongSon}
                    onChange={(e) => setFormData({ ...formData, TenDongSon: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Phân loại</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.PhanLoai}
                    onChange={(e) => setFormData({ ...formData, PhanLoai: e.target.value })}
                  >
                    <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                    <option value="Sơn tàu biển">Sơn tàu biển</option>
                    <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                    <option value="Sơn nội thất">Sơn nội thất</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Thương hiệu</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.ThuongHieu}
                    onChange={(e) => setFormData({ ...formData, ThuongHieu: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Đơn giá cơ sở</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.DonGiaCoSo}
                    onChange={(e) => setFormData({ ...formData, DonGiaCoSo: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Đơn vị tính</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.DonViTinh}
                    onChange={(e) => setFormData({ ...formData, DonViTinh: e.target.value })}
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Kg">Kg</option>
                    <option value="Lít">Lít</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    value={formData.MoTa}
                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Lưu sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Xem chi tiết (Refactored to match minimal style) */}
      {isViewOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Chi tiết sản phẩm</h2>
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                    {selectedProduct.HinhAnh ? (
                      <img src={getAvatarUrl(selectedProduct.HinhAnh)} alt={selectedProduct.TenDongSon} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300" size={48} />
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md mb-2">
                      {selectedProduct.MaSanPham}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900">{selectedProduct.TenDongSon}</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">{selectedProduct.ThuongHieu} • {selectedProduct.PhanLoai}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Đơn giá cơ sở</p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">
                        {selectedProduct.DonGiaCoSo?.toLocaleString()} ₫ <span className="text-sm font-normal text-slate-500">/ {selectedProduct.DonViTinh}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Tồn kho</p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">
                        {selectedProduct.TongTonKho || 0} <span className="text-sm font-normal text-slate-500">{selectedProduct.DonViTinh}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Mô tả chi tiết</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedProduct.MoTa || "Chưa có mô tả."}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}