"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ArrowDownToLine,
  ArrowUpToLine,
  AlertTriangle,
  FileCheck,
  ClipboardList,
  TrendingDown,
  Eye,
  Printer,
  Beaker,
  ArrowRightLeft,
  Download,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import * as XLSX from "xlsx";

const API_KHO = "/kho";

interface KhoItem {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  PhanLoai: string;
  TonKho: number;
  DonGiaCoSo: number;
  SoLuong: number;
}

interface PhieuKiemKe {
  _id: string;
  MaPhieu: string;
  TrangThai: string;
  TongChenhLech: number;
  NguoiKiem?: { MaNV: string; HoTen: string };
  createdAt: string;
  ChiTiet: Array<{
    Sanpham: { MaSanPham: string; TenDongSon: string; DonGiaCoSo: number };
    TonKhoHT: number;
    TonThucTe: number;
    ChenhLech: number;
    DonGia: number;
    ThanhTienChenhLech: number;
    SoLuong: number;
  }>;
}

interface NguyenVatLieu {
  _id: string;
  MaNVL: string;
  TenNguyenVatLieu: string;
  PhanLoai: string;
  TonKho: number;
  DonViTinh: string;
  DonGia: number;
  NhaCungCap?: { _id: string; MaNCC: string; TenNCC: string } | null;
  GiaNhapDinhMuc?: number;
  SoLuong: number;
}

interface NhaCungCapItem {
  _id: string;
  MaNCC: string;
  TenNCC: string;
}

interface PhieuNhapXuat {
  _id: string;
  MaPhieu: string;
  LoaiPhieu: string;
  LoaiHang: string;
  TongTien: number;
  MaNhanVienPhuTrach: string;
  MoTa?: string;
  createdAt: string;
  SoLuong: number;
}

