"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  FileSignature,
  TrendingUp,
  Handshake,
  ShieldCheck,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Building,
  User,
  Mail,
  Phone,
  CreditCard,
  Package,
  Scale,
  ShieldAlert,
  History,
  Printer,
  Download,
  FileText,
  ClipboardList,
  PenTool,
  Globe,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";

interface HopDong {
  _id: string;
  contractId: string;
  title: string;
  customer?: {
    _id: string;
    name: string;
    code: string;
    segment: string;
  } | null;
  value: number;
  status: string;
  createdAt: string;
  // New fields
  partyBAddress?: string;
  partyBTaxCode?: string;
  partyBBankAccount?: string;
  partyBBankName?: string;
  partyBRepresentative?: string;
  partyBPosition?: string;
  articles?: any;
  txHash?: string;
  contractType?: string;
}

const DEFAULT_ARTICLES = {
  article1:
    "Bên B đồng ý mua và Bên A đồng ý bán các sản phẩm sơn Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật của nhà sản xuất AkzoNobel.",
  article2:
    "Bên B đặt hàng qua hệ thống VTSC. Địa điểm giao hàng tại kho Bên B hoặc chân công trình. Thời gian giao hàng trong vòng 24-48h kể từ khi xác nhận đơn hàng.",
  article3:
    "Mọi thông tin trao đổi qua email chính thức hoặc văn bản có ký đóng dấu.",
  article4:
    "Khi nhận hàng, hai bên thực hiện kiểm đếm và ký biên bản giao nhận. Mọi khiếu nại về số lượng phải được báo ngay lúc nhận hàng.",
  article5:
    "Phương thức thanh toán chuyển khoán. Khách hàng thực hiện thanh toán theo đợt hoặc theo hạn mức tín dụng đã thỏa thuận.",
  article6:
    "Bên A có nghĩa vụ cung cấp hàng đúng chủng loại. Bên B có nghĩa vụ thanh toán đúng hạn và bảo quản hàng hóa đúng quy trình kỹ thuật.",
  article7:
    "Sản phẩm được bảo hành theo chính sách của AkzoNobel. Các lỗi do thi công sai quy trình sẽ không được bảo hành.",
  article8:
    "Các trường hợp thiên tai, hỏa hoạn, dịch bệnh được coi là bất khả kháng.",
  article9:
    "Bên vi phạm sẽ chịu mức phạt 8% giá trị phần hợp đồng bị vi phạm và bồi thường thiệt hại phát sinh.",
  article10:
    "Mọi tranh chấp sẽ được ưu tiên giải quyết qua thương lượng. Trường hợp không thành sẽ đưa ra Tòa án kinh tế có thẩm quyền.",
  article11:
    "Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau.",
};

