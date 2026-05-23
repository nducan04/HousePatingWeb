'use client';

import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, Package, CheckCircle2, Clock, Truck, MapPin, 
  User, ArrowLeft, LogIn, AlertCircle, Eye, Home
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';

export default function TrackingPage() {
  const { isAuthenticated, user, loginState } = useAuthStore();

  const [trackingCode, setTrackingCode] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<any | null>(null);
  const [dbTrackingList, setDbTrackingList] = useState<any[]>([]);

  // Inline login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const mapDBTrackingToUI = (item: any) => {
    const donHang = item.DonHang || {};
    const khachHang = donHang.KhachHang || {};

    let product = 'Sơn tĩnh điện AkzoNobel';
    let qtyStr = 'N/A';
    if (donHang.Items && donHang.Items.length > 0) {
      product = donHang.Items[0].TenSanPham || product;
      qtyStr = `${donHang.Items[0].SoLuong} Thùng`;
    }

    return {
      code: item.MaVanChuyen || `DEL-${donHang.MaDonHang || 'DH'}`,
      orderCode: donHang.MaDonHang || 'N/A',
      customer: khachHang.TenKhachHang || 'Khách hàng',
      product: product,
      quantity: qtyStr,
      dbRecord: item,
      isRealDB: true,
    };
  };

  const fetchDBTracking = async () => {
    try {
      const res = await api.get('/van-chuyen');
      if (res.data.success) {
        const mapped = res.data.data.map(mapDBTrackingToUI);
        setDbTrackingList(mapped);
      }
    } catch (e) {
      console.error('Error fetching database shipping tracking:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDBTracking();
    }
  }, [isAuthenticated]);

  const filteredTrackingData = useMemo(() => {
    if (!trackingCode.trim()) return dbTrackingList;
    const lower = trackingCode.toLowerCase();
    return dbTrackingList.filter(t => 
      t.code.toLowerCase().includes(lower) || 
      t.orderCode.toLowerCase().includes(lower)
    );
  }, [dbTrackingList, trackingCode]);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const res = await api.post("/auth/login", {
        TenDangNhap: loginUsername,
        MatKhau: loginPassword,
      });
      if (res.data.success) {
        loginState(res.data.user, res.data.accessToken);
        setLoginUsername('');
        setLoginPassword('');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1300px] mx-auto px-4 py-16 animate-in fade-in duration-700">
        <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[32px] shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Package size={26} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Theo dõi Vận Chuyển</h3>
            <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
              Vui lòng đăng nhập tài khoản Khách hàng để theo dõi tiến trình giao nhận hàng.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold mb-6">
              <AlertCircle size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-5 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                placeholder="Nhập tên đăng nhập của bạn..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-5 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/5 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all cursor-pointer border-none mt-6 disabled:opacity-50"
            >
              {isLoggingIn ? <Clock className="animate-spin" size={18} /> : <LogIn size={18} />}
              Đăng Nhập Ngay
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto px-4 py-8 animate-in fade-in duration-700">
      {!selectedTracking ? (
        <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 space-y-8">
          {/* Back to Home */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <Home size={16} />
              Trang Chủ
            </Link>
          </div>

          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100/80 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <Package size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Theo dõi Vận Chuyển</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Quản lý và theo dõi lộ trình các đơn hàng của bạn
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
                placeholder="Tìm mã vận chuyển, mã đơn..."
                value={trackingCode}
                onChange={e => setTrackingCode(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-[24px] border border-slate-100 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã Vận Chuyển</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã Đơn Hàng</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Hàng Hóa</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày Tạo</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTrackingData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400 font-medium italic">
                        Không tìm thấy dữ liệu vận chuyển nào.
                      </td>
                    </tr>
                  ) : filteredTrackingData.map(item => {
                    const isDelivered = item.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công';
                    const isDelivering = item.dbRecord?.TrangThaiTongQuat === 'Đang giao hàng';
                    return (
                      <tr key={item.code} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 text-[14px]">
                          {item.orderCode}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-[14px] font-medium">
                          {item.product} <span className="text-slate-400 mx-1">•</span> <span className="text-amber-600 font-bold">{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                          {new Date(item.dbRecord.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${isDelivered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : isDelivering
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            {item.dbRecord.TrangThaiTongQuat}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedTracking(item)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer shadow-sm group-hover:shadow group-hover:-translate-y-0.5"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DETAIL VIEW */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedTracking(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>

          <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-8">
            <div className="flex justify-between items-start flex-wrap gap-8 mb-10 pb-8 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">Mã đơn hàng</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2 mb-4">
                  {selectedTracking.code}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 mt-4 text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Khách hàng:</span>
                    <strong className="text-slate-900">{selectedTracking.customer}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Sản phẩm:</span>
                    <strong className="text-slate-900">{selectedTracking.product}</strong>
                  </div>
                  <div className="flex items-center gap-2 mt-1 sm:col-span-2">
                    <span className="text-slate-400 font-semibold">Khối lượng:</span>
                    <strong className="text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg text-xs">{selectedTracking.quantity}</strong>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <QRCodeSVG
                  value={`https://vtsc.vn/tracking/${selectedTracking.code}`}
                  size={110}
                  bgColor="#ffffff"
                  fgColor="#0a0e27"
                  level="H"
                />
                <div className="text-center mt-3 text-[10px] text-slate-400 font-mono font-bold">
                  {selectedTracking.code}
                </div>
              </div>
            </div>

            {/* Route Map Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-rose-500" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bản đồ lộ trình giao hàng</span>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent('Số 215 Lạch Tray, Gia Viên, Hải Phòng')}&destination=${encodeURIComponent(selectedTracking.dbRecord?.DonHang?.DiaChiGiaoHang || 'Hải Phòng, Việt Nam')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  Mở Google Maps
                </a>
              </div>

              <div className="relative w-full" style={{ height: 400 }}>
                <iframe
                  title="Delivery Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?saddr=${encodeURIComponent('Số 215 Lạch Tray, Gia Viên, Hải Phòng')}&daddr=${encodeURIComponent(selectedTracking.dbRecord?.DonHang?.DiaChiGiaoHang || 'Hải Phòng, Việt Nam')}&output=embed`}
                />
                <div className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? <CheckCircle2 size={13} /> : <Truck size={13} />}
                  {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'Đã giao thành công' : 'Đang trên đường giao'}
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50">
                <div className="relative">
                  <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 rounded-full"></div>
                  <div
                    className="absolute top-5 left-6 h-1 rounded-full transition-all duration-1000"
                    style={{
                      width: selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'calc(100% - 3rem)' : 'calc(50% - 1.5rem)',
                      background: selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? '#059669' : '#2563eb',
                      boxShadow: `0 0 8px ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? '#05966980' : '#2563eb80'}`
                    }}
                  ></div>

                  <div className="relative flex justify-between">
                    <div className="flex flex-col items-center gap-2 w-20">
                      <div className="w-10 h-10 rounded-2xl bg-white border-2 border-blue-500 flex items-center justify-center shadow-sm z-10">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <span className="text-[11px] font-black text-slate-600 text-center leading-tight">Xưởng Sơn</span>
                    </div>

                    <div
                      className="absolute -top-7 flex flex-col items-center transition-all duration-1000"
                      style={{ left: selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'calc(100% - 5rem)' : 'calc(50% - 2rem)' }}
                    >
                      <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-lg mb-1.5 whitespace-nowrap ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                        {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'Đã bàn giao' : 'Đang di chuyển'}
                      </span>
                      <Truck size={26} style={{ color: selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? '#059669' : '#2563eb', filter: `drop-shadow(0 0 6px ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? '#059669' : '#2563eb'})` }} />
                    </div>

                    <div className="flex flex-col items-center gap-2 w-20">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 shadow-sm z-10 transition-all duration-500 ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}>
                        {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <User size={18} className="text-slate-400" />}
                      </div>
                      <span className={`text-[11px] font-black text-center leading-tight ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {selectedTracking.customer || 'Khách hàng'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-start gap-2 text-xs text-slate-500">
                  <MapPin size={13} className="text-rose-400 mt-0.5 shrink-0" />
                  <span className="font-medium">{selectedTracking.dbRecord?.DonHang?.DiaChiGiaoHang || 'Chưa cập nhật địa chỉ giao hàng'}</span>
                </div>
              </div>
            </div>

            {/* Chi tiết lô hàng & Thông tin vận chuyển */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Cargo Details */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">Chi tiết lô hàng</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Số kiện</span>
                    <span className="font-bold text-slate-900">
                      {selectedTracking.dbRecord?.LoHang?.SoKien ?? 'N/A'} kiện (Đã đóng gói)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Khối lượng</span>
                    <span className="font-bold text-slate-900">
                      {selectedTracking.dbRecord?.LoHang?.KhoiLuong ?? 'N/A'} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Màu sơn</span>
                    <span className="font-bold text-blue-600">
                      {selectedTracking.dbRecord?.LoHang?.MauSon || 'N/A'}{selectedTracking.dbRecord?.LoHang?.MauSon ? ' (Kiểm tra OK)' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Biên bản bàn giao</span>
                    <div>
                      {selectedTracking.dbRecord?.LoHang?.BienBanFile ? (
                        <a
                          href={selectedTracking.dbRecord.LoHang.BienBanFile}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                        >
                          📄 Xem File
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">Thông tin vận chuyển</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Đơn vị</span>
                    <span className="font-bold text-slate-900">
                      {selectedTracking.dbRecord?.VanChuyenInfo?.DonVi || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Tài xế</span>
                    <span className="font-bold text-slate-900">
                      {selectedTracking.dbRecord?.VanChuyenInfo?.NhanVien?.HoTen || 'Chưa phân công'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">SĐT tài xế</span>
                    <span className="font-bold text-amber-600">
                      {selectedTracking.dbRecord?.VanChuyenInfo?.NhanVien?.SDT || selectedTracking.dbRecord?.VanChuyenInfo?.SDT || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Phí vận chuyển</span>
                    <span className="font-black text-emerald-600">
                      {selectedTracking.dbRecord?.VanChuyenInfo?.PhiVC
                        ? `${Number(selectedTracking.dbRecord.VanChuyenInfo.PhiVC).toLocaleString('vi-VN')}đ`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Lịch sử lộ trình</h4>
              <div className="relative space-y-8">
                <div className="absolute left-[88px] top-1 bottom-1 w-px bg-slate-100"></div>
                {selectedTracking.dbRecord?.LoTrinh?.length > 0 ? (
                  selectedTracking.dbRecord.LoTrinh.map((log: any, idx: number) => {
                    const isComplete = log.Status === "COMPLETE";
                    const isProcessing = log.Status === "PROCESSING";
                    return (
                      <div key={idx} className="flex items-start gap-8 relative">
                        <div className={`w-[72px] text-right shrink-0 pt-0.5 ${isComplete ? 'text-slate-900' : 'text-slate-300'}`}>
                          <div className="text-sm font-bold">
                            {log.ThoiGian ? new Date(log.ThoiGian).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {log.ThoiGian ? new Date(log.ThoiGian).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                          </div>
                        </div>
                        <div className="relative z-10 bg-white pt-0.5">
                          {isComplete
                            ? <CheckCircle2 size={18} className="text-emerald-500" />
                            : isProcessing
                              ? <div className="w-[18px] h-[18px] rounded-full bg-blue-600 border-4 border-blue-100"></div>
                              : <div className="w-[18px] h-[18px] rounded-full bg-slate-200"></div>}
                        </div>
                        <p className={`text-sm pt-0.5 ${(isComplete || isProcessing) ? 'font-semibold text-slate-900' : 'text-slate-300'}`}>
                          {log.NoiDung}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-400 text-sm font-medium italic py-2 pl-[104px]">
                    Chưa có nhật ký lộ trình nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
