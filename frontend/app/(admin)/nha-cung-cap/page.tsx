"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  DollarSign,
  Briefcase,
  FileSignature,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  ShoppingCart,
  X,
  Download,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { toast, confirm } from "@/lib/utils/notification";
import * as XLSX from "xlsx";

const API_URL = "/suppliers";

interface NhaCungCap {
  _id?: string;
  MaNCC: string;
  TenNCC: string;
  MaSoThue?: string;
  NguoiLienHe?: string;
  DiaChi?: string;
  SDT: string;
  Email?: string;
  PhanLoai?: "Nhà Cung Cấp Chính" | "Nhà Cung Cấp Phụ";
  CongNo?: number;
  AccountID?: {
    _id: string;
    TenDangNhap: string;
    Email: string;
    VaiTro: string;
  };
}

interface PhieuDatHang {
  _id: string;
  MaPhieu: string;
  NgayDat: string;
  TongTien: number;
  TrangThai: string;
  NguoiLap?: string;
  ChiTiet?: Array<{
    MaItem: string;
    TenItem: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
  }>;
}

interface PhieuNhapXuat {
  _id: string;
  MaPhieu: string;
  createdAt: string;
  TongTien: number;
  LoaiPhieu: string;
}

export default function NhaCungCapPage() {
  const [data, setData] = useState<NhaCungCap[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [poList, setPoList] = useState<PhieuDatHang[]>([]);
  const [receiptList, setReceiptList] = useState<PhieuNhapXuat[]>([]);
  const [selectedNCC, setSelectedNCC] = useState<NhaCungCap | null>(null);
  const [selectedPO, setSelectedPO] = useState<PhieuDatHang | null>(null);

  // PO Form states
  const [isPOFormOpen, setIsPOFormOpen] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newPOData, setNewPOData] = useState({
    MaPhieu: "",
    NgayDat: new Date().toISOString().split("T")[0],
    NguoiLap: "",
    GhiChu: "",
    ChiTiet: [{ MaItem: "", TenItem: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 }],
  });
  const [formData, setFormData] = useState<NhaCungCap>({
    MaNCC: "",
    TenNCC: "",
    SDT: "",
    PhanLoai: "Nhà Cung Cấp Chính",
    CongNo: 0,
    MaSoThue: "",
    Email: "",
    DiaChi: "",
    NguoiLienHe: "",
  });

  // Account creation states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountNCC, setAccountNCC] = useState<NhaCungCap | null>(null);
  const [accountForm, setAccountForm] = useState({
    TenDangNhap: "",
    MatKhau: "123456",
    Email: "",
  });

  const openAccountModal = (ncc: NhaCungCap) => {
    setAccountNCC(ncc);
    setAccountForm({
      TenDangNhap: ncc.MaNCC.toLowerCase(),
      MatKhau: "123456",
      Email: ncc.Email || "",
    });
    setIsAccountModalOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!accountNCC?._id) return;
    try {
      const res = await api.post(
        `${API_URL}/${accountNCC._id}/create-account`,
        accountForm,
      );
      if (res.data.success) {
        toast.success("Cấp tài khoản nhà cung cấp thành công!");
        setIsAccountModalOpen(false);
        fetchData();
        if (selectedNCC && selectedNCC._id === accountNCC._id) {
          setSelectedNCC((prev) =>
            prev ? { ...prev, AccountID: res.data.data } : null,
          );
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi cấp tài khoản");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (ncc?: NhaCungCap) => {
    if (ncc)
      setFormData({
        ...ncc,
        MaSoThue: ncc.MaSoThue || "",
        Email: ncc.Email || "",
        DiaChi: ncc.DiaChi || "",
        NguoiLienHe: ncc.NguoiLienHe || "",
      });
    else
      setFormData({
        MaNCC: "NCC" + Date.now().toString().slice(-4),
        TenNCC: "",
        SDT: "",
        PhanLoai: "Nhà Cung Cấp Chính",
        CongNo: 0,
        MaSoThue: "",
        Email: "",
        DiaChi: "",
        NguoiLienHe: "",
      });
    setIsModalOpen(true);
  };

  const openDetail = (ncc: NhaCungCap) => {
    setSelectedNCC(ncc);
    setIsDetailModalOpen(true);
    setSelectedPO(null);
    if (ncc._id) fetchHistory(ncc._id);
  };

  const fetchHistory = async (id: string) => {
    try {
      setIsHistoryLoading(true);
      const [poRes, receiptRes] = await Promise.all([
        api.get(`${API_URL}/${id}/vouchers/po`),
        api.get(`${API_URL}/${id}/vouchers/receipts`),
      ]);
      if (poRes.data.success) setPoList(poRes.data.data);
      if (receiptRes.data.success) setReceiptList(receiptRes.data.data);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openPOForm = async () => {
    setIsPOFormOpen(true);
    setNewPOData({
      MaPhieu: "PDH" + Date.now().toString().slice(-4),
      NgayDat: new Date().toISOString().split("T")[0],
      NguoiLap: "",
      GhiChu: "",
      ChiTiet: [
        { MaItem: "", TenItem: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 },
      ],
    });
    try {
      const [matRes, empRes] = await Promise.all([
        api.get("/inventory/nguyen-vat-lieu"),
        api.get("/staff"),
      ]);

      if (matRes.data.success) {
        const filtered = matRes.data.data.filter(
          (m: any) => !m.NhaCungCap || m.NhaCungCap._id === selectedNCC?._id,
        );
        setMaterials(filtered);
      }

      if (empRes.data.success) {
        setEmployees(empRes.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu tham chiếu:", error);
    }
  };

  const handlePOItemChange = (index: number, field: string, value: any) => {
    const newChiTiet = [...newPOData.ChiTiet];
    const item = { ...newChiTiet[index], [field]: value };

    if (field === "MaItem") {
      const mat = materials.find((m) => m.MaNVL === value);
      if (mat) {
        item.TenItem = mat.TenNguyenVatLieu || mat.TenNVL;
        item.DonGia = mat.GiaNhapDinhMuc || mat.DonGia || 0;
      }
    }

    item.ThanhTien = item.SoLuong * item.DonGia;
    newChiTiet[index] = item;
    setNewPOData({ ...newPOData, ChiTiet: newChiTiet });
  };

  const addPOItem = () => {
    setNewPOData({
      ...newPOData,
      ChiTiet: [
        ...newPOData.ChiTiet,
        { MaItem: "", TenItem: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 },
      ],
    });
  };

  const submitPO = async () => {
    if (!selectedNCC?._id) return;
    try {
      const total = newPOData.ChiTiet.reduce((sum, i) => sum + i.ThanhTien, 0);
      const res = await api.post(`${API_URL}/${selectedNCC._id}/vouchers/po`, {
        ...newPOData,
        TongTien: total,
      });
      if (res.data.success) {
        setIsPOFormOpen(false);
        fetchHistory(selectedNCC._id);

        // Cập nhật công nợ của selectedNCC ngay trên giao diện
        setSelectedNCC((prev) =>
          prev ? { ...prev, CongNo: (prev.CongNo || 0) + total } : null,
        );

        // Tải lại danh sách nhà cung cấp ở trang chính để đồng bộ công nợ
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi lưu phiếu đặt");
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData._id) await api.put(`${API_URL}/${formData._id}`, formData);
      else await api.post(API_URL, formData);
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi lưu NCC");
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Chắc chắn muốn xóa nhà cung cấp này?")) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        toast.error("Lỗi xóa nhà cung cấp");
      }
    }
  };

  const STATS = {
    total: data.length,
    chinh: data.filter((d) => d.PhanLoai === "Nhà Cung Cấp Chính").length,
    noTotal: data.reduce((sum, d) => sum + (d.CongNo || 0), 0),
  };

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.TenNCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaNCC.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === "all" || item.PhanLoai === filter;
    return matchSearch && matchFilter;
  });

  const exportToExcel = () => {
    const dataToExport = filteredData.map((item) => ({
      "Mã NCC": item.MaNCC,
      "Tên Nhà Cung Cấp": item.TenNCC,
      "Mã Số Thuế": item.MaSoThue || "",
      "Người Liên Hệ": item.NguoiLienHe || "",
      SĐT: item.SDT || "",
      Email: item.Email || "",
      "Phân Loại": item.PhanLoai || "Nhà Cung Cấp Chính",
      "Công Nợ": item.CongNo || 0,
      "Địa Chỉ": item.DiaChi || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nha-Cung-Cap");
    XLSX.writeFile(
      workbook,
      `VTSC_Danh_Sach_Nha_Cung_Cap_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`,
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Tổng nhà cung cấp
              </p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                {STATS.total}{" "}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">
                  Đơn vị
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Building size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-50/50 w-fit px-3 py-1 rounded-md">
            <span className="bg-emerald-100 px-1.5 py-0.5 rounded-lg">+1</span>
            <span>Mở rộng chuỗi cung ứng</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Nhà cung cấp chính
              </p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                {STATS.chinh}{" "}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">
                  Đơn vị
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <FileSignature size={22} />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>Tỷ lệ chiến lược</span>
              <span className="text-emerald-600">
                {STATS.total > 0
                  ? Math.round((STATS.chinh / STATS.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-md overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-md transition-all duration-500"
                style={{
                  width: `${STATS.total > 0 ? (STATS.chinh / STATS.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Nhà cung cấp phụ / Dự phòng
              </p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                {STATS.total - STATS.chinh}{" "}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">
                  Đơn vị
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Briefcase size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg">
              Khả dụng
            </span>
            <span>Đa dạng hóa rủi ro</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Tổng nợ đọng nhà cung cấp
              </p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                {(STATS.noTotal / 1000000).toLocaleString("vi-VN", {
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">
                  Tr. ₫
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <DollarSign size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-amber-600 text-xs font-medium bg-amber-50/50 w-fit px-3 py-1 rounded-md">
            <span className="bg-amber-100 px-1.5 py-0.5 rounded-lg">Dư nợ</span>
            <span>Kế hoạch chi trả gối đầu</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1">
            <div className="relative w-full lg:w-80 group">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="text"
                className="w-full bg-slate-50/80 border border-slate-100 rounded-lg pl-12 pr-4 py-3.5 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                placeholder="Tìm mã NCC, tên nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-lg border border-slate-100">
              {[
                { id: "all", label: "Tất cả nhà cung cấp" },
                { id: "Nhà Cung Cấp Chính", label: "Nhà Cung Cấp Chính" },
                { id: "Nhà Cung Cấp Phụ", label: "Nhà Cung Cấp Phụ" },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`px-4.5 py-2.5 rounded-md text-[12px] font-semibold tracking-tight transition-all duration-200 ${
                    filter === f.id
                      ? "bg-white text-blue-600 shadow-md shadow-slate-100 border border-slate-100/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-semibold text-[13px] border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-100"
            >
              <Download size={16} /> Xuất Báo Cáo
            </button>
            <button
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
              onClick={() => openForm()}
            >
              <Plus size={16} /> Thêm Nhà Cung Cấp
            </button>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center w-24">
                  Viết tắt
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-32">
                  Mã Nhà Cung Cấp
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Thông tin nhà cung cấp
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Người liên hệ / Đại diện
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center w-40">
                  Phân loại
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right w-44">
                  Công nợ hiện tại
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right w-36">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-md animate-spin"></div>
                      <span className="text-sm font-bold text-slate-400">
                        Đang tải hồ sơ nhà cung cấp...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                        <Building size={28} />
                      </div>
                      <h4 className="text-[15px] font-semibold text-slate-700 mt-2">
                        Không tìm thấy nhà cung cấp
                      </h4>
                      <p className="text-xs text-slate-400 font-bold">
                        Thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-blue-50/20 transition-all duration-200 group"
                  >
                    {/* Visual Abbreviation Indicator */}
                    <td className="px-6 py-4.5 text-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md mx-auto group-hover:scale-110 group-hover:rotate-1 transition-all duration-300 ring-2 ring-slate-100 flex items-center justify-center">
                        <span className="text-slate-750 font-semibold text-sm uppercase">
                          {item.TenNCC.split(" ")
                            .slice(-2)
                            .map((w) => w.charAt(0))
                            .join("") || "NCC"}
                        </span>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm uppercase tracking-wide">
                        {item.MaNCC}
                      </span>
                    </td>

                    {/* Partner Name & Tax Code */}
                    <td className="px-6 py-4.5">
                      <div
                        className="font-bold text-slate-900 text-[15px] cursor-pointer hover:text-blue-600 transition-colors inline-block"
                        onClick={() => openDetail(item)}
                      >
                        {item.TenNCC}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>MST: {item.MaSoThue || "N/A"}</span>
                      </div>
                    </td>

                    {/* Contact Rep / Phone */}
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-slate-800 text-[14px]">
                        {item.NguoiLienHe || "—"}
                      </div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1">
                        {item.SDT}
                      </div>
                    </td>

                    {/* Classification Status Badge */}
                    <td className="px-6 py-4.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11px] font-semibold uppercase tracking-tight shadow-sm border ${
                          item.PhanLoai === "Nhà Cung Cấp Chính" || !item.PhanLoai
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-md animate-pulse ${
                            item.PhanLoai === "Nhà Cung Cấp Chính" || !item.PhanLoai
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        ></div>
                        {item.PhanLoai || "Nhà Cung Cấp Chính"}
                      </span>
                    </td>

                    {/* Debts */}
                    <td className="px-6 py-4.5 text-right">
                      <div
                        className={`font-semibold text-[15px] ${
                          (item.CongNo || 0) > 0
                            ? "text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md inline-block border border-amber-100/50"
                            : "text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-100/50"
                        }`}
                      >
                        {(item.CongNo || 0).toLocaleString("vi-VN")} ₫
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.AccountID ? (
                          <div
                            className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100/50"
                            title={`Tài khoản: ${item.AccountID.TenDangNhap}`}
                          >
                            {item.AccountID.TenDangNhap}
                          </div>
                        ) : (
                          <button
                            onClick={() => openAccountModal(item)}
                            className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                            title="Cấp tài khoản đăng nhập"
                          >
                            <User size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openForm(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id!)}
                          className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Xóa nhà cung cấp"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - HỒ SƠ CHI TIẾT NHÀ CUNG CẤP */}
      {isDetailModalOpen && selectedNCC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            {/* Dossier Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-[17px] font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-6 bg-blue-600 rounded-md"></div>
                Thông tin hồ sơ nhà cung cấp
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium flex items-center justify-center transition-colors border-none outline-none"
              >
                ×
              </button>
            </div>

            {/* Dossier Body Scrollable */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {/* Partner Overview Banner */}
              <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-slate-100 items-start md:items-center">
                <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-white shadow-xl ring-4 ring-slate-100 flex-shrink-0">
                  <Building size={42} className="text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                      {selectedNCC.TenNCC}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm uppercase tracking-wide">
                      {selectedNCC.MaNCC}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User size={15} className="text-slate-400" />{" "}
                      {selectedNCC.NguoiLienHe || "Chưa cập nhật"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={15} className="text-slate-400" />{" "}
                      {selectedNCC.SDT}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={15} className="text-slate-400" />{" "}
                      {selectedNCC.Email || "Chưa cập nhật"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <MapPin size={15} className="text-slate-400" />{" "}
                    {selectedNCC.DiaChi || "Chưa cập nhật địa chỉ trụ sở"}
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    {selectedNCC.AccountID ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                        Tài khoản: {selectedNCC.AccountID.TenDangNhap}
                      </span>
                    ) : (
                      <button
                        onClick={() => openAccountModal(selectedNCC)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100/70 transition-all cursor-pointer border-none"
                      >
                        <User size={12} /> Cấp tài khoản đăng nhập
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Orders and Debt Ledger Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left panel: Debt Summary */}
                <div className="space-y-4 col-span-1">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Tóm tắt công nợ
                  </h4>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        Dư nợ hiện tại
                      </span>
                      <h5
                        className={`text-2xl font-semibold ${selectedNCC.CongNo && selectedNCC.CongNo > 0 ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {(selectedNCC.CongNo || 0).toLocaleString("vi-VN")} ₫
                      </h5>
                    </div>
                    <div className="h-px bg-slate-200/60"></div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Đã giao dịch (PO)</span>
                        <span className="text-slate-700">
                          {poList.length} Phiếu đặt
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Nhập kho vật tư</span>
                        <span className="text-slate-700">
                          {receiptList.length} Phiếu nhập
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: Purchase Order Details */}
                <div
                  className={`bg-white border border-slate-100 rounded-md shadow-sm p-6 col-span-1 lg:col-span-2 ${selectedPO ? "col-span-1 lg:col-span-2" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingCart size={18} className="text-blue-600" />
                      Lịch sử đặt hàng (PO)
                    </h4>
                    <div className="flex items-center gap-2">
                      {selectedPO && (
                        <button
                          onClick={() => setSelectedPO(null)}
                          className="px-4 py-2 bg-slate-50 text-slate-500 rounded-md font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          ← Danh sách
                        </button>
                      )}
                      <button
                        onClick={openPOForm}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-semibold text-xs hover:bg-blue-100 transition-all cursor-pointer"
                      >
                        + Tạo đơn hàng (PO)
                      </button>
                    </div>
                  </div>

                  {isHistoryLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-md animate-spin"></div>
                      <span className="text-xs font-bold text-slate-400">
                        Đang tải lịch sử...
                      </span>
                    </div>
                  ) : poList.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                      Chưa có phiếu đặt hàng nào được lập với nhà cung cấp.
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col ${selectedPO ? "xl:flex-row" : ""} gap-6`}
                    >
                      {/* PO Invoice List */}
                      <div
                        className={`flex-1 ${selectedPO ? "xl:max-w-[240px] xl:border-r border-slate-100 xl:pr-6" : ""} max-h-[350px] overflow-y-auto`}
                      >
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                Mã Phiếu
                              </th>
                              {!selectedPO && (
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                  Ngày Đặt
                                </th>
                              )}
                              {!selectedPO && (
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                                  Tổng Tiền
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {poList.map((p) => (
                              <tr
                                key={p._id}
                                onClick={() => setSelectedPO(p)}
                                className={`cursor-pointer transition-colors ${selectedPO?._id === p._id ? "bg-blue-50/50" : "hover:bg-slate-50/80"}`}
                              >
                                <td className="py-3.5 font-semibold text-blue-600 text-[13px]">
                                  {p.MaPhieu}
                                </td>
                                {!selectedPO && (
                                  <td className="py-3.5 font-bold text-slate-500 text-[12.5px]">
                                    {new Date(p.NgayDat).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </td>
                                )}
                                {!selectedPO && (
                                  <td className="py-3.5 font-semibold text-slate-900 text-right text-[13px]">
                                    {p.TongTien.toLocaleString("vi-VN")} ₫
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* PO Details Panel */}
                      {selectedPO && (
                        <div className="flex-1 space-y-5">
                          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div>
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                                Ngày đặt
                              </span>
                              <div className="font-bold text-slate-800 text-[13px]">
                                {new Date(
                                  selectedPO.NgayDat,
                                ).toLocaleDateString("vi-VN")}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                                NV phụ trách
                              </span>
                              <div className="font-bold text-blue-600 text-[13px]">
                                {selectedPO.NguoiLap || "ADMIN_SYS"}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                                Trạng thái
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-tight bg-emerald-50 border border-emerald-100 text-emerald-600">
                                {selectedPO.TrangThai}
                              </span>
                            </div>
                          </div>

                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                  Mã NVL
                                </th>
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                                  SL
                                </th>
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                                  Đơn giá
                                </th>
                                <th className="pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                                  Thành tiền
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {selectedPO.ChiTiet?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-3 font-semibold text-slate-800 text-[13px]">
                                    {item.MaItem}
                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      {item.TenItem}
                                    </div>
                                  </td>
                                  <td className="py-3 font-bold text-slate-600 text-[13px] text-center">
                                    {item.SoLuong}
                                  </td>
                                  <td className="py-3 font-medium text-slate-500 text-[12.5px] text-right">
                                    {item.DonGia.toLocaleString("vi-VN")}
                                  </td>
                                  <td className="py-3 font-semibold text-slate-900 text-[13px] text-right">
                                    {item.ThanhTien.toLocaleString("vi-VN")} ₫
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td
                                  colSpan={3}
                                  className="py-4 text-right font-semibold text-slate-400 uppercase text-[11px] tracking-widest"
                                >
                                  Tổng cộng đơn:
                                </td>
                                <td className="py-4 text-right text-base font-semibold text-emerald-600">
                                  {selectedPO.TongTien.toLocaleString("vi-VN")}{" "}
                                  ₫
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openForm(selectedNCC);
                }}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-lg font-semibold text-[13px] hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
              >
                Chỉnh sửa nhà cung cấp
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-8 py-3.5 bg-slate-950 text-white rounded-lg font-semibold text-[13px] hover:bg-slate-800 transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer border-none"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - THÊM / CẬP NHẬT NHÀ CUNG CẤP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-[17px] font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-6 bg-blue-600 rounded-md"></div>
                {formData._id
                  ? "Cập nhật hồ sơ nhà cung cấp"
                  : "Khai báo nhà cung cấp mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium flex items-center justify-center transition-colors border-none outline-none"
              >
                ×
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Tên nhà cung cấp
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3.5 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="VD: Hóa chất Việt Đức Vinachem"
                  value={formData.TenNCC}
                  onChange={(e) =>
                    setFormData({ ...formData, TenNCC: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* MaNCC */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Mã nhà cung cấp
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                    value={formData.MaNCC}
                    onChange={(e) =>
                      setFormData({ ...formData, MaNCC: e.target.value })
                    }
                  />
                </div>
                {/* Tax Code */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Mã số thuế doanh nghiệp
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="VD: 0109283745"
                    value={formData.MaSoThue}
                    onChange={(e) =>
                      setFormData({ ...formData, MaSoThue: e.target.value })
                    }
                  />
                </div>
                {/* Classification */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Phân loại nhà cung cấp
                  </label>
                  <select
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    value={formData.PhanLoai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PhanLoai: e.target.value as
                          | "Nhà Cung Cấp Chính"
                          | "Nhà Cung Cấp Phụ",
                      })
                    }
                  >
                    <option value="Nhà Cung Cấp Chính">
                      Nhà cung cấp chính (Chiến lược)
                    </option>
                    <option value="Nhà Cung Cấp Phụ">Nhà cung cấp phụ (Dự phòng)</option>
                  </select>
                </div>
                {/* SDT */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="VD: 0243 xxxxx"
                    value={formData.SDT}
                    onChange={(e) =>
                      setFormData({ ...formData, SDT: e.target.value })
                    }
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="contact@company.com"
                    value={formData.Email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Email: e.target.value })
                    }
                  />
                </div>
                {/* Contact Rep */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Đại diện liên hệ
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="VD: Ông Nguyễn Văn A"
                    value={formData.NguoiLienHe || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, NguoiLienHe: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Địa chỉ trụ sở
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50/80 border border-slate-100 rounded-lg px-4 py-3.5 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                  placeholder="Nhập địa chỉ đăng ký kinh doanh chi tiết..."
                  value={formData.DiaChi || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, DiaChi: e.target.value })
                  }
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-lg font-semibold text-[13px] hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
              >
                Lưu hồ sơ nhà cung cấp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - LẬP PHIẾU ĐẶT HÀNG MỚI (PO) */}
      {isPOFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-[17px] font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-6 bg-blue-600 rounded-md"></div>
                Lập phiếu đặt hàng mới (PO)
              </h3>
              <button
                onClick={() => setIsPOFormOpen(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium flex items-center justify-center transition-colors border-none outline-none"
              >
                ×
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Mã Phiếu Đặt
                  </label>
                  <input
                    disabled
                    value={newPOData.MaPhieu}
                    className="w-full bg-slate-100 border border-slate-200 rounded-md px-4 py-3 text-sm font-semibold text-slate-450 cursor-not-allowed uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    Ngày Đặt Hàng
                  </label>
                  <input
                    type="date"
                    value={newPOData.NgayDat}
                    onChange={(e) =>
                      setNewPOData({ ...newPOData, NgayDat: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                    NV phụ trách đặt hàng
                  </label>
                  <select
                    value={newPOData.NguoiLap}
                    onChange={(e) =>
                      setNewPOData({ ...newPOData, NguoiLap: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp.MaNV}>
                        [{emp.MaNV}] {emp.HoTen}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Details Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">
                    Danh sách vật tư thu mua
                  </h4>
                  <button
                    onClick={addPOItem}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-semibold text-xs hover:bg-blue-100 transition-all cursor-pointer"
                  >
                    + Thêm vật tư
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/70 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Nguyên vật tư
                        </th>
                        <th className="p-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-32">
                          Số lượng đặt
                        </th>
                        <th className="p-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-40">
                          Đơn giá dự kiến
                        </th>
                        <th className="p-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right w-44">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newPOData.ChiTiet.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/30 transition-colors"
                        >
                          <td className="p-4">
                            <select
                              value={item.MaItem}
                              onChange={(e) =>
                                handlePOItemChange(
                                  idx,
                                  "MaItem",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            >
                              <option value="">Chọn vật tư...</option>
                              {materials.map((m) => (
                                <option key={m._id} value={m.MaNVL}>
                                  [{m.MaNVL}] {m.TenNguyenVatLieu || m.TenNVL} (
                                  {m.DonViTinh || m.DonVi})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              min="1"
                              value={item.SoLuong}
                              onChange={(e) =>
                                handlePOItemChange(
                                  idx,
                                  "SoLuong",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={item.DonGia}
                              onChange={(e) =>
                                handlePOItemChange(
                                  idx,
                                  "DonGia",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-slate-50/80 border border-slate-100 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right"
                            />
                          </td>
                          <td className="p-4 text-right font-semibold text-slate-900 text-[14.5px]">
                            {item.ThanhTien.toLocaleString("vi-VN")} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="font-medium text-slate-400 uppercase tracking-widest text-xs">
                Tổng cộng:
                <span className="text-xl font-semibold text-emerald-600 ml-2 normal-case tracking-normal">
                  {newPOData.ChiTiet.reduce(
                    (sum, i) => sum + i.ThanhTien,
                    0,
                  ).toLocaleString("vi-VN")}{" "}
                  ₫
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPOFormOpen(false)}
                  className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-lg font-semibold text-[13px] hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  Hủy đơn
                </button>
                <button
                  onClick={submitPO}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
                >
                  Xác nhận đặt hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - CẤP TÀI KHOẢN ĐĂNG NHẬP */}
      {isAccountModalOpen && accountNCC && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-6 bg-amber-500 rounded-md"></div>
                Cấp tài khoản nhà cung cấp
              </h2>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium flex items-center justify-center transition-colors border-none outline-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs font-bold text-amber-700">
                Cấp tài khoản đăng nhập cho nhà cung cấp{" "}
                <strong className="text-slate-900">{accountNCC.TenNCC}</strong>.
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={accountForm.TenDangNhap}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      TenDangNhap: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={accountForm.MatKhau}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, MatKhau: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Email liên kết
                </label>
                <input
                  type="email"
                  value={accountForm.Email}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, Email: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="Nhập email..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-md font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-6 py-3 bg-amber-500 text-white rounded-md font-semibold text-xs hover:bg-amber-600 shadow-md shadow-amber-500/20 hover:shadow-amber-550 transition-all cursor-pointer border-none"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
