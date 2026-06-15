"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  QrCodeIcon,
  Layers,
  Droplet,
  Box,
  ChevronLeft,
  ChevronRight,
  QrCode,
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  X,
  Upload,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import * as XLSX from "xlsx";
import IPFSImage from "@/lib/components/IPFSImage";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import { paintColors } from "@/lib/data/colors-data";

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
  HinhAnh?: string[];
  MoTaSanPham?: string;
  TruyXuatNguonGoc?: {
    HoaDonMuaSon?: string;
    QuyTrinhSanXuat?: string;
    NgaySanXuat?: string;
    HanSuDung?: string;
  };
}



// Helper: Tự động format đoạn text dài có chứa gạch đầu dòng, dấu sao hoặc chữ in hoa thành HTML dễ nhìn
const formatTextToHTML = (text: string) => {
  if (!text) return "";
  let formatted = text
    // Thêm xuống dòng trước các dấu gạch ngang, dấu sao, dấu cộng (nếu trước đó có dấu chấm hoặc khoảng trắng)
    .replace(/(?:\.\s+|\s|^)([-–+*])\s/g, "\n$1 ")
    .replace(/(?:\.\s+|\s|^)(\(\*\))\s/g, "\n$1 ")
    // Thêm xuống dòng trước cụm từ IN HOA dài (vd: CÁCH THỨC THI CÔNG) nếu phía trước là dấu chấm
    .replace(/\.\s+([A-ZÀ-Ỹ][A-ZÀ-Ỹ\s]{5,})/g, "\n$1");

  return formatted.split("\n").map((line, index) => {
    if (!line.trim()) return <br key={index} />;
    const isHeading =
      line.trim() === line.trim().toUpperCase() &&
      line.trim().length > 8 &&
      !line.includes("–") &&
      !line.includes("-");
    const isListItem =
      line.trim().startsWith("-") ||
      line.trim().startsWith("–") ||
      line.trim().startsWith("(*)") ||
      line.trim().startsWith("+");

    return (
      <span
        key={index}
        className={`block ${isHeading ? "font-bold text-slate-800 mt-3 mb-1 text-[13px]" : "mb-1"} ${isListItem ? 'pl-3 relative before:content-[""] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-400 before:rounded-full' : ""}`}
      >
        {line}
      </span>
    );
  });
};

