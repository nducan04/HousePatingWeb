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
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";

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

  return (
    <div>
      {/* Summary Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        style={{ marginBottom: "var(--spacing-ms)", gap: "var(--spacing-ms)" }}
      >
        {[
          {
            color: "cyan",
            icon: <Package size={14} />,
            label: "Tổng",
            value: STATS.total,
          },
          {
            color: "emerald",
            icon: <Layers size={14} />,
            label: "Tĩnh Điện",
            value: STATS.tinhDien,
          },
          {
            color: "purple",
            icon: <Droplet size={14} />,
            label: "Tàu Biển",
            value: STATS.tauBien,
          },
          {
            color: "amber",
            icon: <Box size={14} />,
            label: "Công Nghiệp",
            value: STATS.congNghiep,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`kpi-card ${item.color}`}
            style={{
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              className="kpi-icon"
              style={{
                width: 24,
                height: 24,
                margin: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                className="kpi-label"
                style={{ fontSize: "10px", opacity: 0.8, margin: 0 }}
              >
                {item.label}
              </div>
              <div
                className="kpi-value"
                style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden"
        style={{
          padding: "var(--spacing-ms)",
          marginBottom: "1.125rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.125rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.125rem",
            }}
          >
            <div className="relative" style={{ width: 140 }}>
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                style={{
                  padding: "4px 8px 4px 30px",
                  fontSize: "11px",
                  height: 28,
                }}
                placeholder="Tìm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { id: "all", label: "Tất cả" },
                { id: "Sơn tĩnh điện", label: "Tĩnh điện" },
                { id: "Sơn tàu biển", label: "Tàu biển" },
                { id: "Sơn công nghiệp", label: "Công nghiệp" },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filterType === f.id ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "10px", height: 28, padding: "0 8px" }}
                  onClick={() => setFilterType(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdminOrEmployee && (
              <>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  style={{
                    border: "1px solid #e2e8f0",
                    color: "#059669",
                    fontSize: "10px",
                    height: 28,
                    padding: "0 8px",
                  }}
                >
                  <Download size={14} /> Xuất
                </button>
                <button
                  onClick={() => openForm()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  style={{ fontSize: "10px", height: 28, padding: "0 8px" }}
                >
                  <Plus size={14} /> Thêm SP
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none"
        style={{ overflow: "hidden", borderRadius: 0, marginTop: "0.5rem" }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ fontSize: "11px" }}>
              <th style={{ width: "40px", textAlign: "center" }}>Ảnh</th>
              <th>Mã SP</th>
              <th>Tên Dòng Sơn</th>
              <th>Thương hiệu</th>
              <th>Phân loại</th>
              <th>Đơn giá</th>
              <th>ĐVT</th>
              <th>Tồn Kho</th>
              <th>Màu</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#475569",
                  }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : sanPhams.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#475569",
                  }}
                >
                  Không tìm thấy sản phẩm.
                </td>
              </tr>
            ) : (
              sanPhams.map((sp) => (
                <tr key={sp._id} style={{ fontSize: "0.875rem" }}>
                  <td style={{ padding: "2px", textAlign: "center" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "3px",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-color)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {sp.HinhAnh ? (
                        <img
                          src={`http://localhost:5000${sp.HinhAnh}`}
                          alt="SP"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Package size={14} color="#475569" />
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                      color: "#2563eb",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => handleViewProduct(sp)}
                    title="Xem chi tiết sản phẩm"
                  >
                    {sp.MaSanPham}
                  </td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>
                    {sp.TenDongSon}
                  </td>
                  <td>{sp.ThuongHieu}</td>
                  <td>{sp.PhanLoai}</td>
                  <td
                    style={{ color: "#059669", fontWeight: 600 }}
                  >
                    {sp.DonGiaCoSo.toLocaleString()} ₫
                  </td>
                  <td style={{ fontWeight: 600 }}>{sp.DonViTinh || "Thùng"}</td>
                  <td
                    style={{
                      fontWeight: 600,
                      color:
                        (sp.TonKho || 0) > 0
                          ? "#2563eb"
                          : "#e11d48",
                    }}
                  >
                    {sp.TonKho || 0}
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700"
                      style={{ fontSize: "10px", padding: "2px 6px" }}
                    >
                      {sp.DanhSachMaMau?.length || 0} Màu
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => addToCart(sp)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                        title="Thêm vào giỏ hàng"
                        style={{ color: "#059669" }}
                        disabled={(sp.TonKho || 0) <= 0}
                      >
                        <ShoppingCart size={16} />
                      </button>
                      {isAdminOrEmployee && (
                        <>
                          <button
                            onClick={() => openForm(sp)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sp._id)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                          >
                            <Trash2 size={16} color="#e11d48" />
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

        {/* Pagination Controls */}
        <div
          style={{
            padding: "8px 1.125rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
            Trang {currentPage} / {totalPages}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{ height: 24, width: 24, padding: 0 }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from(
              { length: Math.min(totalPages, 5) },
              (_, i) => i + 1,
            ).map((page) => (
              <button
                key={page}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${currentPage === page ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setCurrentPage(page)}
                style={{
                  minWidth: "24px",
                  height: 24,
                  padding: 0,
                  fontSize: "10px",
                }}
              >
                {page}
              </button>
            ))}
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              style={{ height: 24, width: 24, padding: 0 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden"
            style={{ width: "100%", maxWidth: "600px", padding: 0 }}
          >
            <div
              style={{
                padding: "1.75rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ fontSize: "1.375rem", fontWeight: 700 }}>
                {formData._id ? "Chỉnh sửa" : "Thêm Sản Phẩm"}
              </h3>
            </div>
            <div
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.125rem",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {/* Upload Ảnh Sản Phẩm */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "8px",
                    border: "2px dashed #ccc",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  {formData.HinhAnh ? (
                    <img
                      src={`http://localhost:5000${formData.HinhAnh}`}
                      alt="HinhAnh"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#888",
                        textAlign: "center",
                      }}
                    >
                      Chưa có ảnh
                      <br />
                      sản phẩm
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  style={{ fontSize: "13px", color: "#dddddd" }}
                />
                {isUploading && (
                  <span style={{ color: "#1100f8ff", fontSize: "13px" }}>
                    Đang tải lên...
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "1.125rem" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Mã Sản Phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.MaSanPham}
                    onChange={(e) =>
                      setFormData({ ...formData, MaSanPham: e.target.value })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.ThuongHieu}
                    onChange={(e) =>
                      setFormData({ ...formData, ThuongHieu: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: "0.875rem",
                    color: "#475569",
                  }}
                >
                  Tên Dòng Sơn *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={formData.TenDongSon}
                  onChange={(e) =>
                    setFormData({ ...formData, TenDongSon: e.target.value })
                  }
                />
              </div>

              <div style={{ display: "flex", gap: "1.125rem" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Phân loại
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.PhanLoai}
                    onChange={(e) =>
                      setFormData({ ...formData, PhanLoai: e.target.value })
                    }
                  >
                    <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                    <option value="Sơn tàu biển">Sơn tàu biển</option>
                    <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                    <option value="Sơn nội thất">Sơn nội thất</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Đơn giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.DonGiaCoSo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        DonGiaCoSo: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.125rem" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Đơn vị tính
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.DonViTinh}
                    onChange={(e) =>
                      setFormData({ ...formData, DonViTinh: e.target.value })
                    }
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    Tồn kho hệ thống
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.TonKho}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        TonKho: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Mô tả sản phẩm
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    outline: "none",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  value={formData.MoTa}
                  onChange={(e) =>
                    setFormData({ ...formData, MoTa: e.target.value })
                  }
                ></textarea>
              </div>
            </div>
            <div
              style={{
                padding: "1.125rem 1.75rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Đóng
              </button>
              <button onClick={handleSubmit} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden"
            style={{
              width: "100%",
              maxWidth: "700px",
              padding: 0,
              margin: "2rem auto",
              background: "var(--surface-color)",
            }}
          >
            <div
              style={{
                padding: "1.75rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                Chi Tiết Sản Phẩm: {selectedProduct.MaSanPham}
              </h3>
              <button
                onClick={() => setIsViewOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.125rem",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {selectedProduct.HinhAnh && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <img
                    src={`http://localhost:5000${selectedProduct.HinhAnh}`}
                    alt={selectedProduct.TenDongSon}
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Tên Dòng Sơn
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                    {selectedProduct.TenDongSon}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Thương Hiệu
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedProduct.ThuongHieu}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Phân Loại (Loại sơn)
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#7c3aed",
                    }}
                  >
                    {selectedProduct.PhanLoai}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Đơn Giá / Định Lượng
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#059669",
                    }}
                  >
                    {selectedProduct.DonGiaCoSo?.toLocaleString()} đ /{" "}
                    {selectedProduct.DonViTinh}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Tồn Kho Thực Tế
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedProduct.TonKho || 0} {selectedProduct.DonViTinh}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Số Lượng Đã Bán
                  </div>
                  <div
                    style={{ fontWeight: "bold", color: "#d97706" }}
                  >
                    {selectedProduct.SoLuongDaBan || 0}{" "}
                    {selectedProduct.DonViTinh}
                  </div>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "8px",
                    marginBottom: "12px",
                  }}
                >
                  Mô Tả Thuộc Tính Chi Tiết
                </h4>
                <div
                  style={{
                    whiteSpace: "pre-line",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    color: "#0f172a",
                    backgroundColor: "var(--bg-color)",
                    padding: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  {selectedProduct.MoTa ||
                    "Chưa có thông tin mô tả chi tiết cho sản phẩm này."}
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "8px",
                    marginBottom: "12px",
                  }}
                >
                  Đánh Giá Của Khách Hàng
                </h4>
                {selectedProduct.DanhGia &&
                selectedProduct.DanhGia.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {selectedProduct.DanhGia.map((dg, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: "var(--bg-color)",
                          padding: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#2563eb",
                            }}
                          >
                            {dg.KhachHang}
                          </span>
                          <span
                            style={{
                              color: "#475569",
                              fontSize: "0.85rem",
                            }}
                          >
                            {new Date(dg.NgayDanhGia).toLocaleDateString()}
                          </span>
                        </div>
                        <div
                          style={{
                            color: "#d97706",
                            marginBottom: "6px",
                            fontSize: "1rem",
                          }}
                        >
                          {"★".repeat(dg.SoSao)}
                          {"☆".repeat(5 - dg.SoSao)}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "#0f172a",
                          }}
                        >
                          {dg.BinhLuan}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      backgroundColor: "var(--bg-color)",
                      borderRadius: "8px",
                      color: "#475569",
                    }}
                  >
                    Chưa có đánh giá nào cho sản phẩm này.
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                padding: "1.125rem 1.75rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setIsViewOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{ padding: "10px 30px" }}
              >
                Đóng hồ sơ sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
