"use client";

import React, { useState, useEffect } from "react";
import { Search, Shield, RotateCcw, AlertCircle, ArrowLeft, X, ClipboardList, Wrench, RefreshCw } from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";

interface UnifiedRequest {
  _id: string;
  type: "BAO_HANH" | "DOI_TRA";
  code: string;
  productOrOrder: string;
  issueDescription: string;
  status: string;
  createdAt: string;
  expiryDate?: string;
  GhiChuKyThuat?: string;
  PhuongAnGiaiQuyet?: string;
  returnType?: string; // For DoiTra (LoaiYeuCau)
  images?: string[]; // Array of IPFS image links
}

export default function CustomerWarrantiesPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<UnifiedRequest[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [resBaoHanh, resDoiTra] = await Promise.allSettled([
        api.get("/warranties"),
        api.get("/doi-tra")
      ]);
      
      let combinedData: UnifiedRequest[] = [];

      if (resBaoHanh.status === "fulfilled" && resBaoHanh.value.data?.success) {
        const bhData = resBaoHanh.value.data.data.map((item: any) => ({
          _id: item._id,
          type: "BAO_HANH" as const,
          code: item.MaBaoHanh,
          productOrOrder: item.SanPham,
          issueDescription: item.NoiDungLoi,
          status: item.TrangThai,
          createdAt: item.createdAt,
          expiryDate: item.HanBaoHanh,
          GhiChuKyThuat: item.GhiChuKyThuat,
          PhuongAnGiaiQuyet: item.PhuongAnGiaiQuyet,
          images: item.HinhAnh || [],
        }));
        combinedData = [...combinedData, ...bhData];
      }

      if (resDoiTra.status === "fulfilled" && resDoiTra.value.data?.success) {
        const dtData = resDoiTra.value.data.data.map((item: any) => ({
          _id: item._id,
          type: "DOI_TRA" as const,
          code: item.MaDoiTra,
          productOrOrder: item.DonHang ? `Đơn hàng: ${item.DonHang.MaDonHang || item.DonHang}` : "Không rõ đơn hàng",
          issueDescription: item.LyDo,
          status: item.TrangThai,
          createdAt: item.createdAt,
          PhuongAnGiaiQuyet: item.PhuongAnGiaiQuyet,
          returnType: item.LoaiYeuCau,
          images: item.HinhAnh || [],
        }));
        combinedData = [...combinedData, ...dtData];
      }
      
      // Sort by newest
      combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setData(combinedData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "active", label: "Còn hiệu lực", statuses: ["Mở", "Yêu cầu mới"] },
    { id: "processing", label: "Đang xử lý", statuses: ["Đang khảo sát", "Đang xử lý"] },
    { id: "completed", label: "Hoàn tất", statuses: ["Đã khắc phục", "Đã hoàn tiền"] },
    { id: "rejected", label: "Từ chối", statuses: ["Từ chối", "Bị từ chối"] },
    { id: "expired", label: "Hết hạn", statuses: ["Hết hạn BH"] },
  ];

  const baseData = filterType === "ALL" ? data : data.filter((d) => d.type === filterType);

  const getFilteredData = () => {
    let filtered = baseData;
    if (activeTab !== "all") {
      const tabConfig = tabs.find((t) => t.id === activeTab);
      if (tabConfig) {
        filtered = filtered.filter((item) =>
          tabConfig.statuses.includes(item.status)
        );
      }
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.code.toLowerCase().includes(lowerSearch) ||
          item.productOrOrder.toLowerCase().includes(lowerSearch) ||
          item.issueDescription.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  };

  const filteredData = getFilteredData();

  // Summary counts based on filterType
  const countActive = baseData.filter((d) => d.status === "Mở" || d.status === "Yêu cầu mới").length;
  const countProcessing = baseData.filter((d) => d.status === "Đang khảo sát" || d.status === "Đang xử lý").length;
  const countEnded = baseData.filter(
    (d) => d.status === "Đã khắc phục" || d.status === "Đã hoàn tiền" || d.status === "Hết hạn BH" || d.status === "Từ chối" || d.status === "Bị từ chối"
  ).length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sm:px-12 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                VTSC PaintPro
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                Hệ thống Quản lý
              </p>
            </div>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-bold text-[#1e3a8a] hover:text-blue-700 transition-colors no-underline px-4 py-2"
          >
            <ArrowLeft size={16} /> Quay về trang chủ
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#0f172a] py-12 px-6 sm:px-12 rounded-[20px] mb-[-60px] relative z-0 mt-6 max-w-6xl mx-auto mx-4 sm:mx-auto">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-bold mb-3 uppercase tracking-wider">
            <Shield size={16} className="text-slate-400" /> Hỗ trợ khách hàng
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Bảo hành & Đổi trả
          </h1>
          <p className="text-slate-400 text-[15px] max-w-2xl font-medium">
            Xem các yêu cầu bảo hành, đổi trả sản phẩm phát sinh và theo dõi quá trình xử lý từ bộ phận chăm sóc khách hàng.
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-[60px]">
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-6 sm:p-10">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Shield size={22} className="text-slate-600" />
                YÊU CẦU CỦA TÔI
              </h2>
              <p className="text-slate-500 font-medium mt-1 text-[14px]">
                Theo dõi và quản lý toàn bộ yêu cầu bảo hành, đổi trả.
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
            >
              <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Three Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-[13px] font-bold text-slate-500 mb-1">Yêu cầu mới</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countActive}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-[13px] font-bold text-slate-500 mb-1">Đang xử lý</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countProcessing}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-[13px] font-bold text-slate-500 mb-1">Đã kết thúc</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countEnded}</div>
            </div>
          </div>

          {/* Tabs and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-0 mb-6">
            <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
              {tabs.map((tab) => {
                const count = baseData.filter((item) =>
                  tab.statuses.includes(item.status)
                ).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 font-bold text-[14px] transition-colors relative flex-shrink-0 ${
                      activeTab === tab.id
                        ? "text-slate-900 border-b-2 border-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 relative w-full lg:w-auto mb-3 lg:mb-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-[150px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
              >
                <option value="ALL">Tất cả yêu cầu</option>
                <option value="BAO_HANH">Chỉ Bảo hành</option>
                <option value="DOI_TRA">Chỉ Đổi trả</option>
              </select>
              
              <div className="relative w-full sm:w-[250px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm mã đơn hàng, sản phẩm..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-slate-400 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-slate-50/50 rounded-xl p-8 min-h-[300px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RotateCcw className="animate-spin text-slate-400" size={24} />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Shield size={32} className="text-slate-300" />
                <p className="font-medium text-[14px] text-slate-500">Không có phiếu bảo hành phù hợp</p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 place-items-start content-start">
                {filteredData.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedRequest(item)}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 w-full shadow-sm cursor-pointer hover:border-[#1e3a8a] transition-colors group"
                  >
                    <div className="flex-1 min-w-0 pl-1 border-l-[3px] border-[#1e3a8a] pl-3">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           {item.type === "DOI_TRA" ? (
                              <RefreshCw size={14} className="text-[#e11d48]" />
                           ) : (
                              <Shield size={14} className="text-[#1e3a8a]" />
                           )}
                           <div className="text-[15px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                             {item.code}
                           </div>
                         </div>
                         <div
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.status === "Đã khắc phục" || item.status === "Đã hoàn tiền"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : item.status === "Hết hạn BH" || item.status === "Bị từ chối" || item.status === "Từ chối"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}
                          >
                            {item.status}
                          </div>
                      </div>
                      
                      <div className="text-[13px] text-slate-600 font-medium mb-2 line-clamp-1">
                        {item.productOrOrder}
                      </div>
                      
                      <div className="text-[12px] text-slate-500 mt-1 line-clamp-1">
                        <span className="font-semibold text-slate-700">Lý do/Lỗi:</span> {item.issueDescription}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                       <div className="text-[11px] text-slate-400">
                         Tạo: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "---"}
                       </div>
                       <div className="text-[11px] text-[#1e3a8a] font-medium bg-blue-50 px-2 py-1 rounded">
                         Xem chi tiết &rarr;
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Chi Tiết Yêu Cầu */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-[18px] sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  Chi tiết {selectedRequest.type === "DOI_TRA" ? "yêu cầu đổi trả" : "yêu cầu bảo hành"}
                </h3>
                <p className="text-[#1e3a8a] font-black mt-1 text-[14px]">
                  Mã: {selectedRequest.code}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-8 flex flex-col gap-6 sm:gap-8">
              
              {/* Section 1: Thông tin khách hàng gửi */}
              <div className="bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200">
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3 text-[15px]">
                  <ClipboardList size={18} className="text-[#1e3a8a]" /> Nội dung yêu cầu của bạn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[14px]">
                  <div>
                    <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">
                      {selectedRequest.type === "DOI_TRA" ? "Sản phẩm/Đơn hàng" : "Sản phẩm lỗi"}
                    </span>
                    <span className="font-semibold text-slate-800">{selectedRequest.productOrOrder}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">Trạng thái hiện tại</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[12px] font-bold ${
                      selectedRequest.status === "Đã khắc phục" || selectedRequest.status === "Đã hoàn tiền"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : selectedRequest.status === "Hết hạn BH" || selectedRequest.status === "Từ chối" || selectedRequest.status === "Bị từ chối"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">
                      Mô tả lỗi / Lý do
                    </span>
                    <span className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 block mt-1">
                      {selectedRequest.issueDescription}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">Ngày gửi yêu cầu</span>
                    <span className="text-slate-700 font-medium">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : "---"}
                    </span>
                  </div>
                  {selectedRequest.type === "BAO_HANH" && (
                    <div>
                      <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">Thời hạn bảo hành đến</span>
                      <span className="text-slate-700 font-medium text-rose-600">
                        {selectedRequest.expiryDate ? new Date(selectedRequest.expiryDate).toLocaleDateString() : "---"}
                      </span>
                    </div>
                  )}
                  {selectedRequest.type === "DOI_TRA" && selectedRequest.returnType && (
                    <div>
                      <span className="text-slate-500 block mb-1 text-[11px] uppercase font-bold tracking-wider">Loại yêu cầu</span>
                      <span className="text-slate-700 font-medium text-[#1e3a8a]">
                        {selectedRequest.returnType}
                      </span>
                    </div>
                  )}
                  {selectedRequest.images && selectedRequest.images.length > 0 && (
                    <div className="sm:col-span-2 mt-2">
                      <span className="text-slate-500 block mb-2 text-[11px] uppercase font-bold tracking-wider">Hình ảnh đính kèm</span>
                      <div className="flex flex-wrap gap-3">
                        {selectedRequest.images.map((imgUrl, idx) => {
                          const finalUrl = imgUrl.includes('ipfs://') ? imgUrl.replace('ipfs://', 'https://ipfs.io/ipfs/') : (imgUrl.startsWith('Qm') || imgUrl.startsWith('bafy')) ? `https://ipfs.io/ipfs/${imgUrl}` : imgUrl;
                          return (
                          <a 
                            key={idx} 
                            href={finalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                          >
                            <img 
                              src={finalUrl} 
                              alt={`HinhAnh-${idx}`} 
                              className="w-full h-full object-cover" 
                            />
                          </a>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Thông tin xử lý từ Admin/Kỹ thuật */}
              <div className="bg-[#f0f4f8] rounded-xl p-5 sm:p-6 border border-[#dbeafe]">
                <h4 className="flex items-center gap-2 font-bold text-[#1e3a8a] mb-4 border-b border-[#bfdbfe] pb-3 text-[15px]">
                  <Wrench size={18} /> Phản hồi từ Quản trị viên
                </h4>
                
                <div className="flex flex-col gap-5 text-[14px]">
                  {selectedRequest.type === "BAO_HANH" && (
                    <div>
                      <span className="text-[#3b82f6] block mb-2 text-[11px] uppercase font-bold tracking-wider">Ghi chú kiểm tra</span>
                      {selectedRequest.GhiChuKyThuat ? (
                        <div className="text-slate-700 bg-white p-3 rounded-lg border border-[#bfdbfe]">
                          {selectedRequest.GhiChuKyThuat}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">Chưa có thông tin ghi chú từ kỹ thuật viên.</div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <span className="text-[#3b82f6] block mb-2 text-[11px] uppercase font-bold tracking-wider">Phương án giải quyết</span>
                    {selectedRequest.PhuongAnGiaiQuyet ? (
                      <div className="text-slate-800 font-medium bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        {selectedRequest.PhuongAnGiaiQuyet}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Hệ thống đang chờ cập nhật phương án giải quyết.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-5 sm:p-6 border-t border-slate-200 rounded-b-[20px] flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-2 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
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