export default function SanPhamPage() {
  const { user } = useAuthStore();
  const isAdminOrEmployee = user?.role === "Admin" || user?.role === "NhanVien";

  const [sanPhams, setSanPhams] = useState<SanPham[]>([]);
  const [allSanPhams, setAllSanPhams] = useState<SanPham[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openColorDropdownIdx, setOpenColorDropdownIdx] = useState<
    number | null
  >(null);
  const [formData, setFormData] = useState({
    _id: "",
    MaSanPham: "",
    TenDongSon: "",
    ThuongHieu: "AkzoNobel",
    PhanLoai: "Sơn tĩnh điện",
    DonGiaCoSo: 0,
    MoTa: "",
    DonViTinh: "Thùng",
    HinhAnh: [] as string[],
    MoTaSanPham: "",
    DanhSachMaMau: [] as MaMau[],
    TruyXuatNguonGoc: {
      HoaDonMuaSon: "",
      QuyTrinhSanXuat: "",
      NgaySanXuat: "",
      HanSuDung: "",
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // --- Modal Danh Mục Sơn ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ _id: "", TenDanhMuc: "", MoTa: "", TrangThai: true });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryErrorMsg, setCategoryErrorMsg] = useState("");
  // -------------------------

  const fetchStatsData = async () => {
    try {
      const res = await api.get("/san-pham-son?limit=100000000");
      if (res.data.success) {
        setAllSanPhams(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching all products for stats:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/danh-muc-son");
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleOpenCategoryModal = (cat: any = null) => {
    setCategoryErrorMsg("");
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({ _id: cat._id, TenDanhMuc: cat.TenDanhMuc, MoTa: cat.MoTa || "", TrangThai: cat.TrangThai });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ _id: "", TenDanhMuc: "", MoTa: "", TrangThai: true });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      setCategoryErrorMsg("");
      if (!categoryFormData.TenDanhMuc.trim()) {
        setCategoryErrorMsg("Vui lòng nhập tên danh mục");
        return;
      }
      if (editingCategory) {
        const res = await api.put(`/danh-muc-son/${editingCategory._id}`, categoryFormData);
        if (res.data.success) {
          setCategories(categories.map(c => c._id === editingCategory._id ? res.data.data : c));
          setEditingCategory(null);
          setCategoryFormData({ _id: "", TenDanhMuc: "", MoTa: "", TrangThai: true });
        }
      } else {
        const { _id, ...dataToCreate } = categoryFormData;
        const res = await api.post("/danh-muc-son", dataToCreate);
        if (res.data.success) {
          setCategories([res.data.data, ...categories]);
          setCategoryFormData({ _id: "", TenDanhMuc: "", MoTa: "", TrangThai: true });
        }
      }
    } catch (error: any) {
      setCategoryErrorMsg(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Xác nhận xóa danh mục này? Hệ thống có thể gặp lỗi nếu danh mục đang được sử dụng.")) {
      try {
        const res = await api.delete(`/danh-muc-son/${id}`);
        if (res.data.success) {
          setCategories(categories.filter(c => c._id !== id));
        }
      } catch (error) {
        alert("Không thể xóa danh mục");
      }
    }
  };

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
    fetchStatsData();
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSanPhams();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType, currentPage]);

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
      fetchStatsData();
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
      fetchStatsData();
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

  const handleAddAllColors = () => {
    const currentCodes = new Set(formData.DanhSachMaMau.map((m) => m.MaMau));
    const newColors = paintColors
      .filter((p) => !currentCodes.has(p.code))
      .map((p) => ({
        MaMau: p.code,
        TenMau: p.name,
        HexCode: p.hex,
        TonKhoKhaDung: 0,
        TonKhoTamGiu: 0,
        NguongCanhBao: 200,
        TrangThai: true,
      }));

    if (newColors.length === 0) {
      alert("Tất cả màu đã có trong danh sách!");
      return;
    }

    setFormData({
      ...formData,
      DanhSachMaMau: [...formData.DanhSachMaMau, ...newColors],
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
        DonViTinh: item.DonViTinh || "Thùng",
        HinhAnh: Array.isArray(item.HinhAnh)
          ? item.HinhAnh
          : item.HinhAnh
            ? [item.HinhAnh]
            : [],
        MoTaSanPham: item.MoTaSanPham || "",
        DanhSachMaMau: (item.DanhSachMaMau || []).map((m: any) => ({
          ...m,
          TenMau: paintColors.find((c) => c.code === m.MaMau)?.name || m.TenMau,
        })),
        TruyXuatNguonGoc: {
          HoaDonMuaSon: item.TruyXuatNguonGoc?.HoaDonMuaSon || "",
          QuyTrinhSanXuat: item.TruyXuatNguonGoc?.QuyTrinhSanXuat || "",
          NgaySanXuat: item.TruyXuatNguonGoc?.NgaySanXuat
            ? new Date(item.TruyXuatNguonGoc.NgaySanXuat)
                .toISOString()
                .split("T")[0]
            : "",
          HanSuDung: item.TruyXuatNguonGoc?.HanSuDung || "",
        },
      });
    } else {
      setFormData({
        _id: "",
        MaSanPham: "SP" + Date.now().toString().slice(-4),
        TenDongSon: "",
        ThuongHieu: "AkzoNobel",
        PhanLoai: categories.length > 0 ? categories[0].TenDanhMuc : "Sơn tĩnh điện",
        DonGiaCoSo: 0,
        MoTa: "",
        DonViTinh: "Thùng",
        HinhAnh: [],
        MoTaSanPham: "",
        DanhSachMaMau: [],
        TruyXuatNguonGoc: {
          HoaDonMuaSon: "",
          QuyTrinhSanXuat: "",
          NgaySanXuat: "",
          HanSuDung: "",
        },
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Upload từng file một, append vào mảng HinhAnh
      for (let i = 0; i < files.length; i++) {
        const fileFormData = new FormData();
        fileFormData.append("image", files[i]);
        const res = await api.post("/files/upload-image", fileFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          setFormData((prev) => ({
            ...prev,
            HinhAnh: [...prev.HinhAnh, res.data.url],
          }));
        }
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Không thể upload ảnh, vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      // Reset input để cho phép chọn lại cùng file
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      HinhAnh: prev.HinhAnh.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleColorImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileFormData = new FormData();
      fileFormData.append("image", files[0]);
      const res = await api.post("/files/upload-image", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        handleColorChange(index, "HinhAnh", res.data.url);
      }
    } catch (error) {
      console.error("Lỗi upload ảnh màu:", error);
      alert("Không thể upload ảnh màu, vui lòng thử lại.");
    } finally {
      e.target.value = "";
    }
  };

  const handleHoaDonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileFormData = new FormData();
      fileFormData.append("image", files[0]);
      const res = await api.post("/files/upload-image", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setFormData({
          ...formData,
          TruyXuatNguonGoc: {
            ...formData.TruyXuatNguonGoc,
            HoaDonMuaSon: res.data.url,
          },
        });
      }
    } catch (error) {
      console.error("Lỗi upload hóa đơn:", error);
      alert("Không thể upload hóa đơn, vui lòng thử lại.");
    } finally {
      e.target.value = "";
    }
  };

  const handleViewProduct = (product: SanPham) => {
    setSelectedProduct(product);
    setCurrentImgIndex(0);
    setIsViewOpen(true);
  };

  // Helper: normalize HinhAnh (có thể là string cũ hoặc array mới)
  const getImageArray = (img: any): string[] => {
    if (!img) return [];
    if (Array.isArray(img)) return img.filter(Boolean);
    if (typeof img === "string" && img) return [img];
    return [];
  };

  const exportToExcel = () => {
    const dataToExport = sanPhams.map((sp) => ({
      "Mã SP": sp.MaSanPham,
      "Tên Dòng Sơn": sp.TenDongSon,
      "Thương Hiệu": sp.ThuongHieu,
      "Phân Loại": sp.PhanLoai,
      "Đơn Giá": sp.DonGiaCoSo,
      "Tồn Kho Tổng": sp.TongTonKho || 0,
      "Đơn Vị Tính": sp.DonViTinh || "Thùng",
      "Số Lượng SKU": sp.DanhSachMaMau?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "San-Pham");
    XLSX.writeFile(
      workbook,
      `VTSC_Danh_Sach_San_Pham_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`,
    );
  };

  const dataSource = allSanPhams.length ? allSanPhams : sanPhams;

  // Cấu hình icon & màu cho từng phân loại
  const CATEGORY_CONFIG: Record<
    string,
    { icon: any; color: string; bgClass: string; textClass: string }
  > = {
    "Sơn tĩnh điện": {
      icon: Layers,
      color: "emerald",
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-600",
    },
    "Sơn tàu biển": {
      icon: Droplet,
      color: "violet",
      bgClass: "bg-violet-50",
      textClass: "text-violet-600",
    },
    "Sơn công nghiệp": {
      icon: Box,
      color: "amber",
      bgClass: "bg-amber-50",
      textClass: "text-amber-600",
    },
    "Sơn nội thất": {
      icon: Package,
      color: "rose",
      bgClass: "bg-rose-50",
      textClass: "text-rose-600",
    },
  };

  // Đếm số lượng theo từng phân loại thực tế từ DB
  const categoryCounts: Record<string, number> = {};
  dataSource.forEach((sp) => {
    if (sp.PhanLoai) {
      categoryCounts[sp.PhanLoai] = (categoryCounts[sp.PhanLoai] || 0) + 1;
    }
  });

  // Tạo danh sách KPI cards động
  const categoryCards = categories.filter(cat => cat.TrangThai).map(cat => {
    const label = cat.TenDanhMuc;
    const value = categoryCounts[label] || 0;
    const config = CATEGORY_CONFIG[label] || {
      icon: Package,
      color: "slate",
      bgClass: "bg-slate-50",
      textClass: "text-slate-600",
    };
    return {
      label,
      value,
      icon: config.icon,
      bgClass: config.bgClass,
      textClass: config.textClass,
    };
  });

  // Tạo danh sách filter tabs động
  const filterTabs = [
    { id: "all", label: "Tất cả" },
    ...categories.filter(cat => cat.TrangThai).map((cat) => ({
      id: cat.TenDanhMuc,
      label: cat.TenDanhMuc.replace("Sơn ", ""),
    })),
  ];

  const getAvatarUrl = (path: string) => {
    return resolveImageUrl(path);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-900 space-y-6">
      {/* 1. KPI Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(categoryCards.length + 1, 5)} gap-4`}
      >
        {/* Card tổng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              Tổng sản phẩm
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {dataSource.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <Package strokeWidth={1.5} size={20} />
          </div>
        </div>
        {/* Cards theo phân loại */}
        {categoryCards.map((item, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {item.label}
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {item.value}
              </h3>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgClass} ${item.textClass}`}
            >
              <item.icon strokeWidth={1.5} size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="relative w-full lg:w-72">
          <Search
            strokeWidth={1.5}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
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
          {filterTabs.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filterType === f.id
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
            <>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Layers strokeWidth={2} size={16} /> Thêm Loại Sơn
              </button>
              <button
                onClick={() => openForm()}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus strokeWidth={2} size={16} /> Thêm Sản phẩm
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">
                  Ảnh
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mã SP
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                  Dòng sản phẩm
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thương hiệu / Loại
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Đơn giá
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-sm text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : sanPhams.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-sm text-slate-500"
                  >
                    Không tìm thấy sản phẩm.
                  </td>
                </tr>
              ) : (
                sanPhams.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Ảnh (hiển thị ảnh đầu tiên) — Click để xem */}
                    <td className="px-6 py-3 text-center">
                      <div
                        className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center mx-auto relative cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-110 transition-all"
                        onClick={() => handleViewProduct(item)}
                        title="Nhấn để xem ảnh sản phẩm"
                      >
                        {getImageArray(item.HinhAnh).length > 0 ? (
                          <>
                            <IPFSImage
                              cid={getImageArray(item.HinhAnh)[0]}
                              alt={item.TenDongSon}
                              className="w-full h-full"
                            />
                            {getImageArray(item.HinhAnh).length > 1 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {getImageArray(item.HinhAnh).length}
                              </span>
                            )}
                          </>
                        ) : (
                          <ImageIcon
                            strokeWidth={1.5}
                            size={20}
                            className="text-slate-400"
                          />
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
                        <p
                          className="truncate max-w-[280px] text-xs text-slate-500 mt-0.5"
                          title={item.MoTa}
                        >
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
            Trang{" "}
            <span className="text-slate-900 font-semibold">{currentPage}</span>{" "}
            / {totalPages}
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
                {/* Image Upload Area — Hỗ trợ nhiều ảnh */}
                <div className="col-span-1 md:col-span-2 relative">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Ảnh sản phẩm
                    {formData.HinhAnh.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        ({formData.HinhAnh.length} ảnh)
                      </span>
                    )}
                  </label>

                  {/* Grid hiển thị các ảnh đã upload */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {formData.HinhAnh.map((url: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative group/img w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50"
                      >
                        <IPFSImage
                          cid={url}
                          alt={`Ảnh ${idx + 1}`}
                          className="w-full h-full"
                        />
                        {/* Nút X xóa ảnh */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all z-10"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                        {/* Số thứ tự */}
                        <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded-md">
                          {idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Nút thêm ảnh mới */}
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload
                            size={18}
                            className="text-slate-400"
                            strokeWidth={1.5}
                          />
                          <span className="text-[10px] font-semibold text-slate-400">
                            Thêm ảnh
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Nhấn vào ô "+" để thêm ảnh. Di chuột vào ảnh để xóa.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Mã sản phẩm
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.MaSanPham}
                    onChange={(e) =>
                      setFormData({ ...formData, MaSanPham: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tên dòng sơn
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.TenDongSon}
                    onChange={(e) =>
                      setFormData({ ...formData, TenDongSon: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Phân loại
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.PhanLoai}
                    onChange={(e) =>
                      setFormData({ ...formData, PhanLoai: e.target.value })
                    }
                  >
                    {categories.length > 0 ? (
                      categories.filter(cat => cat.TrangThai).map(cat => (
                        <option key={cat._id} value={cat.TenDanhMuc}>{cat.TenDanhMuc}</option>
                      ))
                    ) : (
                      <>
                        <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                        <option value="Sơn tàu biển">Sơn tàu biển</option>
                        <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                        <option value="Sơn nội thất">Sơn nội thất</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.ThuongHieu}
                    onChange={(e) =>
                      setFormData({ ...formData, ThuongHieu: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Đơn giá cơ sở
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.DonGiaCoSo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        DonGiaCoSo: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Đơn vị tính
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.DonViTinh}
                    onChange={(e) =>
                      setFormData({ ...formData, DonViTinh: e.target.value })
                    }
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Thùng">Thùng</option>
                    <option value="Lít">Lít</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    value={formData.MoTa}
                    onChange={(e) =>
                      setFormData({ ...formData, MoTa: e.target.value })
                    }
                  ></textarea>
                </div>

                {/* KHU VỰC QUẢN LÝ MÃ MÀU (SKU) */}
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers size={18} className="text-blue-500" /> Danh sách
                      Biến thể Màu sắc (SKU)
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Plus size={14} strokeWidth={2} /> Thêm Màu
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.DanhSachMaMau.map((mau, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl relative group animate-in fade-in zoom-in-95 duration-200"
                      >
                        {/* Cột 1: Hình Ảnh và Màu Hex */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="color"
                              value={mau.HexCode}
                              onChange={(e) =>
                                handleColorChange(
                                  index,
                                  "HexCode",
                                  e.target.value,
                                )
                              }
                              className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                            />
                            <span className="text-[9px] font-mono text-slate-500 uppercase">
                              {mau.HexCode}
                            </span>
                          </div>
                        </div>

                        {/* Cột 2 & 3: Mã và Tên */}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Mã màu (Chọn từ danh mục)
                            </label>
                            <div className="relative mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenColorDropdownIdx(
                                    openColorDropdownIdx === index
                                      ? null
                                      : index,
                                  )
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-left focus:outline-none focus:border-blue-500 transition-all flex items-center justify-between"
                              >
                                <span className="truncate pr-4">
                                  {mau.MaMau
                                    ? `${mau.MaMau} - ${paintColors.find((c) => c.code === mau.MaMau)?.name || mau.TenMau}`
                                    : "-- Chọn mã màu --"}
                                </span>
                                <span className="text-[10px] text-slate-400 pointer-events-none absolute right-3">
                                  ▼
                                </span>
                              </button>

                              {openColorDropdownIdx === index && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() =>
                                      setOpenColorDropdownIdx(null)
                                    }
                                  />
                                  <div className="absolute z-50 top-full left-0 mt-1 min-w-[350px] w-max max-w-[80vw] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-1 custom-scrollbar">
                                    {paintColors.map((c, i) => (
                                      <div
                                        key={i}
                                        onClick={() => {
                                          const newList = [
                                            ...formData.DanhSachMaMau,
                                          ];
                                          newList[index] = {
                                            ...newList[index],
                                            MaMau: c.code,
                                            TenMau: c.name,
                                            HexCode: c.hex,
                                          };
                                          setFormData({
                                            ...formData,
                                            DanhSachMaMau: newList,
                                          });
                                          setOpenColorDropdownIdx(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors"
                                      >
                                        <div
                                          className="w-5 h-5 rounded-full border border-slate-200 shadow-sm shrink-0"
                                          style={{ backgroundColor: c.hex }}
                                        />
                                        <div className="text-[12px] text-slate-700 truncate">
                                          <span className="font-bold">
                                            {c.code}
                                          </span>{" "}
                                          - {c.name} ({c.category})
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Tên màu
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Trắng Sứ"
                              value={mau.TenMau}
                              onChange={(e) =>
                                handleColorChange(
                                  index,
                                  "TenMau",
                                  e.target.value,
                                )
                              }
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Nút xóa màu */}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.DanhSachMaMau.length === 0 && (
                      <p className="text-sm text-slate-500 italic text-center py-4">
                        Chưa có mã màu nào. Vui lòng thêm màu để khách hàng có
                        thể đặt mua!
                      </p>
                    )}
                  </div>
                </div>

                {/* Phần thông tin Truy Xuất Nguồn Gốc (QR Code) */}
                <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <QrCode size={18} className="text-blue-500" /> Thông tin
                    Truy xuất Nguồn gốc (QR)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Ngày sản xuất
                      </label>
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                        value={formData.TruyXuatNguonGoc.NgaySanXuat}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            TruyXuatNguonGoc: {
                              ...formData.TruyXuatNguonGoc,
                              NgaySanXuat: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Hạn sử dụng
                      </label>
                      <input
                        type="text"
                        placeholder="Vd: 24 tháng"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                        value={formData.TruyXuatNguonGoc.HanSuDung}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            TruyXuatNguonGoc: {
                              ...formData.TruyXuatNguonGoc,
                              HanSuDung: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        CHỨNG NHẬN XUẤT XỨ SẢN PHẨM
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {formData.TruyXuatNguonGoc.HoaDonMuaSon ? (
                          <div className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <a
                              href={resolveImageUrl(
                                formData.TruyXuatNguonGoc.HoaDonMuaSon,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold text-sm underline truncate hover:text-blue-800 flex items-center gap-1"
                            >
                              <FileText size={16} /> Xem Chứng Từ
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  TruyXuatNguonGoc: {
                                    ...formData.TruyXuatNguonGoc,
                                    HoaDonMuaSon: "",
                                  },
                                })
                              }
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2"
                            >
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleHoaDonUpload}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Quy trình sản xuất
                      </label>
                      <input
                        type="text"
                        placeholder="Mô tả quy trình..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                        value={formData.TruyXuatNguonGoc.QuyTrinhSanXuat}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            TruyXuatNguonGoc: {
                              ...formData.TruyXuatNguonGoc,
                              QuyTrinhSanXuat: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
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
              <h2 className="text-lg font-semibold text-slate-900">
                Chi tiết sản phẩm
              </h2>
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex-shrink-0 space-y-3">
                  {/* Ảnh chính (carousel) */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group">
                    {getImageArray(selectedProduct.HinhAnh).length > 0 ? (
                      <>
                        <IPFSImage
                          cid={
                            getImageArray(selectedProduct.HinhAnh)[
                              currentImgIndex
                            ] || ""
                          }
                          alt={selectedProduct.TenDongSon}
                          className="w-full h-full"
                        />
                        {/* Nút prev/next */}
                        {getImageArray(selectedProduct.HinhAnh).length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImgIndex((prev) =>
                                  prev <= 0
                                    ? getImageArray(selectedProduct.HinhAnh)
                                        .length - 1
                                    : prev - 1,
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImgIndex((prev) =>
                                  prev >=
                                  getImageArray(selectedProduct.HinhAnh)
                                    .length -
                                    1
                                    ? 0
                                    : prev + 1,
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight size={16} />
                            </button>
                            {/* Indicator dots */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {getImageArray(selectedProduct.HinhAnh).map(
                                (_: string, i: number) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCurrentImgIndex(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentImgIndex ? "bg-white scale-125 shadow" : "bg-white/50 hover:bg-white/80"}`}
                                  />
                                ),
                              )}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <ImageIcon className="text-slate-300" size={48} />
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {getImageArray(selectedProduct.HinhAnh).length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {getImageArray(selectedProduct.HinhAnh).map(
                        (url: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentImgIndex(i)}
                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                              i === currentImgIndex
                                ? "border-blue-500 ring-2 ring-blue-200 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <IPFSImage
                              cid={url}
                              alt={`Thumb ${i + 1}`}
                              className="w-full h-full"
                            />
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md mb-2">
                      {selectedProduct.MaSanPham}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {selectedProduct.TenDongSon}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {selectedProduct.ThuongHieu} • {selectedProduct.PhanLoai}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        Đơn giá cơ sở
                      </p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">
                        {selectedProduct.DonGiaCoSo?.toLocaleString()} ₫{" "}
                        <span className="text-sm font-normal text-slate-500">
                          / {selectedProduct.DonViTinh}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        Tồn kho
                      </p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">
                        {selectedProduct.TongTonKho || 0}{" "}
                        <span className="text-sm font-normal text-slate-500">
                          {selectedProduct.DonViTinh}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* BẢNG MÀU LỰA CHỌN */}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">
                      Bảng màu lựa chọn (SKU)
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProduct.DanhSachMaMau &&
                      selectedProduct.DanhSachMaMau.length > 0 ? (
                        selectedProduct.DanhSachMaMau.map((mau, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 transition-colors"
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-slate-200 block"
                              style={{
                                backgroundColor: mau.HexCode || "#cccccc",
                              }}
                            />
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800 leading-normal">
                                {paintColors.find((c) => c.code === mau.MaMau)
                                  ?.name || mau.TenMau}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                {mau.MaMau}{" "}
                                {mau.TonKhoKhaDung > 0
                                  ? `(Còn ${mau.TonKhoKhaDung})`
                                  : "(Hết hàng)"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Không có biến thể màu nào.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">
                      Mô tả chi tiết
                    </p>
                    <div className="text-sm text-slate-600 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedProduct.MoTa
                        ? formatTextToHTML(selectedProduct.MoTa)
                        : "Chưa có mô tả."}
                    </div>
                  </div>

                  {/* QR Code Truy xuất nguồn gốc */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                      <QRCodeCanvas
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/trace/${selectedProduct._id}`}
                        size={80}
                        bgColor={"#ffffff"}
                        fgColor={"#0f172a"}
                        level={"Q"}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                        <QrCode size={16} className="text-blue-500" />
                        Truy xuất nguồn gốc
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-2">
                        Khách hàng có thể quét mã QR này để xem thông tin hóa
                        đơn, ngày sản xuất, hạn sử dụng và quy trình.
                      </p>
                      <a
                        href={`/trace/${selectedProduct._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                      >
                        Xem trước trang truy xuất ↗
                      </a>
                    </div>
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
      {/* 5. Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-medium text-slate-800">Quản lý Phân Loại Sơn</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Form Side */}
              <div className="p-5 border-r border-slate-100 md:w-1/2 flex flex-col gap-4 overflow-y-auto">
                <h4 className="font-semibold text-slate-700 text-sm">{editingCategory ? "Sửa loại sơn" : "Thêm loại sơn mới"}</h4>
                {categoryErrorMsg && (
                  <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded border border-rose-100">
                    {categoryErrorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Tên loại <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={categoryFormData.TenDanhMuc}
                    onChange={e => setCategoryFormData({...categoryFormData, TenDanhMuc: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="VD: Sơn nội thất"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Mô tả</label>
                  <textarea
                    value={categoryFormData.MoTa}
                    onChange={e => setCategoryFormData({...categoryFormData, MoTa: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                    placeholder="Mô tả..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="catStatus"
                    checked={categoryFormData.TrangThai}
                    onChange={e => setCategoryFormData({...categoryFormData, TrangThai: e.target.checked})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="catStatus" className="text-sm font-medium text-slate-700 cursor-pointer">Trạng thái Hoạt động</label>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={handleSaveCategory} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    {editingCategory ? "Lưu thay đổi" : "Thêm mới"}
                  </button>
                  {editingCategory && (
                    <button onClick={() => { setEditingCategory(null); setCategoryFormData({ _id: "", TenDanhMuc: "", MoTa: "", TrangThai: true }); setCategoryErrorMsg(""); }} className="px-3 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
                      Hủy sửa
                    </button>
                  )}
                </div>
              </div>
              {/* List Side */}
              <div className="md:w-1/2 bg-slate-50 overflow-y-auto p-4">
                <h4 className="font-semibold text-slate-700 text-sm mb-3">Danh sách hiện tại</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat._id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cat.TenDanhMuc}</p>
                        {!cat.TrangThai && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">Đã ẩn</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenCategoryModal(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteCategory(cat._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Chưa có loại sơn nào</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