export default function QuanLyKhoPage() {
  const [activeTab, setActiveTab] = useState<
    "kho" | "nvl" | "kiemke" | "nhapxuat"
  >("kho");
  const [data, setData] = useState<KhoItem[]>([]);
  const [phieuData, setPhieuData] = useState<PhieuKiemKe[]>([]);
  const [nvlData, setNvlData] = useState<NguyenVatLieu[]>([]);
  const [phieuNXData, setPhieuNXData] = useState<PhieuNhapXuat[]>([]);
  const [nccList, setNccList] = useState<NhaCungCapItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isKiemKhoModal, setIsKiemKhoModal] = useState(false);
  const [kiemKhoItems, setKiemKhoItems] = useState([
    { Sanpham: "", TonThucTe: 0 },
  ]);
  const [selectedPhieu, setSelectedPhieu] = useState<PhieuKiemKe | null>(null);
  const [maNVKiemKe, setMaNVKiemKe] = useState(""); // Kept for state but will be hidden

  const [isNVLModal, setIsNVLModal] = useState(false);
  const [editingNVLId, setEditingNVLId] = useState<string | null>(null);
  const [nvlForm, setNvlForm] = useState({
    MaNVL: "",
    TenNguyenVatLieu: "",
    PhanLoai: "Bột màu",
    DonViTinh: "Kg",
    DonGia: 0,
    TonKho: 0,
    NhaCungCap: "",
  });

  const [isNXModal, setIsNXModal] = useState(false);
  const [editingNXId, setEditingNXId] = useState<string | null>(null);
  const [nxForm, setNxForm] = useState({
    MaPhieu: "",
    LoaiPhieu: "NHAP",
    LoaiHang: "SAN_PHAM",
    MoTa: "",
    GhiChu: "",
    NhaCungCapID: "",
  });
  const [nxItems, setNxItems] = useState([
    { ItemId: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 },
  ]);

  useEffect(() => {
    fetchTonKho();
    fetchPhieuKiemKho();
    fetchNguyenVatLieu();
    fetchPhieuNhapXuat();
    fetchNhaCungCap();
  }, []);

  const fetchTonKho = async () => {
    try {
      const res = await api.get(API_KHO);
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPhieuKiemKho = async () => {
    try {
      const res = await api.get(`${API_KHO}/kiem-kho`);
      if (res.data.success) setPhieuData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNguyenVatLieu = async () => {
    try {
      const res = await api.get(`${API_KHO}/nguyen-vat-lieu`);
      if (res.data.success) setNvlData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPhieuNhapXuat = async () => {
    try {
      const res = await api.get(`${API_KHO}/nhap-xuat`);
      if (res.data.success) setPhieuNXData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNhaCungCap = async () => {
    try {
      const res = await api.get("/nha-cung-cap");
      if (res.data.success) setNccList(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // KPI
  const STATS = {
    total: data.length,
    tonTotal: data.reduce((sum, d) => sum + (d.TonKho || 0), 0),
    warning: data.filter((d) => (d.TonKho || 0) < 100).length,
  };

  // ----- KIỂM KHO LOGIC -----
  const handleAddKiemKhoItem = () => {
    setKiemKhoItems([...kiemKhoItems, { Sanpham: "", TonThucTe: 0 }]);
  };

  const handleSubmitKiemKho = async () => {
    try {
      const validItems = kiemKhoItems.filter((i) => i.Sanpham !== "");
      if (validItems.length === 0)
        return alert("Vui lòng nhập sản phẩm cần kiểm kê");

      await api.post(`${API_KHO}/kiem-kho`, {
        ChiTiet: validItems,
        MaPhieu: "PKK" + Date.now().toString().slice(-4),
      });
      alert(
        "Kiểm kê thành công! Vui lòng vào Danh sách Phiếu để xem và chốt số lượng.",
      );
      setIsKiemKhoModal(false);
      setKiemKhoItems([{ Sanpham: "", TonThucTe: 0 }]);
      setMaNVKiemKe("");
      fetchPhieuKiemKho();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi tạo phiếu kiểm kê");
    }
  };

  const hoanThanhPhiếu = async (maPhieu: string) => {
    if (
      !confirm(
        "Xác nhận Cân bằng Kho theo biên bản này? Thao tác này sẽ áp số lượng thực tế trực tiếp lên tồn kho hiện hành.",
      )
    )
      return;
    try {
      await api.post(`${API_KHO}/kiem-kho/${maPhieu}/hoan-thanh`);
      alert("Đã cập nhật tồn kho thành công!");
      fetchTonKho();
      fetchPhieuKiemKho();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi chốt phiếu");
    }
  };

  // ----- NGUYÊN VẬT LIÊU LOGIC -----
  const openCreateNVL = () => {
    setEditingNVLId(null);
    setNvlForm({
      MaNVL: "",
      TenNguyenVatLieu: "",
      PhanLoai: "Bột màu",
      DonViTinh: "Kg",
      DonGia: 0,
      TonKho: 0,
      NhaCungCap: "",
    });
    setIsNVLModal(true);
  };

  const openEditNVL = (item: NguyenVatLieu) => {
    setEditingNVLId(item._id);
    setNvlForm({
      MaNVL: item.MaNVL,
      TenNguyenVatLieu: item.TenNguyenVatLieu,
      PhanLoai: item.PhanLoai,
      DonViTinh: item.DonViTinh,
      DonGia: item.DonGia,
      TonKho: item.TonKho || 0,
      NhaCungCap: item.NhaCungCap?._id || "",
    });
    setIsNVLModal(true);
  };

  const handleDeleteNVL = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa nguyên vật liệu này?")) return;
    try {
      await api.delete(`${API_KHO}/nguyen-vat-lieu/${id}`);
      alert("Đã xóa nguyên vật liệu!");
      fetchNguyenVatLieu();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi xóa NVL");
    }
  };

  const handleSubmitNVL = async () => {
    try {
      if (!nvlForm.MaNVL || !nvlForm.TenNguyenVatLieu)
        return alert("Vui lòng nhập mã và tên nguyên vật liệu");
      if (editingNVLId) {
        await api.put(`${API_KHO}/nguyen-vat-lieu/${editingNVLId}`, nvlForm);
        alert("Cập nhật nguyên vật liệu thành công!");
      } else {
        await api.post(`${API_KHO}/nguyen-vat-lieu`, nvlForm);
        alert("Thêm nguyên vật liệu thành công!");
      }
      setIsNVLModal(false);
      setEditingNVLId(null);
      setNvlForm({
        MaNVL: "",
        TenNguyenVatLieu: "",
        PhanLoai: "Bột màu",
        DonViTinh: "Kg",
        DonGia: 0,
        TonKho: 0,
        NhaCungCap: "",
      });
      fetchNguyenVatLieu();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi lưu NVL");
    }
  };

  // ----- PHIẾU NHẬP XUẤT LOGIC -----
  const openCreateNXModal = () => {
    setEditingNXId(null);
    setNxForm({
      MaPhieu: "",
      LoaiPhieu: "NHAP",
      LoaiHang: "SAN_PHAM",
      MoTa: "",
      GhiChu: "",
      NhaCungCapID: "",
    });
    setNxItems([{ ItemId: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);
    setIsNXModal(true);
  };

  const openEditNXModal = (item: any) => {
    setEditingNXId(item._id);
    setNxForm({
      MaPhieu: item.MaPhieu,
      LoaiPhieu: item.LoaiPhieu,
      LoaiHang: item.LoaiHang,
      MoTa: item.MoTa || "",
      GhiChu: item.GhiChu || "",
      NhaCungCapID: item.NhaCungCapID || "",
    });
    setNxItems(item.ChiTiet || []);
    setIsNXModal(true);
  };

  const handleDeleteNX = async (id: string) => {
    if (
      !confirm(
        "XÁC NHẬN: Xóa phiếu này sẽ HOÀN LẠI số lượng tồn kho tương ứng. Bạn có chắc chắn muốn thực hiện?",
      )
    )
      return;
    try {
      await api.delete(`${API_KHO}/nhap-xuat/${id}`);
      alert("Đã xóa phiếu và hoàn tồn kho thành công!");
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi xóa phiếu");
    }
  };

  const handleAddNXItem = () => {
    setNxItems([
      ...nxItems,
      { ItemId: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 },
    ]);
  };

  const handleNXItemChange = (idx: number, field: string, val: any) => {
    const newItems = [...nxItems];
    // @ts-ignore
    newItems[idx][field] = val;
    // Auto calc don gia
    if (field === "ItemId") {
      const itemObj =
        nxForm.LoaiHang === "SAN_PHAM"
          ? data.find((d) => d._id === val)
          : nvlData.find((d) => d._id === val);
      if (itemObj)
        newItems[idx].DonGia =
          nxForm.LoaiHang === "SAN_PHAM"
            ? (itemObj as KhoItem).DonGiaCoSo
            : (itemObj as NguyenVatLieu).DonGia;
    }
    newItems[idx].ThanhTien = newItems[idx].SoLuong * newItems[idx].DonGia;
    setNxItems(newItems);
  };

  const handleSubmitPhieuNX = async () => {
    try {
      const validItems = nxItems.filter((i) => i.ItemId !== "");
      if (validItems.length === 0)
        return alert("Vui lòng chọn ít nhất 1 hàng hóa");

      const tongTien = nxItems.reduce((acc, curr) => acc + curr.ThanhTien, 0);

      if (editingNXId) {
        await api.put(`${API_KHO}/nhap-xuat/${editingNXId}`, {
          ...nxForm,
          TongTien: tongTien,
          ChiTiet: validItems,
        });
        alert("Đã cập nhật phiếu và điều chỉnh tồn kho!");
      } else {
        await api.post(`${API_KHO}/nhap-xuat`, {
          ...nxForm,
          TongTien: tongTien,
          ChiTiet: validItems,
        });
        alert(
          `Đã lập Phiếu ${nxForm.LoaiPhieu} thành công! Số lượng kho đã được cập nhật.`,
        );
      }
      setIsNXModal(false);
      setEditingNXId(null);
      setNxItems([{ ItemId: "", SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi lưu phiếu");
    }
  };

  const exportToExcel = () => {
    let dataToExport: any[] = [];
    let fileName = "";

    if (activeTab === "kho") {
      dataToExport = data.map((item) => ({
        "Mã SP": item.MaSanPham,
        "Tên Dòng Sơn": item.TenDongSon,
        "Phân Loại": item.PhanLoai,
        "Tồn Kho": item.TonKho || 0,
        "Đơn Giá": item.DonGiaCoSo,
        "Đơn Vị Tính": "Thùng",
      }));
      fileName = "Danh_Sach_Ton_Kho_Son";
    } else if (activeTab === "nvl") {
      dataToExport = nvlData.map((item) => ({
        "Mã NVL": item.MaNVL,
        "Tên NVL": item.TenNguyenVatLieu,
        "Phân Loại": item.PhanLoai,
        "Nhà Cung Cấp": item.NhaCungCap?.TenNCC || "---",
        "Tồn Kho": item.TonKho || 0,
        "Đơn Vị Tính": item.DonViTinh,
        "Đơn Giá": item.DonGia,
      }));
      fileName = "Danh_Sach_Nguyen_Vat_Lieu";
    } else if (activeTab === "nhapxuat") {
      dataToExport = phieuNXData.map((item) => ({
        "Mã Phiếu": item.MaPhieu,
        "Loại Phiếu": item.LoaiPhieu,
        "Loại Hàng":
          item.LoaiHang === "SAN_PHAM" ? "Thành Phẩm" : "Nguyên Vật Liệu",
        "Phụ Trách": item.MaNhanVienPhuTrach,
        "Mô Tả": item.MoTa,
        "Tổng Tiền": item.TongTien,
        "Ngày Lập": new Date(item.createdAt).toLocaleString(),
      }));
      fileName = "Lich_Su_Nhap_Xuat_Kho";
    }

    if (dataToExport.length === 0) return alert("Không có dữ liệu để xuất!");

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(
      workbook,
      `VTSC_${fileName}_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`,
    );
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tổng Mặt Hàng Sơn
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.total}
              </h3>
            </div>
            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Package size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tồn Kho Sơn
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.tonTotal}
                <span className="text-sm font-bold text-slate-400 ml-1">
                  ĐV
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <ArrowDownToLine size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nguyên Vật Liệu
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {nvlData.length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Beaker size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cảnh Báo (Dưới MOQ)
              </p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                {STATS.warning}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
        <button
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
            activeTab === "kho"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("kho")}
        >
          <Package size={18} /> Danh Mục Thành Phẩm
        </button>
        <button
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
            activeTab === "nvl"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("nvl")}
        >
          <Beaker size={18} /> Nguyên Vật Liệu Pha Chế
        </button>
        <button
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
            activeTab === "nhapxuat"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("nhapxuat")}
        >
          <ArrowRightLeft size={18} /> Lịch Sử Nhập / Xuất
        </button>
        <button
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
            activeTab === "kiemke"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("kiemke")}
        >
          <ClipboardList size={18} /> Phiếu Kiểm Kê
        </button>
      </div>

      {activeTab === "kho" && (
        <>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                placeholder="Tra cứu nhanh Mã SP, Tên dòng sơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
            >
              <Download size={18} /> Xuất Báo Cáo
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-32">
                      Mã SP
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tên Dòng Sơn
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Phân loại
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest w-48">
                      Tồn Kho (Thùng/Kg)
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Đơn giá Cơ sở
                    </th>
                    <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Trạng thái (MOQ: 200)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data
                    .filter(
                      (item) =>
                        item.TenDongSon.toLowerCase().includes(
                          searchTerm.toLowerCase(),
                        ) ||
                        item.MaSanPham.toLowerCase().includes(
                          searchTerm.toLowerCase(),
                        ),
                    )
                    .map((item) => {
                      const tk = item.TonKho || 0;
                      const isLow = tk < 200; // MOQ is 200kg
                      const pct = Math.min((tk / 1000) * 100, 100); // 1000 is arbitrary healthy stock

                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                              {item.MaSanPham}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.TenDongSon}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                              {item.PhanLoai}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-3">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner max-w-[80px]">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                                    tk >= 200
                                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                      : tk > 0
                                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                        : "bg-gradient-to-r from-rose-400 to-rose-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`font-black tabular-nums ${isLow ? "text-rose-600" : "text-emerald-600"}`}
                              >
                                {tk.toLocaleString("vi-VN")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-700">
                            {item.DonGiaCoSo.toLocaleString("vi-VN")}{" "}
                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                              đ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm border ${
                                tk >= 200
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : tk > 0
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-rose-50 text-rose-600 border-rose-100"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${tk < 200 ? "animate-pulse" : ""} ${
                                  tk >= 200
                                    ? "bg-emerald-500"
                                    : tk > 0
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                              />
                              {tk >= 200
                                ? "Đủ điều kiện (Sẵn sàng)"
                                : tk > 0
                                  ? "Sắp hết (Dưới MOQ)"
                                  : "Hết hàng (Khẩn cấp)"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "nvl" && (
        <>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                placeholder="Tra cứu nhanh Mã NVL, Tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
              >
                <Download size={18} /> Xuất Báo Cáo
              </button>
              <button
                onClick={openCreateNVL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border-none bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 w-full sm:w-auto"
              >
                <Plus size={18} /> Khai Báo NVL Mới
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-32">
                      Mã NVL
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tên Nguyên Vật Liệu
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Nhà Cung Cấp
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Nhóm Chất
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tồn Kho
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Đơn Giá
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nvlData
                    .filter(
                      (item) =>
                        item.TenNguyenVatLieu.toLowerCase().includes(
                          searchTerm.toLowerCase(),
                        ) ||
                        item.MaNVL.toLowerCase().includes(
                          searchTerm.toLowerCase(),
                        ),
                    )
                    .map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-600">
                            {item.MaNVL}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
                            {item.TenNguyenVatLieu}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.NhaCungCap ? (
                            <span className="text-[12px] font-bold text-amber-600 uppercase tracking-wider">
                              {item.NhaCungCap.TenNCC}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">
                              ---
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm border bg-slate-50 text-slate-600 border-slate-100">
                            {item.PhanLoai}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-black ${item.TonKho > 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {(item.TonKho || 0).toLocaleString("vi-VN")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">
                            {item.DonViTinh}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-700">
                          {item.DonGia.toLocaleString("vi-VN")}{" "}
                          <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                            đ
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditNVL(item)}
                              className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                              title="Sửa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteNVL(item._id)}
                              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {nvlData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-slate-400 font-medium">
                          Chưa có mặt hàng nguyên vật liệu nào.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "nhapxuat" && (
        <>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
              >
                <Download size={18} /> Xuất Báo Cáo
              </button>
              <button
                onClick={openCreateNXModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border-none bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 w-full sm:w-auto"
              >
                <ArrowRightLeft size={18} /> Lập Lệnh Nhập / Xuất
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-32">
                      Mã Lệnh
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Loại Kho
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Loại Lệnh
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Người Phụ Trách
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Mô Tả
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tổng Giá Trị
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Thời Gian
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {phieuNXData.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                          {item.MaPhieu}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">
                          {item.LoaiHang === "SAN_PHAM"
                            ? "Thành Phẩm"
                            : "Nguyên Vật Liệu"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm border ${
                            item.LoaiPhieu === "NHAP"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                        >
                          {item.LoaiPhieu === "NHAP" ? "NHẬP KHO" : "XUẤT KHO"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-600">
                          {item.MaNhanVienPhuTrach}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm text-slate-500 truncate max-w-[150px] inline-block"
                          title={item.MoTa}
                        >
                          {item.MoTa || "Không có mô tả"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {item.TongTien.toLocaleString("vi-VN")}{" "}
                        <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                          đ
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditNXModal(item)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                            title="Sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNX(item._id)}
                            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {phieuNXData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-slate-400 font-medium">
                          Chưa có lịch sử nhập xuất kho nào.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "kiemke" && (
        <>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-4 mb-6 flex justify-end items-center gap-4">
            <button
              onClick={() => setIsKiemKhoModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border border-amber-500 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-600 w-full sm:w-auto"
            >
              <FileCheck size={18} /> Tạo Phiếu Kiểm Kê Thực Tế
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-40">
                      Mã Phiếu Kiểm
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Người Lập Phiếu
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tổng Lệch (Giá Trị)
                    </th>
                    <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Trạng thái
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Ngày Lập
                    </th>
                    <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {phieuData.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                          {item.MaPhieu}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">
                          {item.NguoiKiem
                            ? `${item.NguoiKiem.MaNV} - ${item.NguoiKiem.HoTen}`
                            : "Hệ Thống Tự Động"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-black text-lg ${item.TongChenhLech < 0 ? "text-rose-600" : item.TongChenhLech > 0 ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {item.TongChenhLech > 0 ? "+" : ""}
                            {item.TongChenhLech.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            VNĐ
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm border ${
                            item.TrangThai === "HOAN_THANH"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {item.TrangThai === "HOAN_THANH"
                            ? "Đã Chốt Số"
                            : "Đang Xử Lý"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPhieu(item)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                            title="Xem chi tiết & In"
                          >
                            <Eye size={14} />
                          </button>
                          {item.TrangThai !== "HOAN_THANH" && (
                            <button
                              onClick={() => hoanThanhPhiếu(item.MaPhieu)}
                              className="inline-flex items-center px-3 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              Chốt Số
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {phieuData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-slate-400 font-medium">
                          Chưa có phiếu kiểm kê nào được lập.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {/* --- MODALS --- */}

      {/* Modal Lập / Sửa Phiếu NVL */}
      {isNVLModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--bg-color)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px",
              margin: "2rem auto",
              color: "#0f172a",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "24px",
              }}
            >
              {editingNVLId
                ? "Cập Nhật Nguyên Vật Liệu"
                : "Khai Báo Nguyên Vật Liệu Mới"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label>Mã NVL</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={nvlForm.MaNVL}
                  onChange={(e) =>
                    setNvlForm({ ...nvlForm, MaNVL: e.target.value })
                  }
                  disabled={!!editingNVLId}
                  style={editingNVLId ? { opacity: 0.6 } : {}}
                />
              </div>
              <div>
                <label>Tên Nguyên Liệu</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={nvlForm.TenNguyenVatLieu}
                  onChange={(e) =>
                    setNvlForm({ ...nvlForm, TenNguyenVatLieu: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label>Bộ phân loại</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={nvlForm.PhanLoai}
                    onChange={(e) =>
                      setNvlForm({ ...nvlForm, PhanLoai: e.target.value })
                    }
                  >
                    <option>Bột màu</option>
                    <option>Dung môi</option>
                    <option>Nhựa</option>
                    <option>Phụ gia</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Đơn Vị Tính</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={nvlForm.DonViTinh}
                    onChange={(e) =>
                      setNvlForm({ ...nvlForm, DonViTinh: e.target.value })
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label>Số lượng tồn kho</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    min={0}
                    value={nvlForm.TonKho}
                    onChange={(e) =>
                      setNvlForm({ ...nvlForm, TonKho: Number(e.target.value) })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Giá Thành Base (₫)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={nvlForm.DonGia}
                    onChange={(e) =>
                      setNvlForm({ ...nvlForm, DonGia: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label>Nhà Cung Cấp</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={nvlForm.NhaCungCap}
                  onChange={(e) =>
                    setNvlForm({ ...nvlForm, NhaCungCap: e.target.value })
                  }
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {nccList.map((ncc) => (
                    <option key={ncc._id} value={ncc._id}>
                      {ncc.MaNCC} - {ncc.TenNCC}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setIsNVLModal(false);
                  setEditingNVLId(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                style={{ flex: 1 }}
              >
                Đóng
              </button>
              <button
                onClick={handleSubmitNVL}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{ flex: 1 }}
              >
                {editingNVLId ? "Cập Nhật" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Nhập Xuất */}
      {isNXModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              background: "var(--bg-color)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px",
              margin: "2rem auto",
              color: "#0f172a",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "24px",
              }}
            >
              {editingNXId
                ? `Chỉnh sửa Phiếu ${nxForm.MaPhieu}`
                : "Lập Phiếu Lệnh Kho"}
            </h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label>Mục Đích Lệnh</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={nxForm.LoaiPhieu}
                  onChange={(e) =>
                    setNxForm({ ...nxForm, LoaiPhieu: e.target.value })
                  }
                  disabled={!!editingNXId}
                >
                  <option value="NHAP">Biên Bản Nhập Kho</option>
                  <option value="XUAT">Biên Bản Xuất Tồn</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Đối Tượng Lệnh</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={nxForm.LoaiHang}
                  onChange={(e) =>
                    setNxForm({ ...nxForm, LoaiHang: e.target.value })
                  }
                  disabled={!!editingNXId}
                >
                  <option value="SAN_PHAM">Tác Động Lên Thành Phẩm Sơn</option>
                  <option value="NGUYEN_VAT_LIEU">
                    Tác Động Lên NVL Pha Chế
                  </option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Mô tả Nhập / Xuất Kho</label>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={nxForm.MoTa}
                onChange={(e) => setNxForm({ ...nxForm, MoTa: e.target.value })}
              />
            </div>

            {/* Items List */}
            <h4 style={{ marginTop: 24, marginBottom: 16 }}>
              Hàng Hóa Chỉ Định:
            </h4>
            {nxItems.map((k: any, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  alignItems: "center",
                  background: "rgba(255,255,255,0.02)",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <div style={{ flex: 2 }}>
                  <label>
                    Mã Sản Phẩm {nxForm.LoaiHang === "SAN_PHAM" ? "Sơn" : "NVL"}
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={k.ItemId}
                    onChange={(e) =>
                      handleNXItemChange(idx, "ItemId", e.target.value)
                    }
                    disabled={!!editingNXId}
                  >
                    <option value="">-- Tra Mã Nhanh --</option>
                    {nxForm.LoaiHang === "SAN_PHAM"
                      ? data.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.MaSanPham} - {d.TenDongSon} (Tồn HT:{" "}
                            {d.TonKho || 0})
                          </option>
                        ))
                      : nvlData.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.MaNVL} - {d.TenNguyenVatLieu} (Tồn HT:{" "}
                            {d.TonKho || 0})
                          </option>
                        ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={k.SoLuong}
                    onChange={(e) =>
                      handleNXItemChange(idx, "SoLuong", Number(e.target.value))
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Đơn Giá (Nháp)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={k.DonGia}
                    onChange={(e) =>
                      handleNXItemChange(idx, "DonGia", Number(e.target.value))
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Tạm Tính</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={k.ThanhTien}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
            {!editingNXId && (
              <button
                onClick={handleAddNXItem}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                style={{
                  border: "1px dashed #e2e8f0",
                  width: "100%",
                  marginBottom: 24,
                }}
              >
                + Chọn thêm Danh mục xuống lệnh
              </button>
            )}

            <div style={{ marginTop: "24px", display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setIsNXModal(false);
                  setEditingNXId(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                style={{ flex: 1 }}
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSubmitPhieuNX}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{
                  flex: 1,
                  background:
                    nxForm.LoaiPhieu === "NHAP" ? "#059669" : "#e11d48",
                }}
              >
                {editingNXId
                  ? "Cập Nhật Phiếu & Điều Chỉnh Tồn"
                  : "Khởi Tạo Biên Bản & Cập Nhật Số Tồn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Kiem Ke (Giữ nguyên cấu trúc đã có) */}
      {isKiemKhoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "700px",
              background: "var(--bg-color)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px",
              margin: "2rem auto",
              color: "#0f172a",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
                Ghi Nhận Thực Tế Lô Kiểm Kê
              </h3>
              <button
                onClick={() => setIsKiemKhoModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              {kiemKhoItems.map((k, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 16,
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: "8px",
                        fontSize: "14px",
                      }}
                    >
                      Mã Sản Phẩm Trích Xuất
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        background: "#ffffff",
                      }}
                      value={k.Sanpham}
                      onChange={(e) => {
                        const newArr = [...kiemKhoItems];
                        newArr[idx].Sanpham = e.target.value;
                        setKiemKhoItems(newArr);
                      }}
                    >
                      <option value="">
                        -- Định danh đối chiếu (Load trực tiếp từ SP) --
                      </option>
                      {data.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.MaSanPham} - {d.TenDongSon} (Tồn HT:{" "}
                          {d.TonKho || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 150 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: "8px",
                        fontSize: "14px",
                      }}
                    >
                      Phát Hiện Số Tồn
                    </label>
                    <input
                      type="number"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        background: "#ffffff",
                      }}
                      value={k.TonThucTe}
                      onChange={(e) => {
                        const newArr = [...kiemKhoItems];
                        newArr[idx].TonThucTe = Number(e.target.value);
                        setKiemKhoItems(newArr);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddKiemKhoItem}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                style={{
                  border: "1px dashed #e2e8f0",
                  width: "100%",
                }}
              >
                + Thêm dòng sản phẩm sai lệch
              </button>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                onClick={handleSubmitKiemKho}
                style={{
                  width: "100%",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Lưu Phiếu & Tính Chênh Lệch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Phiếu -> In Phiếu */}
      {selectedPhieu && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="print-area"
            style={{
              width: "100%",
              maxWidth: "800px",
              background: "#fff",
              borderRadius: "8px",
              padding: "30px",
              margin: "2rem auto",
              color: "#000",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
              className="no-print"
            >
              <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
                Chi tiết Phiếu {selectedPhieu.MaPhieu}
              </h3>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  <Printer size={16} /> In Phiếu
                </button>
                <button
                  onClick={() => setSelectedPhieu(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2>BIÊN BẢN KIỂM KÊ KHO</h2>
              <p>Mã phiếu: {selectedPhieu.MaPhieu}</p>
              <p>
                Ngày lập: {new Date(selectedPhieu.createdAt).toLocaleString()} |
                Trạng thái: {selectedPhieu.TrangThai}
              </p>
              <p>
                Nhân viên kiểm kê:{" "}
                {selectedPhieu.NguoiKiem
                  ? `${selectedPhieu.NguoiKiem.MaNV} - ${selectedPhieu.NguoiKiem.HoTen}`
                  : "ADMIN"}
              </p>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 20,
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: 8 }}>
                    Sản phẩm
                  </th>
                  <th style={{ border: "1px solid #000", padding: 8 }}>
                    Tồn HT
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: 8,
                      background: "#f5f5f5",
                    }}
                  >
                    Tồn Thực Tế
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: 8,
                      color: "red",
                    }}
                  >
                    Lệch Số Lượng
                  </th>
                  <th style={{ border: "1px solid #000", padding: 8 }}>
                    Đơn giá Lệch (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedPhieu.ChiTiet.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: 8 }}>
                      {row.Sanpham ? row.Sanpham.TenDongSon : "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      {row.TonKhoHT}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: 8,
                        textAlign: "center",
                        background: "#f5f5f5",
                        fontWeight: "bold",
                      }}
                    >
                      {row.TonThucTe}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: 8,
                        textAlign: "center",
                        color: row.ChenhLech < 0 ? "red" : "green",
                      }}
                    >
                      {row.ChenhLech}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: 8,
                        textAlign: "right",
                      }}
                    >
                      {row.ThanhTienChenhLech.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      border: "1px solid #000",
                      padding: 8,
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    TỔNG CHÊNH LỆCH BẰNG TIỀN (Ghi Nhận Lỗ/Lãi):
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: 8,
                      textAlign: "right",
                      fontWeight: "bold",
                      color: selectedPhieu.TongChenhLech < 0 ? "red" : "green",
                    }}
                  >
                    {selectedPhieu.TongChenhLech.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginTop: 50,
                textAlign: "center",
              }}
            >
              <div>
                <strong>Người lập phiếu</strong>
                <p>(Ký, ghi rõ họ tên)</p>
              </div>
              <div>
                <strong>Trưởng bộ phận kho / logistic</strong>
                <p>(Ký, ghi rõ họ tên)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
