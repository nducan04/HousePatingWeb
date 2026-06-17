"use client";

import React, { useState, useEffect } from "react";
import { Search, Wallet, RotateCcw, AlertCircle, ArrowLeft, Ticket, PackageOpen, Copy } from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import toast from "react-hot-toast";

interface Voucher {
  _id: string;
  MaVoucher: string;
  GhiChu: string;
  LoaiGiamGia: string;
  MucGiam: number;
  SoLuongToiDa: number;
  SoLuongDaDung: number;
  TrangThai: string;
}

export default function CustomerVouchersPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Voucher[]>([]);
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/promotions");
      let allVouchers: Voucher[] = [];

      if (res.data?.success) {
        allVouchers = (res.data.data || []).map((k: any) => {
          let status = "DANG_DIEN_RA";
          if (k.TrangThai === 'Đã kết thúc' || new Date(k.NgayKetThuc) < new Date()) {
            status = "DA_KET_THUC";
          }
          
          return {
            _id: k._id,
            MaVoucher: k.MaKhuyenMai,
            GhiChu: k.TenChuongTrinh,
            LoaiGiamGia: "PHAN_TRAM",
            MucGiam: k.PhanTramGiam,
            SoLuongToiDa: 9999, // Không có giới hạn cứng trong model
            SoLuongDaDung: k.DanhSachApDung ? k.DanhSachApDung.length : 0,
            TrangThai: status,
          };
        });
      }

      // Add gifted vouchers from user profile
      if (user?.profile?.Vouchers && Array.isArray(user.profile.Vouchers)) {
        const giftedVouchers = user.profile.Vouchers.map((v: any) => {
           let status = "DANG_DIEN_RA";
           if (v.IsUsed) status = "DA_DUNG";
           else if (new Date(v.ExpirationDate) < new Date()) status = "DA_KET_THUC";

           return {
             _id: v._id || Math.random().toString(),
             MaVoucher: v.VoucherCode,
             GhiChu: v.Description || "Voucher tặng riêng",
             LoaiGiamGia: v.DiscountPercent > 0 ? "PHAN_TRAM" : "TIEN_MAT",
             MucGiam: v.DiscountPercent > 0 ? v.DiscountPercent : v.DiscountAmount,
             SoLuongToiDa: 1,
             SoLuongDaDung: v.IsUsed ? 1 : 0,
             TrangThai: status,
           };
        });
        allVouchers = [...giftedVouchers, ...allVouchers];
      }

      setData(allVouchers);
    } catch (error) {
      console.error("Lỗi tải voucher:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    let filtered = data;
    if (activeTab === "available") {
      filtered = filtered.filter(v => v.TrangThai === 'DANG_DIEN_RA');
    } else if (activeTab === "used") {
      filtered = filtered.filter(v => v.TrangThai === 'DA_DUNG');
    } else if (activeTab === "expired") {
      filtered = filtered.filter(v => v.TrangThai === 'DA_KET_THUC');
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.MaVoucher.toLowerCase().includes(lowerSearch) ||
          (item.GhiChu && item.GhiChu.toLowerCase().includes(lowerSearch))
      );
    }
    return filtered;
  };

  const filteredData = getFilteredData();

  // Summary counts
  const countAvailable = data.filter((d) => d.TrangThai === "DANG_DIEN_RA").length;
  const countUsed = data.filter((d) => d.TrangThai === "DA_DUNG").length;
  const countExpired = data.filter((d) => d.TrangThai === "DA_KET_THUC").length;

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
            <Wallet size={16} className="text-slate-400" /> Ví của tôi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Quản lý khuyến mại của bạn
          </h1>
          <p className="text-slate-400 text-[15px] max-w-2xl font-medium">
            Xem voucher đang có, voucher đã dùng, voucher hết hạn và chọn mã để dùng khi thanh toán.
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-[60px]">
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-6 sm:p-10">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Ticket size={22} className="text-slate-600" />
                VÍ KHUYẾN MẠI
              </h2>
              <p className="text-slate-500 font-medium mt-1 text-[14px]">
                Quản lý voucher đang có, đã dùng và hết hạn.
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
              <div className="text-[13px] font-bold text-slate-500 mb-1">Đang có</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countAvailable}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-[13px] font-bold text-slate-500 mb-1">Đã dùng</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countUsed}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-[13px] font-bold text-slate-500 mb-1">Hết hạn</div>
              <div className="text-2xl font-black text-[#1e3a8a]">{countExpired}</div>
            </div>
          </div>

          {/* Tabs and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-0 mb-6">
            <div className="flex gap-6">
              {[
                { id: 'available', label: 'Ưu đãi mới' },
                { id: 'used', label: 'Đã dùng' },
                { id: 'expired', label: 'Hết hạn' }
              ].map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 font-bold text-[14px] transition-colors relative ${
                      activeTab === tab.id
                        ? "text-slate-900 border-b-2 border-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-[300px] mb-3 lg:mb-3">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã voucher..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-slate-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Data List */}
          <div className="bg-slate-50/50 rounded-xl p-8 min-h-[300px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RotateCcw className="animate-spin text-slate-400" size={24} />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <PackageOpen size={32} className="text-slate-300" />
                <p className="font-medium text-[14px] text-slate-500">Không có voucher phù hợp</p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 place-items-start content-start">
                {filteredData.map((v, i) => {
                   const isActive = v.TrangThai === 'DANG_DIEN_RA';
                   return (
                   <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 w-full shadow-sm">
                     <div className="flex-1 min-w-0 pl-1 border-l-[3px] border-[#1e3a8a] pl-3">
                       <div className="text-[15px] font-bold text-slate-800 mb-1">
                         {v.MaVoucher}
                       </div>
                       
                       <div className="text-[13px] text-slate-600 mb-2">
                         {v.GhiChu || `Giảm ${v.LoaiGiamGia === 'PHAN_TRAM' ? v.MucGiam + '%' : v.MucGiam.toLocaleString() + 'đ'} cho đơn hàng`}
                       </div>
                       
                       <div className="text-[11px] text-slate-500 font-medium">
                         {isActive ? (
                           <span>Còn lại: {v.SoLuongToiDa - (v.SoLuongDaDung || 0)} lượt</span>
                         ) : (
                           <span>{v.TrangThai === 'DA_DUNG' ? 'Đã sử dụng' : 'Đã hết hạn'}</span>
                         )}
                       </div>
                     </div>
                     
                     {isActive && (
                       <button
                         onClick={() => {
                           navigator.clipboard.writeText(v.MaVoucher);
                           toast.success('Đã sao chép mã: ' + v.MaVoucher);
                         }}
                         className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[12px] font-bold shrink-0 transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                       >
                         <Copy size={12} /> Copy
                       </button>
                     )}
                   </div>
                   );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