export default function ContractsPage() {
  const { user } = useAuthStore();
  const isAdminOrEmployee = user?.role === "Admin" || user?.role === "NhanVien";

  const [data, setData] = useState<HopDong[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Modal & Wizard States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [typeFilter, setTypeFilter] = useState("mua-ban");

  const [formData, setFormData] = useState<any>({
    contractId: "",
    title: "Hợp đồng nguyên tắc mua bán sơn VTSC-KSM",
    customer: "",
    partyBAddress: "",
    partyBTaxCode: "",
    partyBBankAccount: "",
    partyBBankName: "",
    partyBRepresentative: "",
    partyBPosition: "",
    chiTietHopDong: [],
    articles: { ...DEFAULT_ARTICLES },
  });

  const [newItem, setNewItem] = useState({
    productCode: "",
    productName: "",
    colorCode: "",
    quantity: 0,
    unitPrice: 0,
    technicalReqs: "",
  });

  useEffect(() => {
    fetchData();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/contracts");
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/khach-hang");
      if (res.data.success) setCustomers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/san-pham-son?limit=1000");
      if (res.data.success) setProducts(res.data.data);
    } catch (error) {
      console.error("Lỗi tải danh mục sản phẩm sơn:", error);
    }
  };

  const openForm = () => {
    setFormData({
      contractId:
        "VTSC-KSM-" +
        new Date().getFullYear() +
        "-" +
        Math.floor(Math.random() * 9000 + 1000),
      title: typeFilter === "mua-ban" ? "Hợp đồng nguyên tắc mua bán sơn VTSC-KSM" : "Hợp đồng pha chế sơn VTSC-KSM",
      customer: "",
      partyBAddress: "",
      partyBTaxCode: "",
      partyBBankAccount: "",
      partyBBankName: "",
      partyBRepresentative: "",
      partyBPosition: "",
      chiTietHopDong: [],
      articles: { ...DEFAULT_ARTICLES },
      contractType: typeFilter,
    });
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find((c) => c._id === customerId);
    if (cust) {
      setFormData({
        ...formData,
        customer: customerId,
        partyBAddress: cust.DiaChi || "",
        partyBTaxCode: cust.MaSoThue || "",
        partyBRepresentative: cust.NguoiDaiDien || "",
      });
    }
  };

  const viewContract = (item: any) => {
    setFormData({
      _id: item._id, // Save Mongo ID for updating
      contractId: item.contractId || item.MaHopDong,
      title: item.title,
      customer: item.customer?._id || item.CustomerID?._id || item.CustomerID,
      partyBAddress: item.partyBAddress || "",
      partyBTaxCode: item.partyBTaxCode || "",
      partyBBankAccount: item.partyBBankAccount || "",
      partyBBankName: item.partyBBankName || "",
      partyBRepresentative: item.partyBRepresentative || "",
      partyBPosition: item.partyBPosition || "",
      chiTietHopDong: item.ChiTietHopDong || item.chiTietHopDong || [],
      articles: { ...DEFAULT_ARTICLES, ...(item.articles || {}) },
      status: item.status, // Keep track of status to conditionally render approve button
      txHash: item.txHash || "",
      contractType: item.contractType || "mua-ban",
    });
    setCurrentStep(4);
    setIsModalOpen(true);
  };

  const handlePrint = async () => {
    try {
      setIsExportingPDF(true);
      const element = document.getElementById("printable-contract");
      if (!element) return;

      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 15, 10] as [number, number, number, number],
        filename: `HopDong_NguyenTac_${formData.contractId || "VTSC"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] },
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
      alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const addProductItem = () => {
    if (!newItem.productName || newItem.quantity <= 0) return;
    setFormData({
      ...formData,
      chiTietHopDong: [...formData.chiTietHopDong, { ...newItem }],
    });
    setNewItem({
      productCode: "",
      productName: "",
      colorCode: "",
      quantity: 0,
      unitPrice: 0,
      technicalReqs: "",
    });
  };

  const removeProductItem = (index: number) => {
    const updated = [...formData.chiTietHopDong];
    updated.splice(index, 1);
    setFormData({ ...formData, chiTietHopDong: updated });
  };

  const handleProductSelection = (code: string) => {
    const prod = products.find((p) => p.MaSanPham === code);
    if (prod) {
      setNewItem({
        ...newItem,
        productCode: code,
        productName: prod.TenDongSon,
        unitPrice: prod.DonGiaCoSo || 0,
        colorCode: "", // Reset color when product changes
      });
    } else {
      setNewItem({ ...newItem, productCode: code });
    }
  };

  const getAllUniqueColors = () => {
    const allColors: any[] = [];
    const seen = new Set();
    products.forEach((p) => {
      p.DanhSachMaMau?.forEach((c: any) => {
        if (!seen.has(c.MaMau)) {
          seen.add(c.MaMau);
          allColors.push(c);
        }
      });
    });
    return allColors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (formData._id) {
        // Nếu đã có ID, modal này chỉ dùng để In ấn/Xem nhanh chứ không thể lưu/ký ở đây
        setIsModalOpen(false);
      } else {
        // Create new contract (LƯU BẢN NHÁP VÀO MONGODB)
        const res = await api.post("/contracts", formData);
        if (res.data.success) {
          alert("Tạo hợp đồng (Bản nháp) thành công!");
          fetchData();
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Lỗi khi thao tác hợp đồng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelContract = async () => {
    if (!confirm("Bạn có chắc chắn muốn huỷ hợp đồng nháp này không?")) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/contracts/${formData._id}/status`, {
        status: "cancelled",
      });
      if (res.data.success) {
        alert("Đã huỷ hợp đồng thành công!");
        fetchData();
        setIsModalOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Lỗi khi huỷ hợp đồng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter by contractType (default to mua-ban if undefined for old contracts)
      const itemType = item.contractType || "mua-ban";
      if (itemType !== typeFilter) return false;

      const matchSearch =
        (item.customer?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.contractId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && item.status === "signed") ||
        (filter === "pending" && item.status === "draft") ||
        (filter === "done" && item.status === "completed");
      return matchSearch && matchFilter;
    });
  }, [data, searchTerm, filter, typeFilter]);

  const TOTAL_STATS = useMemo(() => {
    const typeFilteredData = data.filter((item) => (item.contractType || "mua-ban") === typeFilter);
    return {
      count: typeFilteredData.length,
      active: typeFilteredData.filter(
        (d) => d.status === "signed" || d.status === "delivering",
      ).length,
      pending: typeFilteredData.filter(
        (d) => d.status === "draft" || d.status === "created",
      ).length,
      value: typeFilteredData.reduce((sum, d) => sum + d.value, 0),
    };
  }, [data, typeFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Background decoration removed as per prism removal request */}

      {/* Contract Type Tabs */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-xl w-full sm:w-auto inline-flex overflow-x-auto no-print">
        {[
          { id: "mua-ban", label: "Hợp đồng nguyên tắc mua bán sơn" },
          { id: "pha-che", label: "Hợp đồng pha chế sơn" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
              typeFilter === t.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileSignature size={64} />
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shadow-sm mb-4">
            <FileSignature size={24} />
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Tổng Hợp Đồng
          </div>
          <div className="text-3xl font-semibold text-slate-800 mt-1">
            {TOTAL_STATS.count}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={64} className="text-emerald-500" />
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm mb-4">
            <ShieldCheck size={24} />
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Đang Hiệu Lực
          </div>
          <div className="text-3xl font-semibold text-slate-800 mt-1">
            {TOTAL_STATS.active}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Handshake size={64} className="text-purple-500" />
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shadow-sm mb-4">
            <Handshake size={24} />
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Chờ Ký Duyệt
          </div>
          <div className="text-3xl font-semibold text-slate-800 mt-1">
            {TOTAL_STATS.pending}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-blue-300" />
          </div>
          <div className="w-12 h-12 bg-white/10 text-blue-300 rounded-lg flex items-center justify-center backdrop-blur-md mb-4">
            <TrendingUp size={24} />
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Giá Trị Đang Vận Hành
          </div>
          <div className="text-3xl font-semibold text-white mt-1">
            {(TOTAL_STATS.value / 1000000).toFixed(0)}
            <span className="text-lg text-slate-400 ml-1">Tr</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden no-print p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-lg px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="Tìm mã HĐ, tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1 rounded-lg w-full sm:w-auto">
              {[
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Đang chạy" },
                { id: "pending", label: "Bản nháp" },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${filter === f.id ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50"
              onClick={fetchData}
            >
              <History size={16} /> Lịch sử
            </button>
            {isAdminOrEmployee && (
              <button
                onClick={openForm}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
              >
                <Plus size={18} /> Soạn Hợp Đồng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 font-semibold text-[11px] text-slate-400 uppercase tracking-widest">
                  Mã Hợp Đồng
                </th>
                <th className="py-4 px-6 font-semibold text-[11px] text-slate-400 uppercase tracking-widest">
                  Khách Hàng / Đối Tác
                </th>
                <th className="py-4 px-6 font-semibold text-[11px] text-slate-400 uppercase tracking-widest">
                  Tổng Giá Trị
                </th>
                <th className="py-4 px-6 font-semibold text-[11px] text-slate-400 uppercase tracking-widest text-center">
                  Trạng Thái
                </th>
                <th className="py-4 px-6 font-semibold text-[11px] text-slate-400 uppercase tracking-widest text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2
                      className="animate-spin text-blue-600 mx-auto mb-4"
                      size={32}
                    />{" "}
                    <p className="text-slate-500 font-medium">
                      Đang tải cơ sở dữ liệu pháp lý...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/50 text-blue-700 font-semibold text-xs border border-blue-100/50">
                        #{item.contractId}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 text-[15px]">
                        {item.customer?.name}
                      </div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                        <History size={12} />{" "}
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-emerald-600 text-[15px]">
                        {item.value.toLocaleString()} ₫
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest ${["signed", "completed"].includes(item.status) ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" : item.status === "delivering" ? "bg-blue-50 text-blue-600 border border-blue-200/50" : "bg-amber-50 text-amber-600 border border-amber-200/50"}`}
                      >
                        {(
                          {
                            draft: "Bản nháp",
                            created: "Chờ ký",
                            signed: "Đã ký",
                            delivering: "Đang giao",
                            completed: "Hoàn thành",
                            cancelled: "Đã hủy",
                          } as Record<string, string>
                        )[item.status] || item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/hop-dong-pha-che/${item._id}`}
                          className="w-9 h-9 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          title="Đến trang xử lý Blockchain"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          className="w-9 h-9 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm"
                          title="In hợp đồng (Bản in thử)"
                          onClick={() => viewContract(item)}
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-slate-500 font-medium"
                  >
                    Không tìm thấy hợp đồng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced 4-Step Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="no-print p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-inner">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                    Soạn Thảo Hợp Đồng Nguyên Tắc Mua Bán Pha Chế Sơn
                  </h3>
                  <div className="text-sm font-bold text-blue-600 mt-0.5">
                    Mã số: {formData.contractId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper Indication */}
            <div className="no-print px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto">
              {[
                { step: 1, label: "Bên B (Người mua)", icon: Building },
                { step: 2, label: "Hàng hóa & Giá", icon: Package },
                { step: 3, label: "11 Điều khoản", icon: ClipboardList },
                { step: 4, label: "Xem trước", icon: Eye },
              ].map((s, idx) => (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 transition-all duration-300 min-w-max ${currentStep >= s.step ? "opacity-100" : "opacity-40 grayscale"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all shadow-sm ${currentStep > s.step ? "bg-blue-600 text-white" : currentStep === s.step ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}
                  >
                    {currentStep > s.step ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`font-bold ${currentStep >= s.step ? "text-slate-800" : "text-slate-500"}`}
                  >
                    {s.label}
                  </span>
                  {idx < 3 && (
                    <div className="w-12 h-[2px] bg-slate-100 mx-2 hidden sm:block"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {/* STEP 1: Parties Info */}
              {currentStep === 1 && (
                <div
                  style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                  }}
                >
                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden"
                    style={{
                      padding: 24,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 16,
                        color: "#2563eb",
                      }}
                    >
                      <Globe size={18} /> Đại diện Bên B (Người Mua)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">
                          Chọn Khách hàng (Đối tác)
                        </label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          style={{ width: "100%", background: "#f1f5f9" }}
                          value={formData.customer}
                          onChange={(e) => handleCustomerSelect(e.target.value)}
                        >
                          <option value="">-- Chọn khách hàng --</option>
                          {customers.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.TenKhachHang} ({c.PhanLoai})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Tên Hợp đồng</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Mã số thuế</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          value={formData.partyBTaxCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBTaxCode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Người đại diện</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          value={formData.partyBRepresentative}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBRepresentative: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Chức vụ</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="VD: Giám đốc"
                          value={formData.partyBPosition}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBPosition: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Địa chỉ trụ sở</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          value={formData.partyBAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBAddress: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden"
                    style={{
                      padding: 24,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 16,
                        color: "#7c3aed",
                      }}
                    >
                      <CreditCard size={18} /> Thông tin Thanh toán & Ví Số
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">
                          Số tài khoản ngân hàng
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="1903..."
                          value={formData.partyBBankAccount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBBankAccount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">Tại ngân hàng</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="Techcombank..."
                          value={formData.partyBBankName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partyBBankName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Products Table */}
              {currentStep === 2 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden"
                    style={{
                      padding: "24px",
                      border: "1px solid rgba(37, 99, 235, 0.08)",
                      background: "rgba(2, 103, 255, 0.05)",
                    }}
                  >
                    <h4
                      style={{
                        marginBottom: "20px",
                        fontWeight: 900,
                        fontSize: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Package size={22} className="text-[#2563eb]" /> THÊM DÒNG
                      HÀNG HÓA (ĐIỀU 1)
                    </h4>

                    {/* Premium Entry Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-5">
                      <div className="input-group-premium md:col-span-3 lg:col-span-2">
                        <label className="form-label-mini">Mã sản phẩm</label>
                        <div className="relative">
                          <FileText
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-10 pr-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={newItem.productCode}
                            onChange={(e) =>
                              handleProductSelection(e.target.value)
                            }
                          >
                            <option value="">-- Chọn mã --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p.MaSanPham}>
                                {p.MaSanPham}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="input-group-premium md:col-span-4 lg:col-span-3">
                        <label className="form-label-mini">
                          Tên hàng / Dòng sơn
                        </label>
                        <div className="relative">
                          <Package
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                            placeholder="Tên dòng sơn..."
                            value={newItem.productName}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="input-group-premium md:col-span-3 lg:col-span-2">
                        <label className="form-label-mini">Mã màu phối</label>
                        <div className="relative">
                          <PenTool
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            list="color-suggestions"
                            className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Gõ mã..."
                            value={newItem.colorCode}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                colorCode: e.target.value,
                              })
                            }
                          />
                          <datalist id="color-suggestions">
                            {(newItem.productCode
                              ? products.find(
                                  (p) => p.MaSanPham === newItem.productCode,
                                )?.DanhSachMaMau || []
                              : getAllUniqueColors()
                            ).map((c: any, idx: number) => (
                              <option key={`${c.MaMau}-${idx}`} value={c.MaMau}>
                                {c.TenMau}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="input-group-premium md:col-span-2 lg:col-span-2">
                        <label className="form-label-mini">
                          Số lượng (Thùng)
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="0"
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="input-group-premium md:col-span-6 lg:col-span-2">
                        <label className="form-label-mini">Đơn giá (VNĐ)</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="0"
                          value={newItem.unitPrice}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              unitPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-6 lg:col-span-1">
                        <button
                          onClick={addProductItem}
                          className="w-full h-11 mt-6 inline-flex items-center justify-center gap-2 rounded-md font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 cursor-pointer border-none transition-all shadow-md shadow-blue-600/20"
                        >
                          <Plus size={18} /> THÊM
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: "0 5px" }}>
                      <label className="form-label-mini">
                        Yêu cầu kỹ thuật đi kèm (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        style={{ width: "100%" }}
                        placeholder="VD: Chịu nhiệt cao, bền màu 10 năm..."
                        value={newItem.technicalReqs}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            technicalReqs: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Products Table */}
                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden"
                    style={{ padding: 0, borderRadius: 12, overflow: "hidden" }}
                  >
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr style={{ background: "#ffffff" }}>
                          <th style={{ paddingLeft: 24 }}>Mã SP</th>
                          <th>Tên Hàng Hóa</th>
                          <th>Mã Màu</th>
                          <th>Số Lượng</th>
                          <th>Đơn Giá</th>
                          <th>Thành Tiền</th>
                          <th style={{ textAlign: "right", paddingRight: 24 }}>
                            Xóa
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.chiTietHopDong.map(
                          (item: any, idx: number) => (
                            <tr key={idx} className="hover-row">
                              <td
                                style={{
                                  paddingLeft: 24,
                                  fontWeight: 700,
                                  color: "#2563eb",
                                  fontSize: 13,
                                }}
                              >
                                {item.productCode || "---"}
                              </td>
                              <td>
                                <div style={{ fontWeight: 800, fontSize: 14 }}>
                                  {item.productName}
                                </div>
                                {item.technicalReqs && (
                                  <div style={{ fontSize: 11, opacity: 0.5 }}>
                                    {item.technicalReqs}
                                  </div>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    color: "#7c3aed",
                                  }}
                                >
                                  {item.colorCode}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 700 }}>
                                  {item.quantity}
                                </span>{" "}
                                <span style={{ opacity: 0.5 }}>Thùng</span>
                              </td>
                              <td>{item.unitPrice.toLocaleString()} ₫</td>
                              <td>
                                <span
                                  style={{ fontWeight: 900, color: "#2563eb" }}
                                >
                                  {(
                                    item.quantity * item.unitPrice
                                  ).toLocaleString()}
                                </span>{" "}
                                ₫
                              </td>
                              <td
                                style={{ textAlign: "right", paddingRight: 24 }}
                              >
                                <button
                                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                                  onClick={() => removeProductItem(idx)}
                                >
                                  <X size={16} className="text-rose-500" />
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                        {formData.chiTietHopDong.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                textAlign: "center",
                                opacity: 0.3,
                                padding: 60,
                                fontStyle: "italic",
                              }}
                            >
                              Chưa có sản phẩm nào cho Điều 1. Hãy điền form bên
                              trên.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {formData.chiTietHopDong.length > 0 && (
                        <tfoot>
                          <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                            <td
                              colSpan={5}
                              style={{
                                textAlign: "right",
                                fontWeight: 700,
                                padding: "16px 24px",
                              }}
                            >
                              TỔNG GIÁ TRỊ DỰ KIÊN:
                            </td>
                            <td
                              style={{
                                fontWeight: 900,
                                color: "#059669",
                                fontSize: "1.2rem",
                                padding: "16px 24px",
                              }}
                            >
                              {formData.chiTietHopDong
                                .reduce(
                                  (sum: number, it: any) =>
                                    sum + it.quantity * it.unitPrice,
                                  0,
                                )
                                .toLocaleString()}{" "}
                              ₫
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 3: Legal Articles */}
              {currentStep === 3 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 24,
                    padding: "10px",
                  }}
                >
                  {Object.keys(formData.articles).map((key, index) => {
                    const articleTitles = [
                      "Hàng hóa và chất lượng",
                      "Giao nhận hàng",
                      "Trao đổi thông tin",
                      "Phương thức giao hàng",
                      "Thanh toán",
                      "Quyền và nghĩa vụ",
                      "Bảo hành sản phẩm",
                      "Bất khả kháng",
                      "Phạt vi phạm",
                      "Giải quyết tranh chấp",
                      "Hiệu lực hợp đồng",
                    ];
                    return (
                      <div key={key} className="article-card-premium">
                        <div className="article-header">
                          <div className="article-number">#{index + 1}</div>
                          <div className="article-title">
                            Điều {index + 1}: {articleTitles[index]}
                          </div>
                        </div>
                        <div className="article-content-area">
                          <div
                            style={{
                              fontSize: 11,
                              marginBottom: 8,
                              opacity: 0.5,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Nội dung chi tiết điều khoản:
                          </div>
                          <textarea
                            className="article-textarea"
                            value={formData.articles[key]}
                            onChange={(e) => {
                              const newArticles = {
                                ...formData.articles,
                                [key]: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                articles: newArticles,
                              });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 4: Final Preview */}
              {currentStep === 4 && (
                <div style={{ maxWidth: "850px", margin: "0 auto" }}>
                  {/* On-chain Proof Card */}
                  {(["signed", "delivering", "completed"].includes(
                    formData.status,
                  ) ||
                    formData.txHash) && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-5 shadow-sm relative overflow-hidden mb-8 no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldCheck size={100} />
                      </div>
                      <div className="flex gap-4 relative z-10">
                        <div className="shrink-0">
                          <div className="w-12 h-12 bg-white text-green-600 rounded-md flex items-center justify-center shadow-sm border border-green-100">
                            <ShieldCheck size={24} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[17px] font-semibold text-green-800 tracking-tight">
                            Xác thực Pháp lý trên Blockchain thành công
                          </h4>
                          <p className="text-sm text-gray-600 font-medium mt-1 mb-5 leading-relaxed">
                            Văn bản hợp đồng đã được băm SHA-256 và đóng dấu bất
                            biến lên mạng lưới Ethereum Sepolia Testnet.
                          </p>

                          <div className="bg-white/80 border border-green-100 rounded-lg p-3 mb-5 shadow-sm">
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                              Mã giao dịch (TxHash):
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="font-mono text-sm font-bold text-gray-800 truncate"
                                title={formData.txHash || ""}
                              >
                                {(formData.txHash || "").substring(0, 10)}...
                                {(formData.txHash || "").substring(
                                  (formData.txHash || "").length - 8,
                                )}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    formData.txHash || "",
                                  );
                                  alert("Đã copy mã TxHash!");
                                }}
                                className="w-8 h-8 rounded-md bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
                                title="Copy TxHash"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>

                          <a
                            href={`https://sepolia.etherscan.io/tx/${formData.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-sm transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30"
                          >
                            Kiểm tra sổ cái Etherscan <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    id="printable-contract"
                    style={{
                      background: "#fff",
                      color: "#000",
                      padding: "50px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                      minHeight: "1000px",
                      fontSize: "13px",
                      lineHeight: "1.4",
                      position: "relative",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: 13,
                          color: "#333",
                        }}
                      >
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: 13 }}>
                        Độc lập — Tự do — Hạnh phúc
                      </div>
                      <div style={{ marginTop: 5, fontSize: 11 }}>
                        --- o0o ---
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: 30 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 20,
                          color: "#003399",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN
                      </div>
                      <div
                        style={{
                          fontStyle: "italic",
                          color: "#666",
                          marginTop: 5,
                        }}
                      >
                        Mã số (Smart Contract ID): {formData.contractId}
                      </div>
                    </div>

                    <p style={{ marginBottom: 20 }}>
                      Hôm nay, ngày {new Date().getDate()} tháng{" "}
                      {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                      , chúng tôi gồm có:
                    </p>

                    {/* BÊN A */}
                    <div style={{ marginBottom: 25 }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#003399",
                          fontSize: 15,
                          borderBottom: "1px solid #003399",
                          paddingBottom: 5,
                          marginBottom: 10,
                        }}
                      >
                        BÊN BÁN / BÊN CUNG CẤP (BÊN A)
                      </div>
                      <div style={{ paddingLeft: 10 }}>
                        <div style={{ marginBottom: 4 }}>
                          <b>Tên tổ chức:</b> CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH
                          VỤ VOSCO
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Địa chỉ:</b> Số 215 phố Lạch Tray, Quận Ngô Quyền,
                          TP. Hải Phòng
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Mã số thuế:</b> 0201137068
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Người đại diện:</b> Ông Phí Bình Minh —{" "}
                          <b>Chức vụ:</b> Trưởng phòng kinh doanh sơn
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#444",
                            fontStyle: "italic",
                            marginTop: 3,
                          }}
                        >
                          <b>Ví Blockchain xác thực:</b>{" "}
                          0x0201020304050607080910111213141516171819
                        </div>
                      </div>
                    </div>

                    {/* BÊN B */}
                    <div style={{ marginBottom: 25 }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#003399",
                          fontSize: 15,
                          borderBottom: "1px solid #003399",
                          paddingBottom: 5,
                          marginBottom: 10,
                        }}
                      >
                        BÊN MUA / BÊN NHẬN (BÊN B)
                      </div>
                      <div style={{ paddingLeft: 10 }}>
                        <div style={{ marginBottom: 4 }}>
                          <b>Tên tổ chức:</b>{" "}
                          {formData.customer
                            ? customers.find((c) => c._id === formData.customer)
                                ?.TenKhachHang
                            : "..................................................."}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Địa chỉ:</b>{" "}
                          {formData.partyBAddress ||
                            "......................................................................................"}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Mã số thuế:</b>{" "}
                          {formData.partyBTaxCode ||
                            "................................"}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Người đại diện:</b>{" "}
                          {formData.partyBRepresentative ||
                            "................................"}{" "}
                          — <b>Chức vụ:</b>{" "}
                          {formData.partyBPosition ||
                            "................................"}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <b>Tài khoản:</b>{" "}
                          {formData.partyBBankAccount ||
                            "................................"}{" "}
                          tại{" "}
                          {formData.partyBBankName ||
                            "................................"}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontWeight: "bold", marginBottom: 15 }}>
                      Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với
                      các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên
                      dưới:
                    </p>

                    <div style={{ marginBottom: 20, pageBreakInside: "avoid" }}>
                      <b style={{ color: "#003399" }}>
                        Điều 1: Hàng hóa và giá cả:
                      </b>
                      <p
                        style={{
                          margin: "8px 0",
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {formData.articles.article1 ||
                          "Bên B đồng ý mua và Bên A đồng ý bán nội thất interpon Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật."}
                      </p>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginTop: 10,
                          border: "1.5px solid #003399",
                        }}
                      >
                        <thead>
                          <tr style={{ background: "#f8faff" }}>
                            <th
                              style={{
                                border: "1px solid #003399",
                                padding: 8,
                                fontSize: 12,
                              }}
                            >
                              Sản phẩm
                            </th>
                            <th
                              style={{
                                border: "1px solid #003399",
                                padding: 8,
                                fontSize: 12,
                              }}
                            >
                              Mã màu
                            </th>
                            <th
                              style={{
                                border: "1px solid #003399",
                                padding: 8,
                                fontSize: 12,
                              }}
                            >
                              Số lượng
                            </th>
                            <th
                              style={{
                                border: "1px solid #003399",
                                padding: 8,
                                fontSize: 12,
                              }}
                            >
                              Đơn giá
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.chiTietHopDong.map((it: any, i: number) => (
                            <tr key={i}>
                              <td
                                style={{
                                  border: "1px solid #003399",
                                  padding: 8,
                                }}
                              >
                                {it.productCode ? `[${it.productCode}] ` : ""}
                                {it.productName}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #003399",
                                  padding: 8,
                                  textAlign: "center",
                                  fontWeight: "bold",
                                }}
                              >
                                {it.colorCode}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #003399",
                                  padding: 8,
                                  textAlign: "right",
                                }}
                              >
                                {it.quantity}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #003399",
                                  padding: 8,
                                  textAlign: "right",
                                }}
                              >
                                {it.unitPrice.toLocaleString()} ₫
                              </td>
                            </tr>
                          ))}
                          {formData.chiTietHopDong.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                style={{
                                  border: "1px solid #003399",
                                  padding: 10,
                                  textAlign: "center",
                                  opacity: 0.5,
                                }}
                              >
                                Chưa có danh mục hàng hóa
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                      <div
                        key={num}
                        className="article-wrapper"
                        style={{ marginBottom: 15, pageBreakInside: "avoid" }}
                      >
                        <b style={{ color: "#003399" }}>Điều {num}:</b>
                        <p
                          style={{
                            marginTop: 5,
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {formData.articles[`article${num}`]}
                        </p>
                      </div>
                    ))}

                    <div
                      className="signature-section"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 60,
                        textAlign: "center",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <div style={{ width: "45%" }}>
                        <b style={{ color: "#003399" }}>ĐẠI DIỆN BÊN A</b>
                        <div style={{ fontSize: 10, color: "#666" }}>
                          (Đã xác thực chữ ký điện tử)
                        </div>
                        <div style={{ height: 80 }}></div>
                        <div style={{ color: "#003399", fontWeight: 900 }}>
                          Phí Bình Minh
                        </div>
                      </div>
                      <div style={{ width: "45%" }}>
                        <b style={{ color: "#003399" }}>ĐẠI DIỆN BÊN B</b>
                        <div style={{ fontSize: 10, color: "#666" }}>
                          (Đã xác thực chữ ký điện tử)
                        </div>
                        <div style={{ height: 80 }}></div>
                        <div style={{ color: "#003399", fontWeight: 900 }}>
                          {formData.partyBRepresentative ||
                            "................................"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 40,
                        textAlign: "center",
                        borderTop: "1px solid #eee",
                        paddingTop: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#999",
                          fontStyle: "italic",
                        }}
                      >
                        Hợp đồng này được khởi tạo và bảo đảm bảo tính bất biến
                        bởi hệ thống VTSC Blockchain.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div
              className="no-print"
              style={{
                padding: "24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                <ChevronLeft size={20} /> Quay lại
              </button>

              <div style={{ display: "flex", gap: 12 }}>
                {currentStep === 4 && (
                  <button
                    disabled={isExportingPDF}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    onClick={handlePrint}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {isExportingPDF ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Download size={18} />
                    )}
                    {isExportingPDF ? "ĐANG XUẤT..." : "XUẤT PDF"}
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                  >
                    Tiếp theo <ChevronRight size={20} />
                  </button>
                ) : (
                  <>
                    {formData._id && formData.status === "draft" && (
                      <button
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm"
                        disabled={isSubmitting}
                        onClick={handleCancelContract}
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <X size={20} />
                        )}{" "}
                        HUỶ HỢP ĐỒNG
                      </button>
                    )}
                    {!formData._id && (
                      <button
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                        disabled={isSubmitting}
                        style={{ background: "#059669", border: "none" }}
                        onClick={handleSubmit}
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ShieldCheck size={20} />
                        )}{" "}
                        LƯU TẠO BẢN NHÁP
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #475569;
        }
        .form-label-mini {
          display: block;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 6px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .form-input-premium {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px 10px 32px;
          color: #0f172a;
          width: 100%;
          outline: none;
          transition: all 0.3s;
        }
        .form-input-premium:focus {
          border-color: #2563eb;
          background: rgba(0, 212, 255, 0.05);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
        }
        .btn-add-row {
          height: 44px;
          background: linear-gradient(135deg, #2563eb, #0066cc);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 20px;
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-add-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
        }

        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print,
          .btn,
          .search-box,
          nav,
          aside,
          header,
          .topbar,
          .sidebar {
            display: none !important;
          }

          /* Force all containers to be visible and expandable */
          html,
          body,
          #__next,
          main,
          div[style*="position: fixed"],
          .glass-card,
          div[style*="flex: 1"] {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #printable-contract {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 210mm !important; /* Force A4 width */
            margin: 0 auto !important;
            padding: 30px !important; /* Reduced internal padding for wider text */
            background: white !important;
            color: black !important;
            visibility: visible !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
          }

          #printable-contract * {
            visibility: visible !important;
          }

          /* Page break optimization */
          tr {
            page-break-inside: avoid;
          }
          .article-wrapper {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .signature-section {
            page-break-inside: avoid;
            margin-top: 50px;
          }
        }

        .article-card-premium {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .article-card-premium:hover {
          border-color: rgba(37, 99, 235, 0.08);
          background: rgba(2, 103, 255, 0.03);
        }
        .article-header {
          padding: 16px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .article-number {
          background: #2563eb;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
        }
        .article-title {
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
        }
        .article-content-area {
          padding: 16px;
        }
        .article-textarea {
          width: 100%;
          min-height: 100px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #0f172a;
          padding: 12px;
          font-size: 13px;
          line-height: 1.6;
          resize: none;
          outline: none;
          transition: border-color 0.3s;
        }
        .article-textarea:focus {
          border-color: #2563eb;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
