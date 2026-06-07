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
  X,
  Box,
  TrendingUp,
  Star,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import api from "@/lib/utils/axiosAuth";
import * as XLSX from "xlsx";
import { paintColors } from "@/lib/data/colors-data";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import PhieuDetailModal from "@/components/PhieuDetailModal";
import PhieuKiemKeModal from "@/components/PhieuKiemKeModal";

import { resolveImageUrl } from "@/lib/utils/imageUrl";

const API_KHO = "/inventory";

interface MaMauItem {
  _id: string;
  MaMau: string;
  TenMau: string;
  HexCode?: string;
  TonKhoKhaDung: number;
  TonKhoTamGiu: number;
  NguongCanhBao: number;
  TrangThai: boolean;
  HinhAnh?: string;
}

interface KhoItem {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  PhanLoai: string;
  TongTonKho: number;
  DonGiaCoSo: number;
  DonViTinh: string;
  DanhSachMaMau: MaMauItem[];
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
  congno: number;
}

interface PhieuNhapXuat {
  _id: string;
  MaPhieu: string;
  LoaiPhieu: string;
  LoaiHang: string;
  TongTien: number;
  TenNguoiLap: string;
  TenNguoiDuyet?: string;
  TrangThai: string;
  NgayDuyet?: string;
  LyDoTuChoi?: string;
  MoTa?: string;
  createdAt: string;
  SoLuong: number;
}

interface BestSellerItem {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  HinhAnh: string;
  SoLuongBan: number;
  TongDoanhThu: number;
}

export default function QLKhoPage() {
  const [activeTab, setActiveTab] = useState<string>("kho");
  const [data, setData] = useState<KhoItem[]>([]);
  const [phieuData, setPhieuData] = useState<PhieuKiemKe[]>([]);
  const [nvlData, setNvlData] = useState<NguyenVatLieu[]>([]);
  const [phieuNXData, setPhieuNXData] = useState<PhieuNhapXuat[]>([]);
  const [nccList, setNccList] = useState<NhaCungCapItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Accordion state for paint product color variants
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Modals
  const [isKiemKhoModal, setIsKiemKhoModal] = useState(false);
  const [kiemKhoItems, setKiemKhoItems] = useState<any[]>([
    { Sanpham: "", MaMau: "", TenMau: "", TonThucTe: 0 },
  ]);
  const [selectedPhieu, setSelectedPhieu] = useState<PhieuKiemKe | null>(null);
  const [maNVKiemKe, setMaNVKiemKe] = useState(""); // Kept for state but will be hidden

  const [isNVLModal, setIsNVLModal] = useState(false);
  const [editingNVLId, setEditingNVLId] = useState<string | null>(null);
  const [nvlForm, setNvlForm] = useState({
    MaNVL: "",
    TenNguyenVatLieu: "",
    PhanLoai: "Bột màu",
    DonViTinh: "Thùng",
    DonGia: 0,
    TonKho: 0,
    NhaCungCap: "",
  });

  const [isNXModal, setIsNXModal] = useState(false);
  const [editingNXId, setEditingNXId] = useState<string | null>(null);
  const [openColorDropdownIdx, setOpenColorDropdownIdx] = useState<
    number | null
  >(null);
  const [nxForm, setNxForm] = useState({
    MaPhieu: "",
    LoaiPhieu: "NHAP",
    LoaiHang: "SAN_PHAM",
    MoTa: "",
    GhiChu: "",
    NhaCungCapID: "",
  });
  const [nxItems, setNxItems] = useState<any[]>([
    {
      ItemId: "",
      MaMau: "",
      TenMau: "",
      MaItem: "",
      TenItem: "",
      SoLuong: 50,
      DonGia: 0,
      ThanhTien: 0,
    },
  ]);

  useEffect(() => {
    fetchTonKho();
    fetchPhieuKiemKho();
    fetchNguyenVatLieu();
    fetchPhieuNhapXuat();
    fetchNhaCungCap();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const openNX = searchParams.get("openNX");
      const prefill = searchParams.get("prefillMaterials");

      if (openNX === "true" && prefill && nvlData.length > 0) {
        // Set the active tab to History of Imports/Exports
        setActiveTab("nhapxuat");

        // Parse query params formatting "id:quantity,id2:quantity2"
        const pairs = prefill.split(",");
        const itemsToPrefill: any[] = [];

        pairs.forEach((pair) => {
          const [maNVL, qtyStr] = pair.split(":");
          if (!maNVL) return;
          const qty = parseFloat(qtyStr || "0");

          // Match the out-of-stock raw material inside database NVL list
          const mat = nvlData.find((m) => m.MaNVL === maNVL);
          if (mat) {
            itemsToPrefill.push({
              ItemId: mat._id,
              MaMau: "",
              TenMau: "",
              MaItem: mat.MaNVL,
              TenItem: mat.TenNguyenVatLieu,
              SoLuong: qty,
              DonGia: mat.DonGia || 0,
              ThanhTien: qty * (mat.DonGia || 0),
            });
          }
        });

        if (itemsToPrefill.length > 0) {
          // Initialize NX Form preset to NHAP and NGUYEN_VAT_LIEU
          setNxForm({
            MaPhieu: "",
            LoaiPhieu: "NHAP",
            LoaiHang: "NGUYEN_VAT_LIEU",
            MoTa: "Nhập nguyên vật liệu bổ sung cho mẻ test R&D",
            GhiChu: "",
            NhaCungCapID: "",
          });
          setNxItems(itemsToPrefill);
          setIsNXModal(true);

          // Clean URL parameters immediately
          const url = new URL(window.location.href);
          url.searchParams.delete("openNX");
          url.searchParams.delete("prefillMaterials");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [nvlData]);

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
      const res = await api.get("/suppliers");
      if (res.data.success) setNccList(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // KPI
  const STATS = {
    total: data.length,
    tonTotal: data.reduce((sum, d) => sum + (d.TongTonKho || 0), 0),
    warning: data.filter((d) => (d.TongTonKho || 0) < 100).length,
  };

  // ----- KIỂM KHO LOGIC -----
  const handleAddKiemKhoItem = () => {
    setKiemKhoItems([
      ...kiemKhoItems,
      { Sanpham: "", MaMau: "", TenMau: "", TonThucTe: 0 },
    ]);
  };

  const handleSubmitKiemKho = async () => {
    try {
      const validItems = kiemKhoItems.filter((i) => i.Sanpham !== "");
      if (validItems.length === 0)
        return toast.error("Vui lòng chọn sản phẩm để kiểm kê");

      await api.post(`${API_KHO}/kiem-kho`, {
        ChiTiet: validItems,
        MaPhieu: "PKK" + Date.now().toString().slice(-4),
      });
      toast.success(
        "Kiểm kê thành công! Vui lòng vào Danh sách Phiếu để xem và chốt số lượng.",
      );
      setIsKiemKhoModal(false);
      setKiemKhoItems([{ Sanpham: "", TonThucTe: 0 }]);
      setMaNVKiemKe("");
      fetchPhieuKiemKho();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo phiếu kiểm kê");
    }
  };

  const hoanThanhPhiếu = async (maPhieu: string) => {
    const confirmResult = await Swal.fire({
      title: "Xác nhận",
      text: "Xác nhận Cân bằng Kho theo biên bản này? Thao tác này sẽ áp số lượng thực tế trực tiếp lên tồn kho hiện hành.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-lg border border-slate-100 shadow-2xl font-sans",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm text-slate-700 bg-white border border-slate-200",
      },
    });
    if (!confirmResult.isConfirmed) return;
    try {
      await api.post(`${API_KHO}/kiem-kho/${maPhieu}/hoan-thanh`);
      toast.success("Đã cập nhật tồn kho thành công!");
      fetchTonKho();
      fetchPhieuKiemKho();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi chốt phiếu");
    }
  };

  // ----- NGUYÊN VẬT LIÊU LOGIC -----
  const openCreateNVL = () => {
    setEditingNVLId(null);
    setNvlForm({
      MaNVL: "",
      TenNguyenVatLieu: "",
      PhanLoai: "Bột màu",
      DonViTinh: "Thùng",
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
    const confirmResult = await Swal.fire({
      title: "Xóa Nguyên Vật Liệu",
      text: "Bạn có chắc muốn xóa nguyên vật liệu này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-lg border border-slate-100 shadow-2xl font-sans",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm text-slate-700 bg-white border border-slate-200",
      },
    });
    if (!confirmResult.isConfirmed) return;
    try {
      await api.delete(`${API_KHO}/nguyen-vat-lieu/${id}`);
      toast.success("Đã xóa nguyên vật liệu!");
      fetchNguyenVatLieu();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xóa NVL");
    }
  };

  const handleSubmitNVL = async () => {
    try {
      if (!nvlForm.MaNVL || !nvlForm.TenNguyenVatLieu)
        return toast.error("Vui lòng nhập mã và tên nguyên vật liệu");
      if (editingNVLId) {
        await api.put(`${API_KHO}/nguyen-vat-lieu/${editingNVLId}`, nvlForm);
        toast.success("Cập nhật nguyên vật liệu thành công!");
      } else {
        await api.post(`${API_KHO}/nguyen-vat-lieu`, nvlForm);
        toast.success("Thêm nguyên vật liệu thành công!");
      }
      setIsNVLModal(false);
      setEditingNVLId(null);
      setNvlForm({
        MaNVL: "",
        TenNguyenVatLieu: "",
        PhanLoai: "Bột màu",
        DonViTinh: "Thùng",
        DonGia: 0,
        TonKho: 0,
        NhaCungCap: "",
      });
      fetchNguyenVatLieu();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu NVL");
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
    setNxItems([
      {
        ItemId: "",
        MaItem: "",
        TenItem: "",
        MaMau: "",
        TenMau: "",
        SoLuong: 50,
        DonGia: 0,
        ThanhTien: 0,
      },
    ]);
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
    const confirmResult = await Swal.fire({
      title: "Xóa Phiếu",
      text: "XÁC NHẬN: Bạn có chắc chắn muốn xóa phiếu này? (Chỉ phiếu đang chờ duyệt mới được xóa)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-lg border border-slate-100 shadow-2xl font-sans",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm text-slate-700 bg-white border border-slate-200",
      },
    });
    if (!confirmResult.isConfirmed) return;
    try {
      await api.delete(`${API_KHO}/nhap-xuat/${id}`);
      toast.success("Đã xóa phiếu thành công!");
      fetchPhieuNhapXuat();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xóa phiếu");
    }
  };

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedPhieuNX, setSelectedPhieuNX] = useState<any | null>(null);

  // ★ DUYỆT PHIẾU
  const handleDuyetPhieu = async (id: string) => {
    // Guard: prevent duplicate concurrent requests (React Strict Mode / double-click)
    if (processingIds.has(id)) return;

    const confirmResult = await Swal.fire({
      title: "Duyệt Phiếu",
      text: "Xác nhận DUYỆT phiếu này? Tồn kho sẽ được cập nhật ngay lập tức.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#cbd5e1",
      customClass: {
        popup: "rounded-lg border border-slate-100 shadow-2xl font-sans",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm text-slate-700 bg-white border border-slate-200",
      },
    });
    if (!confirmResult.isConfirmed) return;

    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const res = await api.post(`${API_KHO}/nhap-xuat/${id}/duyet`);
      toast.success(res.data.message || "Đã duyệt phiếu thành công!");
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi duyệt phiếu");
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // ★ TỪ CHỐI PHIẾU
  const handleTuChoiPhieu = async (id: string) => {
    const { value: lyDo } = await Swal.fire({
      title: "Từ chối phiếu",
      text: "Nhập lý do từ chối:",
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#cbd5e1",
      inputValidator: (value) => {
        if (!value) {
          return "Vui lòng nhập lý do từ chối!";
        }
        return null;
      },
      customClass: {
        popup: "rounded-lg border border-slate-100 shadow-2xl font-sans",
        title: "text-xl font-bold text-slate-800",
        input:
          "border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500",
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm text-slate-700 bg-white border border-slate-200",
      },
    });
    if (!lyDo) return;
    try {
      const res = await api.post(`${API_KHO}/nhap-xuat/${id}/tu-choi`, {
        lyDo,
      });
      toast.success(res.data.message || "Đã từ chối phiếu!");
      fetchPhieuNhapXuat();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi từ chối phiếu");
    }
  };

  const handleAddNXItem = () => {
    setNxItems([
      ...nxItems,
      {
        ItemId: "",
        MaItem: "",
        TenItem: "",
        MaMau: "",
        TenMau: "",
        SoLuong: 50,
        DonGia: 0,
        ThanhTien: 0,
      },
    ]);
  };

  const handleAddAllColorsNX = (idx: number, itemId: string) => {
    const sp = data.find((d) => d._id === itemId);
    if (!sp) return;

    const newItems = [...nxItems];

    // Apply the first color to the current row
    newItems[idx].MaMau = paintColors[0].code;
    newItems[idx].TenMau = paintColors[0].name;

    // Append the remaining colors
    for (let i = 1; i < paintColors.length; i++) {
      const color = paintColors[i];
      newItems.push({
        ItemId: itemId,
        MaItem: sp.MaSanPham,
        TenItem: sp.TenDongSon,
        MaMau: color.code,
        TenMau: color.name,
        SoLuong: 50,
        DonGia: sp.DonGiaCoSo,
        ThanhTien: sp.DonGiaCoSo,
      });
    }

    // Calculate total for the first row as well
    newItems[idx].ThanhTien =
      (newItems[idx].SoLuong || 50) * (newItems[idx].DonGia || 0);

    setNxItems(newItems);
  };

  const handleNXItemChange = (idx: number, field: string, val: any) => {
    const newItems = [...nxItems];
    newItems[idx][field] = val;

    // Auto calc don gia + tên khi chọn sản phẩm
    if (field === "ItemId") {
      const itemObj =
        nxForm.LoaiHang === "SAN_PHAM"
          ? data.find((d) => d._id === val)
          : nvlData.find((d) => d._id === val);
      if (itemObj) {
        newItems[idx].DonGia =
          nxForm.LoaiHang === "SAN_PHAM"
            ? (itemObj as KhoItem).DonGiaCoSo
            : (itemObj as NguyenVatLieu).DonGia;
        newItems[idx].MaItem =
          nxForm.LoaiHang === "SAN_PHAM"
            ? (itemObj as KhoItem).MaSanPham
            : (itemObj as NguyenVatLieu).MaNVL;
        newItems[idx].TenItem =
          nxForm.LoaiHang === "SAN_PHAM"
            ? (itemObj as KhoItem).TenDongSon
            : (itemObj as NguyenVatLieu).TenNguyenVatLieu;
      }
      // Reset MaMau khi đổi sản phẩm
      newItems[idx].MaMau = "";
      newItems[idx].TenMau = "";
    }

    // Auto fill TenMau khi chọn MaMau
    if (field === "MaMau" && nxForm.LoaiHang === "SAN_PHAM") {
      const sp = data.find((d) => d._id === newItems[idx].ItemId);
      if (sp) {
        const mau = sp.DanhSachMaMau?.find((m) => m.MaMau === val);
        if (mau) {
          newItems[idx].TenMau = mau.TenMau || "";
        } else {
          const globalColor = paintColors.find((c) => c.code === val);
          newItems[idx].TenMau = globalColor?.name || "";
        }
      }
    }

    newItems[idx].ThanhTien = newItems[idx].SoLuong * newItems[idx].DonGia;
    setNxItems(newItems);
  };

  const handleSubmitPhieuNX = async () => {
    try {
      const validItems = nxItems.filter((i) => i.ItemId !== "");
      if (validItems.length === 0)
        return toast.error("Vui lòng chọn ít nhất 1 hàng hóa");

      if (nxForm.LoaiHang === "SAN_PHAM") {
        const missingColor = validItems.find((i) => !i.MaMau);
        if (missingColor) {
          return toast.error(
            `Sản phẩm "${missingColor.TenItem}" chưa chọn mã màu.`,
          );
        }
      }

      const tongTien = nxItems.reduce((acc, curr) => acc + curr.ThanhTien, 0);

      if (editingNXId) {
        await api.put(`${API_KHO}/nhap-xuat/${editingNXId}`, {
          ...nxForm,
          TongTien: tongTien,
          ChiTiet: validItems,
        });
        toast.success("Đã cập nhật phiếu và điều chỉnh tồn kho!");
      } else {
        await api.post(`${API_KHO}/nhap-xuat`, {
          ...nxForm,
          ChiTiet: validItems,
        });
        toast.success(
          `Đã lập Phiếu ${nxForm.LoaiPhieu} thành công! Phiếu đang chờ Admin duyệt.`,
        );
      }
      setIsNXModal(false);
      setEditingNXId(null);
      setNxItems([
        {
          ItemId: "",
          MaItem: "",
          TenItem: "",
          MaMau: "",
          TenMau: "",
          SoLuong: 50,
          DonGia: 0,
          ThanhTien: 0,
        },
      ]);
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi lưu phiếu");
    }
  };

  const exportToExcel = () => {
    const now = new Date();
    const kyBaoCao = `${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
    const ngayXuat = now.toLocaleDateString("vi-VN");

    const buildSheet = (
      title: string,
      headers: string[],
      rows: any[][],
      totalRow: any[],
    ): XLSX.WorkSheet => {
      const N = headers.length;
      const aoa: any[][] = [
        ["Đơn vị:", "Công ty CP TM và DV VOSCO", ...Array(N - 2).fill("")],
        [
          "Địa chỉ:",
          "215 Lạch Tray, Gia Viên, Hải Phòng",
          ...Array(N - 2).fill(""),
        ],
        ["Mã số thuế:", "0200387895", ...Array(N - 2).fill("")],
        Array(N).fill(""),
        [title, ...Array(N - 1).fill("")],
        [`Kỳ kế toán: ${kyBaoCao}`, ...Array(N - 1).fill("")],
        [`Ngày xuất báo cáo: ${ngayXuat}`, ...Array(N - 1).fill("")],
        Array(N).fill(""),
        headers,
        ...rows,
        totalRow,
        Array(N).fill(""),
        [
          "Người lập phiếu",
          "",
          "",
          "Thủ kho",
          "",
          "",
          "Kế toán trưởng",
          "",
          "",
          "Giám đốc",
        ],
        [
          "(Ký, họ tên)",
          "",
          "",
          "(Ký, họ tên)",
          "",
          "",
          "(Ký, họ tên)",
          "",
          "",
          "(Ký, họ tên)",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const sigR1 = 9 + rows.length + 2;
      const sigR2 = sigR1 + 1;
      ws["!merges"] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: N - 1 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: N - 1 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: N - 1 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: N - 1 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: N - 1 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: N - 1 } },
        { s: { r: sigR1, c: 0 }, e: { r: sigR1, c: 2 } },
        { s: { r: sigR1, c: 3 }, e: { r: sigR1, c: 5 } },
        { s: { r: sigR1, c: 6 }, e: { r: sigR1, c: 8 } },
        { s: { r: sigR2, c: 0 }, e: { r: sigR2, c: 2 } },
        { s: { r: sigR2, c: 3 }, e: { r: sigR2, c: 5 } },
        { s: { r: sigR2, c: 6 }, e: { r: sigR2, c: 8 } },
      ];
      ws["!cols"] = headers.map((_, i) => ({
        wch: i === 0 ? 5 : i === 2 ? 34 : i === 1 ? 16 : 16,
      }));
      return ws;
    };

    let ws: XLSX.WorkSheet;
    let fileName = "";

    if (activeTab === "kho") {
      if (data.length === 0) return toast.error("Không có dữ liệu để xuất!");
      const headers = [
        "STT",
        "Mã hàng",
        "Tên dòng sơn",
        "ĐVT",
        "Phân loại",
        "Tồn kho",
        "Đơn giá",
        "Thành tiền",
      ];
      const rows = data.map((item, i) => [
        i + 1,
        item.MaSanPham,
        item.TenDongSon,
        item.DonViTinh || "Thùng",
        item.PhanLoai || "—",
        item.TongTonKho || 0,
        item.DonGiaCoSo || 0,
        (item.TongTonKho || 0) * (item.DonGiaCoSo || 0),
      ]);
      const tongTon = data.reduce((s, x) => s + (x.TongTonKho || 0), 0);
      const tongTT = data.reduce(
        (s, x) => s + (x.TongTonKho || 0) * (x.DonGiaCoSo || 0),
        0,
      );
      ws = buildSheet("BÁO CÁO TỒN KHO", headers, rows, [
        "TỔNG CỘNG",
        "",
        "",
        "",
        "",
        tongTon,
        "",
        tongTT,
      ]);
      fileName = "Bao_Cao_Ton_Kho";
    } else if (activeTab === "nvl") {
      if (nvlData.length === 0) return toast.error("Không có dữ liệu để xuất!");
      const headers = [
        "STT",
        "Mã NVL",
        "Tên nguyên vật liệu",
        "Phân loại",
        "Nhà cung cấp",
        "ĐVT",
        "Tồn kho",
        "Đơn giá",
        "Thành tiền",
      ];
      const rows = nvlData.map((item, i) => [
        i + 1,
        item.MaNVL,
        item.TenNguyenVatLieu,
        item.PhanLoai || "—",
        item.NhaCungCap?.TenNCC || "—",
        item.DonViTinh,
        item.TonKho || 0,
        item.DonGia || 0,
        (item.TonKho || 0) * (item.DonGia || 0),
      ]);
      const tongTon = nvlData.reduce((s, x) => s + (x.TonKho || 0), 0);
      const tongTT = nvlData.reduce(
        (s, x) => s + (x.TonKho || 0) * (x.DonGia || 0),
        0,
      );
      ws = buildSheet("BÁO CÁO TỒN KHO NGUYÊN VẬT LIỆU", headers, rows, [
        "TỔNG CỘNG",
        "",
        "",
        "",
        "",
        "",
        tongTon,
        "",
        tongTT,
      ]);
      fileName = "Bao_Cao_Nguyen_Vat_Lieu";
    } else if (activeTab === "nhapxuat") {
      if (phieuNXData.length === 0)
        return toast.error("Không có dữ liệu để xuất!");
      const headers = [
        "STT",
        "Mã phiếu",
        "Tên phiếu",
        "Loại hàng",
        "Trạng thái",
        "Người lập",
        "Mô tả",
        "Tổng tiền (VNĐ)",
        "Ngày lập",
      ];
      const rows = phieuNXData.map((item, i) => [
        i + 1,
        item.MaPhieu,
        item.LoaiPhieu === "NHAP" ? "Phiếu nhập kho" : "Phiếu xuất kho",
        item.LoaiHang === "SAN_PHAM" ? "Thành phẩm" : "Nguyên vật liệu",
        item.TrangThai === "DA_DUYET"
          ? "Đã duyệt"
          : item.TrangThai === "TU_CHOI"
            ? "Từ chối"
            : "Chờ duyệt",
        item.TenNguoiLap || "—",
        item.MoTa || "",
        item.TongTien || 0,
        new Date(item.createdAt).toLocaleString("vi-VN"),
      ]);
      const tongTien = phieuNXData.reduce((s, x) => s + (x.TongTien || 0), 0);
      ws = buildSheet("BÁO CÁO NHẬP XUẤT KHO", headers, rows, [
        "TỔNG CỘNG",
        "",
        "",
        "",
        "",
        "",
        "",
        tongTien,
        "",
      ]);
      fileName = "Bao_Cao_Nhap_Xuat_Kho";
    } else {
      return toast.error("Không có dữ liệu để xuất!");
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCao");
    XLSX.writeFile(
      wb,
      `VOSCO_${fileName}_${ngayXuat.replace(/\//g, "_")}.xlsx`,
    );
  };

  return (
    <>
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-md blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tổng Mặt Hàng Sơn
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {STATS.total}
                </h3>
              </div>
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Package size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-md blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tồn Kho Sơn
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {STATS.tonTotal}
                  <span className="text-sm font-bold text-slate-400 ml-1">
                    ĐV
                  </span>
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <ArrowDownToLine size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-md blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nguyên Vật Liệu
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {nvlData.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Beaker size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-md blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cảnh Báo (Dưới MOQ)
                </p>
                <h3 className="text-2xl font-semibold text-rose-600 tracking-tight">
                  {STATS.warning}
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <AlertTriangle size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 bg-white p-2 rounded-lg border border-slate-100 shadow-sm w-fit">
          <button
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
              activeTab === "kho"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-transparent text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("kho")}
          >
            <Package size={18} /> Sản phẩm sơn
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
              activeTab === "nvl"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-transparent text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("nvl")}
          >
            <Beaker size={18} /> Nguyên vật liệu pha chế
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
              activeTab === "nhapxuat"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-transparent text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("nhapxuat")}
          >
            <ArrowRightLeft size={18} /> Lịch sử nhập / xuất
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${
              activeTab === "kiemke"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-transparent text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("kiemke")}
          >
            <ClipboardList size={18} /> Phiếu kiểm kê
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
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  placeholder="Tra cứu nhanh Mã SP, Tên dòng sơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
              >
                <Download size={18} /> Xuất báo cáo
              </button>
            </div>

            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-32">
                        Mã SP
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tên Dòng Sơn
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Phân loại
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-48">
                        Tồn Kho (Thùng)
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Đơn giá
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
                        const tk = item.TongTonKho || 0;
                        const isLow = tk < 200; // MOQ is 200kg
                        const pct = Math.min((tk / 1000) * 100, 100); // 1000 is arbitrary healthy stock
                        const isExpanded = expandedRows.has(item._id);

                        return (
                          <React.Fragment key={item._id}>
                            <tr
                              className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                              onClick={() => toggleRow(item._id)}
                            >
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-600">
                                  {item.MaSanPham}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  <span className={`text-[9px] text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                                    ▶
                                  </span>
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
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-md overflow-hidden shadow-inner max-w-[80px]">
                                    <div
                                      className={`h-full rounded-md transition-all duration-1000 shadow-sm ${
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
                                    className={`font-semibold tabular-nums ${isLow ? "text-rose-600" : "text-emerald-600"}`}
                                  >
                                    {tk.toLocaleString("vi-VN")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-slate-700">
                                {item.DonGiaCoSo.toLocaleString("vi-VN")}{" "}
                                <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                                  đ
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/20">
                                <td colSpan={5} className="px-8 py-4 border-b border-slate-100">
                                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                      Chi tiết số lượng tồn kho từng màu (SKU)
                                    </h4>
                                    {item.DanhSachMaMau && item.DanhSachMaMau.length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {item.DanhSachMaMau.map((mau, mIdx) => (
                                          <div
                                            key={mIdx}
                                            className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/40 rounded-xl hover:border-blue-200 hover:bg-slate-50 transition-colors"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <span
                                                className="w-4 h-4 rounded-full border border-slate-200 shrink-0"
                                                style={{ backgroundColor: mau.HexCode || "#cccccc" }}
                                              />
                                              <div className="text-left min-w-0">
                                                <p className="text-[12px] font-bold text-slate-800 truncate leading-none">
                                                  {mau.TenMau}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                                  {mau.MaMau}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                              <span className="text-xs font-bold text-slate-800">
                                                {mau.TonKhoKhaDung || 0}
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-medium ml-0.5">thùng</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">
                                        Chưa có thông tin màu sắc nào cho dòng sơn này.
                                      </p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  placeholder="Tra cứu nhanh Mã NVL, Tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
                >
                  <Download size={18} /> Xuất báo cáo
                </button>
                <button
                  onClick={openCreateNVL}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-none bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 w-full sm:w-auto"
                >
                  <Plus size={18} /> Khai báo NVL mới
                </button>
              </div>
            </div>

            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-32">
                        Mã NVL
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tên Nguyên Vật Liệu
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Nhà Cung Cấp
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Nhóm Chất
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tồn Kho
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Đơn Giá
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
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
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-purple-50 text-purple-600">
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
                            <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight shadow-sm border bg-slate-50 text-slate-600 border-slate-100">
                              {item.PhanLoai}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-semibold ${(item.TonKho || 0) > 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {(item.TonKho || 0).toLocaleString("vi-VN")}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">
                              {item.DonViTinh}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-700">
                            {item.DonGia.toLocaleString("vi-VN")}{" "}
                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                              đ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditNVL(item)}
                                className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                title="Sửa"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNVL(item._id)}
                                className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 w-full sm:w-auto"
                >
                  <Download size={18} /> Xuất Báo Cáo
                </button>
                <button
                  onClick={openCreateNXModal}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-none bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 w-full sm:w-auto"
                >
                  <ArrowRightLeft size={18} /> Lập Lệnh Nhập / Xuất
                </button>
              </div>
            </div>

            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-32">
                        Mã Lệnh
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Loại Kho
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Loại Lệnh
                      </th>
                      <th className="px-6 py-5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Trạng Thái
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Người Lập
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Mô Tả
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tổng Giá Trị
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Thời Gian
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
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
                          <button
                            onClick={() => setSelectedPhieuNX(item)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Xem chi tiết phiếu"
                          >
                            {item.MaPhieu}
                          </button>
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
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight shadow-sm border ${
                              item.LoaiPhieu === "NHAP"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}
                          >
                            {item.LoaiPhieu === "NHAP"
                              ? "NHẬP KHO"
                              : "XUẤT KHO"}
                          </span>
                        </td>
                        {/* ★ TRẠNG THÁI */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight ${
                              item.TrangThai === "DA_DUYET"
                                ? "bg-green-50 text-green-600"
                                : item.TrangThai === "TU_CHOI"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {item.TrangThai === "DA_DUYET"
                              ? "✅ Đã duyệt"
                              : item.TrangThai === "TU_CHOI"
                                ? "❌ Từ chối"
                                : "⏳ Chờ duyệt"}
                          </span>
                          {item.TrangThai === "TU_CHOI" && item.LyDoTuChoi && (
                            <div
                              className="text-[10px] text-red-400 mt-1 italic"
                              title={item.LyDoTuChoi}
                            >
                              {item.LyDoTuChoi}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-600">
                            {item.TenNguoiLap || "—"}
                          </span>
                          {item.TenNguoiDuyet && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Duyệt: {item.TenNguoiDuyet}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-sm text-slate-500 truncate max-w-[150px] inline-block"
                            title={item.MoTa}
                          >
                            {item.MoTa || "Không có mô tả"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
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
                          <div className="flex justify-end gap-1.5 flex-wrap">
                            {/* Nút DUYỆT + TỪ CHỐI — Chỉ hiện khi CHO_DUYET */}
                            {item.TrangThai === "CHO_DUYET" && (
                              <>
                                <button
                                  onClick={() => handleDuyetPhieu(item._id)}
                                  disabled={processingIds.has(item._id)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                                    processingIds.has(item._id)
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                                  }`}
                                  title="Duyệt phiếu"
                                >
                                  {processingIds.has(item._id)
                                    ? "Đang xử lý..."
                                    : "✓ Duyệt"}
                                </button>
                                <button
                                  onClick={() => handleTuChoiPhieu(item._id)}
                                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                                  title="Từ chối phiếu"
                                >
                                  ✕ Từ chối
                                </button>
                                <button
                                  onClick={() => openEditNXModal(item)}
                                  className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                  title="Sửa"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteNX(item._id)}
                                  className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {item.TrangThai !== "CHO_DUYET" && (
                              <span className="text-[11px] text-slate-300 italic">
                                Đã xử lý
                              </span>
                            )}
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border border-amber-500 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-600 w-full sm:w-auto"
              >
                <FileCheck size={18} /> Tạo Phiếu Kiểm Kê Thực Tế
              </button>
            </div>

            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-40">
                        Mã Phiếu Kiểm
                      </th>
                      <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Người Lập Phiếu
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Tổng Lệch (Giá Trị)
                      </th>
                      <th className="px-6 py-5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Trạng thái
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                        Ngày Lập
                      </th>
                      <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
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
                              className={`font-semibold text-lg ${item.TongChenhLech < 0 ? "text-rose-600" : item.TongChenhLech > 0 ? "text-emerald-600" : "text-slate-400"}`}
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
                            className={`inline-flex items-center px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-tight shadow-sm border ${
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
                            {new Date(item.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedPhieu(item)}
                              className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                              title="Xem chi tiết & In"
                            >
                              <Eye size={14} />
                            </button>
                            {item.TrangThai !== "HOAN_THANH" && (
                              <button
                                onClick={() => hoanThanhPhiếu(item.MaPhieu)}
                                className="inline-flex items-center px-3 h-8 rounded-md bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Beaker size={20} />
                  </div>
                  {editingNVLId ? "CẬP NHẬT NVL" : "KHAI BÁO NVL MỚI"}
                </h2>
                <button
                  onClick={() => setIsNVLModal(false)}
                  className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Mã NVL
                    </label>
                    <input
                      type="text"
                      placeholder="VD: NVL001"
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium disabled:opacity-50"
                      value={nvlForm.MaNVL}
                      onChange={(e) =>
                        setNvlForm({ ...nvlForm, MaNVL: e.target.value })
                      }
                      disabled={!!editingNVLId}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Tên Nguyên Vật Liệu
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên nguyên liệu..."
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={nvlForm.TenNguyenVatLieu}
                      onChange={(e) =>
                        setNvlForm({
                          ...nvlForm,
                          TenNguyenVatLieu: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Phân Loại
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold"
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
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Đơn Vị Tính
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Thùng, Lít..."
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={nvlForm.DonViTinh}
                      onChange={(e) =>
                        setNvlForm({ ...nvlForm, DonViTinh: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Số lượng tồn ban đầu
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold"
                      value={nvlForm.TonKho}
                      onChange={(e) =>
                        setNvlForm({
                          ...nvlForm,
                          TonKho: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Giá Base (₫)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold text-emerald-600"
                      value={nvlForm.DonGia}
                      onChange={(e) =>
                        setNvlForm({
                          ...nvlForm,
                          DonGia: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                    Nhà Cung Cấp
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold"
                    value={nvlForm.NhaCungCap}
                    onChange={(e) =>
                      setNvlForm({ ...nvlForm, NhaCungCap: e.target.value })
                    }
                  >
                    <option value="">-- Chọn nhà cung cấp liên kết --</option>
                    {nccList.map((ncc) => (
                      <option key={ncc._id} value={ncc._id}>
                        {ncc.MaNCC} - {ncc.TenNCC}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsNVLModal(false);
                    setEditingNVLId(null);
                  }}
                  className="px-6 py-3 rounded-md font-bold text-[14px] text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleSubmitNVL}
                  className="px-8 py-3 rounded-md font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  {editingNVLId ? "Cập Nhật Thông Tin" : "Xác Nhận Khai Báo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lập Phiếu Nhập Xuất */}
        {isNXModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
              {/* Header */}
              <div
                className={`px-8 py-6 border-b border-slate-50 flex items-center justify-between ${nxForm.LoaiPhieu === "NHAP" ? "bg-emerald-50/50" : "bg-rose-50/50"}`}
              >
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-md flex items-center justify-center shadow-sm ${nxForm.LoaiPhieu === "NHAP" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                  >
                    {nxForm.LoaiPhieu === "NHAP" ? (
                      <ArrowDownToLine size={20} />
                    ) : (
                      <ArrowUpToLine size={20} />
                    )}
                  </div>
                  {editingNXId
                    ? `CHỈNH SỬA PHIẾU ${nxForm.MaPhieu}`
                    : "LẬP LỆNH KHO MỚI"}
                </h2>
                <button
                  onClick={() => {
                    setIsNXModal(false);
                    setEditingNXId(null);
                  }}
                  className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Mục Đích Lệnh
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold appearance-none disabled:opacity-50"
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
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Đối Tượng Lệnh
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold appearance-none disabled:opacity-50"
                      value={nxForm.LoaiHang}
                      onChange={(e) =>
                        setNxForm({ ...nxForm, LoaiHang: e.target.value })
                      }
                      disabled={!!editingNXId}
                    >
                      <option value="SAN_PHAM">Thành Phẩm Sơn</option>
                      <option value="NGUYEN_VAT_LIEU">Nguyên Vật Liệu</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                      Nhà Cung Cấp (Nếu có)
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold appearance-none"
                      value={nxForm.NhaCungCapID}
                      onChange={(e) =>
                        setNxForm({ ...nxForm, NhaCungCapID: e.target.value })
                      }
                    >
                      <option value="">-- Không chỉ định --</option>
                      {nccList.map((ncc) => (
                        <option key={ncc._id} value={ncc._id}>
                          {ncc.MaNCC} - {ncc.TenNCC}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">
                    Mô tả / Ghi chú lệnh
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập lý do nhập xuất hoặc mô tả chi tiết..."
                    className="w-full bg-slate-50 border-none rounded-lg px-5 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                    value={nxForm.MoTa}
                    onChange={(e) =>
                      setNxForm({ ...nxForm, MoTa: e.target.value })
                    }
                  />
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[15px] font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Box size={18} className="text-blue-500" />
                      Danh sách Hàng Hóa Chỉ Định
                    </h3>
                    {!editingNXId && (
                      <button
                        onClick={handleAddNXItem}
                        className="text-[13px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Thêm dòng
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {nxItems.map((k: any, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-lg bg-slate-50/50 border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in slide-in-from-right-2 duration-300"
                      >
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                            {nxForm.LoaiHang === "SAN_PHAM"
                              ? "Sản Phẩm"
                              : "Nguyên Vật Liệu"}
                          </label>
                          <select
                            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-500 transition-all font-bold disabled:opacity-50"
                            value={k.ItemId}
                            onChange={(e) =>
                              handleNXItemChange(idx, "ItemId", e.target.value)
                            }
                            disabled={!!editingNXId}
                          >
                            <option value="">-- Chọn mặt hàng --</option>
                            {nxForm.LoaiHang === "SAN_PHAM"
                              ? data.map((d) => (
                                  <option key={d._id} value={d._id}>
                                    {d.MaSanPham} - {d.TenDongSon} (
                                    {d.TongTonKho || 0} {d.DonViTinh})
                                  </option>
                                ))
                              : nvlData.map((d) => (
                                  <option key={d._id} value={d._id}>
                                    {d.MaNVL} - {d.TenNguyenVatLieu} (
                                    {d.TonKho || 0} {d.DonViTinh})
                                  </option>
                                ))}
                          </select>
                        </div>
                        {nxForm.LoaiHang === "SAN_PHAM" && (
                          <div className="md:col-span-3 space-y-1.5 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                                Mã Màu (SKU)
                              </label>
                              {!editingNXId &&
                                k.ItemId &&
                                nxForm.LoaiPhieu === "NHAP" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddAllColorsNX(idx, k.ItemId)
                                    }
                                    className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded transition-colors hover:bg-emerald-100"
                                    title="Tạo nhanh danh sách nhập cho tất cả các màu của sản phẩm này"
                                  >
                                    + Thêm tất cả
                                  </button>
                                )}
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!k.ItemId || !!editingNXId) return;
                                  setOpenColorDropdownIdx(
                                    openColorDropdownIdx === idx ? null : idx,
                                  );
                                }}
                                className={`w-full bg-white border border-slate-200 rounded-md pl-9 pr-6 py-2.5 text-[13px] text-slate-800 text-left outline-none focus:border-blue-500 transition-all font-bold ${!k.ItemId || !!editingNXId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <span className="truncate block">
                                  {k.MaMau
                                    ? `${k.MaMau} - ${k.TenMau}`
                                    : "-- Chọn màu --"}
                                </span>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <span className="text-[10px]">▼</span>
                                </div>
                              </button>

                              {(() => {
                                const sp = data.find((d) => d._id === k.ItemId);
                                const m = sp?.DanhSachMaMau?.find(
                                  (m: any) => m.MaMau === k.MaMau,
                                );
                                const matchColor = paintColors.find(
                                  (c) => c.code === k.MaMau,
                                );
                                const hex =
                                  matchColor?.hex || m?.HexCode || "#cbd5e1";

                                if (m?.HinhAnh) {
                                  return (
                                    <img
                                      src={resolveImageUrl(m.HinhAnh)}
                                      alt={k.MaMau}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md object-cover border border-slate-200 shadow-sm pointer-events-none"
                                    />
                                  );
                                }
                                return (
                                  <div
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md border border-slate-200 shadow-sm pointer-events-none"
                                    style={{ backgroundColor: hex }}
                                  />
                                );
                              })()}

                              {openColorDropdownIdx === idx && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() =>
                                      setOpenColorDropdownIdx(null)
                                    }
                                  />
                                  <div className="absolute z-50 top-full left-0 mt-1 min-w-[450px] w-max max-w-[90vw] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-2xl p-1 custom-scrollbar">
                                    {k.ItemId &&
                                      paintColors.map((c, cIdx) => {
                                        const sp = data.find(
                                          (d) => d._id === k.ItemId,
                                        );
                                        const currentSpColor =
                                          sp?.DanhSachMaMau?.find(
                                            (m: any) =>
                                              m.MaMau.toUpperCase() ===
                                              c.code.toUpperCase(),
                                          );
                                        const stock = currentSpColor
                                          ? currentSpColor.TonKhoKhaDung || 0
                                          : 0;

                                        return (
                                          <div
                                            key={cIdx}
                                            onClick={() => {
                                              handleNXItemChange(
                                                idx,
                                                "MaMau",
                                                c.code,
                                              );
                                              setOpenColorDropdownIdx(null);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors"
                                          >
                                            {currentSpColor?.HinhAnh ? (
                                              <img
                                                src={resolveImageUrl(
                                                  currentSpColor.HinhAnh,
                                                )}
                                                className="w-6 h-6 rounded-md object-cover border border-slate-200 shadow-sm shrink-0"
                                              />
                                            ) : (
                                              <div
                                                className="w-5 h-5 rounded-md border border-slate-200 shadow-sm shrink-0"
                                                style={{
                                                  backgroundColor: c.hex,
                                                }}
                                              />
                                            )}
                                            <div className="text-[12px] text-slate-700 truncate">
                                              <span className="font-bold">
                                                {c.code}
                                              </span>{" "}
                                              - {c.name} ({c.category}){" "}
                                              {currentSpColor ? (
                                                <span className="text-emerald-600 font-bold ml-1">
                                                  [Sẵn có: {stock}]
                                                </span>
                                              ) : (
                                                <span className="text-blue-500 font-bold ml-1">
                                                  [Mới]
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <div
                          className={`${nxForm.LoaiHang === "SAN_PHAM" ? "md:col-span-2" : "md:col-span-3"} space-y-1.5`}
                        >
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-[13px] text-slate-800 font-semibold outline-none focus:border-blue-500 transition-all"
                            value={k.SoLuong}
                            onChange={(e) =>
                              handleNXItemChange(
                                idx,
                                "SoLuong",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                            Đơn Giá
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-[13px] text-slate-800 font-bold outline-none focus:border-blue-500 transition-all"
                            value={k.DonGia}
                            onChange={(e) =>
                              handleNXItemChange(
                                idx,
                                "DonGia",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-center">
                          <button
                            onClick={() => {
                              const newItems = [...nxItems];
                              newItems.splice(idx, 1);
                              setNxItems(newItems);
                            }}
                            className="w-10 h-10 rounded-md flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                            disabled={nxItems.length <= 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Tổng giá trị lệnh
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {nxItems
                      .reduce((acc, curr) => acc + (curr.ThanhTien || 0), 0)
                      .toLocaleString("vi-VN")}
                    <span className="text-sm ml-1 text-slate-400 uppercase">
                      đ
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsNXModal(false);
                      setEditingNXId(null);
                    }}
                    className="px-6 py-3 rounded-md font-bold text-[14px] text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    onClick={handleSubmitPhieuNX}
                    className={`px-8 py-3 rounded-md font-bold text-[14px] text-white shadow-lg transition-all active:scale-95 ${nxForm.LoaiPhieu === "NHAP" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"}`}
                  >
                    {editingNXId
                      ? "CẬP NHẬT LỆNH"
                      : `XÁC NHẬN ${nxForm.LoaiPhieu === "NHAP" ? "NHẬP KHO" : "XUẤT KHO"}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lập Phiếu Kiem Ke (Giữ nguyên cấu trúc đã có) */}
        {isKiemKhoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-50 bg-amber-50/50 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                    <FileCheck size={20} />
                  </div>
                  KIỂM KÊ KHO THỰC TẾ
                </h2>
                <button
                  onClick={() => setIsKiemKhoModal(false)}
                  className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100/50 flex gap-4 items-start mb-4">
                  <div className="w-8 h-8 rounded-md bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="text-[13px] text-amber-800 leading-relaxed font-medium">
                    <strong>Lưu ý:</strong> Việc kiểm kê này sẽ so sánh số lượng
                    thực tế bạn nhập với số tồn hệ thống. Sau khi chốt phiếu, hệ
                    thống sẽ tự động tạo các lệnh điều chỉnh tương ứng.
                  </div>
                </div>

                <div className="space-y-4">
                  {kiemKhoItems.map((k: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-6 rounded-md bg-slate-50 border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-5 items-end animate-in slide-in-from-right-2 duration-300 relative"
                    >
                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter ml-1">
                          Sản Phẩm Thành Phẩm
                        </label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold appearance-none"
                          value={k.Sanpham}
                          onChange={(e) => {
                            const newArr = [...kiemKhoItems];
                            newArr[idx].Sanpham = e.target.value;
                            newArr[idx].MaMau = "";
                            newArr[idx].TenMau = "";
                            setKiemKhoItems(newArr);
                          }}
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {data.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.MaSanPham} - {d.TenDongSon} (
                              {d.TongTonKho || 0} {d.DonViTinh})
                            </option>
                          ))}
                        </select>
                      </div>

                      {k.Sanpham && (
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-semibold text-blue-500 uppercase tracking-tighter ml-1">
                            Mã Màu (SKU)
                          </label>
                          <select
                            className="w-full bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-[14px] text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold appearance-none"
                            value={k.MaMau}
                            onChange={(e) => {
                              const newArr = [...kiemKhoItems];
                              newArr[idx].MaMau = e.target.value;
                              const sp = data.find((d) => d._id === k.Sanpham);
                              const mau = sp?.DanhSachMaMau?.find(
                                (m: any) => m.MaMau === e.target.value,
                              );
                              newArr[idx].TenMau = mau?.TenMau || "";
                              setKiemKhoItems(newArr);
                            }}
                          >
                            <option value="">-- Chọn màu --</option>
                            {(() => {
                              const sp = data.find((d) => d._id === k.Sanpham);
                              return (
                                sp?.DanhSachMaMau?.filter(
                                  (m: any) => m.TrangThai !== false,
                                ).map((m: any, mIdx: number) => (
                                  <option key={mIdx} value={m.MaMau}>
                                    {m.MaMau} ({m.TonKhoKhaDung || 0})
                                  </option>
                                )) || []
                              );
                            })()}
                          </select>
                        </div>
                      )}

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter ml-1">
                          Tồn Thực Tế
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-[14px] text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-center"
                          value={k.TonThucTe}
                          onChange={(e) => {
                            const newArr = [...kiemKhoItems];
                            newArr[idx].TonThucTe = Number(e.target.value);
                            setKiemKhoItems(newArr);
                          }}
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-center">
                        <button
                          onClick={() => {
                            const newArr = [...kiemKhoItems];
                            newArr.splice(idx, 1);
                            setKiemKhoItems(newArr);
                          }}
                          className="w-10 h-10 rounded-md flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
                          disabled={kiemKhoItems.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddKiemKhoItem}
                  className="w-full py-4 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Thêm dòng sản phẩm cần kiểm kê
                </button>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsKiemKhoModal(false)}
                  className="px-6 py-3 rounded-md font-bold text-[14px] text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSubmitKiemKho}
                  className="px-8 py-3 rounded-md font-bold text-[14px] bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
                >
                  Lưu Phiếu & Tính Chênh Lệch
                </button>
              </div>
            </div>
          </div>
        )}

        <PhieuKiemKeModal
          phieu={selectedPhieu}
          onClose={() => setSelectedPhieu(null)}
        />
      </div>
      <PhieuDetailModal
        phieu={selectedPhieuNX}
        onClose={() => setSelectedPhieuNX(null)}
      />
    </>
  );
}
