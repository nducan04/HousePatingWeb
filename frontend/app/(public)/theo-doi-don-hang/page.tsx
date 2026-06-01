'use client';

import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import {
  Search, Package, CheckCircle2, Clock, Truck, MapPin,
  Beaker, FlaskConical, AlertCircle, Eye, ArrowRight, ArrowLeft,
  ShieldCheck, User, Calendar, Layers, Scale, Lock,
  MessageSquare, Image as ImageIcon, Sparkles, LogIn, ChevronRight, XCircle, Camera, Circle, QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from '@/lib/utils/notification';
import api from '@/lib/utils/axiosAuth';
import RouteMap from '@/app/(admin)/van-chuyen/RouteMap';

export default function TrackingPage() {
  const router = useRouter();
  const { isAuthenticated, user, loginState } = useAuthStore();

  const [trackingCode, setTrackingCode] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<any | null>(null);

  const [loadingRD, setLoadingRD] = useState(false);
  const [sampleRequests, setSampleRequests] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);
  const [sampleSearchTerm, setSampleSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'shipment' | 'samples'>('shipment');

  // Live simulation states
  const [simProgress, setSimProgress] = useState(0.45);
  const [simSpeed, setSimSpeed] = useState(72);
  const [simTemp, setSimTemp] = useState(19.4);
  const [lastPing, setLastPing] = useState(0);


  const [dbTrackingList, setDbTrackingList] = useState<any[]>([]);

  // Inline login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRequestId, setQrRequestId] = useState<string | null>(null);

  const mapDBTrackingToUI = (item: any) => {
    const donHang = item.DonHang || {};
    const khachHang = donHang.KhachHang || {};

    let product = 'Sơn tĩnh điện AkzoNobel';
    let qtyStr = 'N/A';
    let allProducts: any[] = [];
    if (donHang.Items && donHang.Items.length > 0) {
      product = donHang.Items[0].TenSanPham || product;
      qtyStr = `${donHang.Items[0].SoLuong} Thùng`;
      allProducts = donHang.Items;
    }

    const isDelivered = item.TrangThaiTongQuat === 'Giao hàng thành công';

    const realSteps = (item.LoTrinh || []).map((log: any) => ({
      label: log.NoiDung,
      status: log.Status === 'COMPLETE' ? ('completed' as const) : ('current' as const),
      time: log.ThoiGian ? new Date(log.ThoiGian).toLocaleDateString('vi-VN') : ''
    }));

    const steps = realSteps.length > 0 ? realSteps : [
      { label: 'Chờ lấy hàng', status: 'current' as const, time: new Date().toLocaleDateString('vi-VN') }
    ];

    const getReceiverPhone = (ghiChu: string) => {
      if (!ghiChu) return "N/A";
      const match = ghiChu.match(/SĐT nhận:\s*([\d.\s]+)/);
      return match ? match[1].trim() : "";
    };

    return {
      code: item.MaVanChuyen || `DEL-${donHang.MaDonHang || 'DH'}`,
      customer: donHang.TenNguoiNhan || khachHang.TenKhachHang || 'Khách hàng',
      phone: donHang.SDTNguoiNhan || khachHang.SDT || getReceiverPhone(donHang.GhiChu) || 'N/A',
      address: donHang.DiaChiGiaoHang || khachHang.DiaChi || 'Chưa cập nhật',
      product: product,
      quantity: qtyStr,
      allProducts: allProducts,
      steps: steps,
      isRealDB: true,
      dbRecord: item,
    };
  };

  const fetchDBTracking = async () => {
    try {
      const res = await api.get('/shipping');
      if (res.data.success) {
        const mapped = res.data.data.map(mapDBTrackingToUI);
        setDbTrackingList(mapped);

        // Auto-select the first item if no query params exist
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          const orderId = params.get('orderId');
          const tab = params.get('tab');
          if (!code && !orderId && mapped.length > 0 && tab !== 'samples' && tab !== 'rd') {
            setSelectedTracking(mapped[0]);
            setTrackingCode(mapped[0].code);
            setActiveTab('shipment');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching database shipping tracking:', e);
    }
  };

  const fetchSingleTracking = async (code: string) => {
    try {
      const res = await api.get(`/shipping/track/${code}`);
      if (res.data.success && res.data.data) {
        const mapped = mapDBTrackingToUI(res.data.data);
        setSelectedTracking(mapped);
        setTrackingCode(mapped.code);
        setActiveTab('shipment');
        return true;
      }
    } catch (e) {
      console.error('Error fetching single tracking:', e);
    }
    return false;
  };

  const [dbRDList, setDbRDList] = useState<any[]>([]);

  const mapDBRDToUI = (item: any) => {
    const itemCustomer = item.ContractID?.title || 'Khách hàng';
    return {
      id: item.MaNhatKy || item._id,
      customer: itemCustomer,
      colorCode: item.MaMauYeuCau || 'RAL-MIX',
      surface: item.ContractID?.surface || 'Kim loại',
      status: item.TrangThai || 'pending',
      date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
      LichSuPhienBan: item.LichSuPhienBan || [],
      signedBy: item.signedBy,
      signedAt: item.signedAt,
      isRealDB: true
    };
  };

  const fetchDBRDRequests = async () => {
    try {
      const res = await api.get('/rd-tracking');
      if (res.data.success) {
        const mapped = res.data.data.map(mapDBRDToUI);
        setDbRDList(mapped);
      }
    } catch (e) {
      console.error('Error fetching database R&D requests:', e);
    }
  };

  const filteredTrackingData = useMemo(() => {
    return [...dbTrackingList];
  }, [dbTrackingList]);

  const filteredSampleRequests = useMemo(() => {
    return [...dbRDList, ...sampleRequests];
  }, [dbRDList, sampleRequests]);

  const fetchDBRDRequest = async (code: string) => {
    setLoadingRD(true);
    try {
      const res = await api.get(`/rd-tracking/track/${code}`);
      if (res.data.success) {
        const item = res.data.data;
        const itemCustomer = item.ContractID?.title || 'Khách hàng';
        if (user && user.role !== 'Admin' && user.role !== 'NhanVien') {
          const customerName = user.profile?.TenKhachHang || '';
          const belongsToMe = itemCustomer.toLowerCase().includes(customerName.toLowerCase()) ||
            customerName.toLowerCase().includes(itemCustomer.toLowerCase());
          if (!belongsToMe) {
            toast.error('Bạn không có quyền truy cập dữ liệu pha chế này.');
            setLoadingRD(false);
            return;
          }
        }
        setTrackingCode(item._id);
        setSelectedSample({
          id: item.MaNhatKy || code,
          customer: itemCustomer,
          colorCode: item.MaMauYeuCau || 'RAL-MIX',
          surface: item.ContractID?.surface || 'Kim loại',
          status: item.TrangThai || 'pending',
          date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
          LichSuPhienBan: item.LichSuPhienBan || [],
          signedBy: item.signedBy,
          signedAt: item.signedAt
        });
        setActiveTab('samples');
      } else {
        toast.error('Không tìm thấy mã nhật ký R&D hoặc mã yêu cầu.');
      }
    } catch (e) {
      console.error('Failed to load R&D from DB:', e);
      toast.error('Không tìm thấy mã nhật ký R&D. Thử: REQ-001 hoặc REQ-002');
    } finally {
      setLoadingRD(false);
    }
  };

  useEffect(() => {
    // Fetch real shipping tracking and R&D logs from DB
    fetchDBTracking();
    fetchDBRDRequests();
  }, []);

  useEffect(() => {
    // Đọc URL độc lập khi mount (không phụ thuộc filteredTrackingData)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const tabParam = params.get('tab');

      if (tabParam === 'rd') {
        setActiveTab('samples');
      }

      // Xóa logic đọc localStorage, danh sách yêu cầu sẽ được fetch qua loadSampleRequests (gọi API)

      if (code) {
        setTrackingCode(code);
        if (!code.toLowerCase().startsWith('req-')) {
          fetchSingleTracking(code);
        } else {
          fetchDBRDRequest(code);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Xử lý orderId khi có filteredTrackingData
    if (typeof window !== 'undefined' && filteredTrackingData.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');
      if (orderId) {
        const foundShipping = filteredTrackingData.find((t: any) => t.dbRecord?.DonHang?._id === orderId || t.dbRecord?.DonHang === orderId);
        if (foundShipping) {
          setTrackingCode(foundShipping.code);
          setSelectedTracking(foundShipping);
          setActiveTab('shipment');
        }
      }
    }
  }, [filteredTrackingData]);

  // Simulating live package metrics ticking
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setSimProgress(prev => (prev + 0.0008) % 1.0);
      setSimSpeed(prev => Math.max(15, Math.min(110, prev + (Math.random() > 0.5 ? 1.5 : -1.5))));
      setSimTemp(prev => Math.max(16.0, Math.min(24.0, prev + (Math.random() > 0.5 ? 0.05 : -0.05))));
      setLastPing(0);
    }, 200);

    const pingInterval = setInterval(() => {
      setLastPing(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'samples') {
        setActiveTab('samples');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'samples') {
      loadSampleRequests();
    }
  }, [isAuthenticated, activeTab]);

  const loadSampleRequests = async () => {
    try {
      const res = await api.get('/rd-tracking?type=standalone');
      if (res.data.success) {
        const mapped = res.data.data.map((item: any) => ({
          id: item.MaNhatKy || item._id,
          customer: item.customerName || item.ContractID?.title || 'Khách hàng',
          colorCode: item.MaMauYeuCau || item.colorName || 'N/A',
          surface: item.surface || 'Kim loại',
          status: item.TrangThai || 'pending',
          date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
          LichSuPhienBan: item.LichSuPhienBan || [],
          signedBy: item.signedBy,
          signedAt: item.signedAt
        }));

        setSampleRequests(mapped);

        if (mapped.length > 0) {
          setSelectedSample(mapped[0]);
        } else {
          setSelectedSample(null);
        }
      }
    } catch (e) {
      console.error('Error fetching sample requests:', e);
    }
  };

  const handleSearch = async () => {
    if (!trackingCode) return;

    if (activeTab === 'shipment') {
      const found = filteredTrackingData.find((t: any) => t.code.toLowerCase() === trackingCode.toLowerCase());
      if (found) {
        setSelectedTracking(found);
      } else {
        // Gọi API tìm kiếm đơn lẻ
        const success = await fetchSingleTracking(trackingCode);
        if (success) return;

        // Try searching in sampleRequests state
        const foundRD = sampleRequests.find((r: any) => r.id.toLowerCase() === trackingCode.toLowerCase());
        if (foundRD) {
          setSelectedSample(foundRD);
          setActiveTab('samples');
          setSelectedTracking(null);
          return;
        }

        // Try DB R&D
        if (!trackingCode.toLowerCase().startsWith('req-')) {
          fetchDBRDRequest(trackingCode);
          return;
        }

        toast.error('Không tìm thấy mã tracking vận chuyển.');
      }
    } else {
      // Searching under RD tab
      const foundRD = sampleRequests.find((r: any) => r.id.toLowerCase() === trackingCode.toLowerCase());
      if (foundRD) {
        setSelectedSample(foundRD);
        setSelectedTracking(null);
      } else {
        fetchDBRDRequest(trackingCode);
      }
    }
  };

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

  const iconMap: Record<string, React.ElementType> = {
    'Đặt hàng': Package,
    'Sản xuất': Clock,
    'QC Pass': CheckCircle2,
    'Đang giao': Truck,
    'Đã nhận': MapPin,
    'MapPin': MapPin,
    'Truck': Truck,
    'CheckCircle2': CheckCircle2,
    'Package': Package,
    'Clock': Clock,
    'Camera': Camera,
  };

  const statusColors = {
    completed: 'bg-emerald-500 text-white shadow-emerald-500/20',
    current: 'bg-amber-400 text-white animate-pulse shadow-amber-400/20',
    upcoming: 'bg-slate-100 text-slate-400 border border-slate-200',
  };

  // Filter requests (Backend already filtered by user ID for security)
  const customerRequests = filteredSampleRequests.filter(req => {
    const matchSearch = req.id.toLowerCase().includes(sampleSearchTerm.toLowerCase()) ||
      (req.colorCode && req.colorCode.toLowerCase().includes(sampleSearchTerm.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="w-full max-w-[1300px] mx-auto px-6 md:px-12 xl:px-20 py-8 animate-in fade-in duration-700 relative">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-8 left-4 lg:left-8 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all z-10 shadow-sm cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* ═══════ NAV TABS SECTION ═══════ */}
      <div className="flex justify-center mb-10 mt-14 lg:mt-0">
        <div className="flex p-1.5 bg-slate-100 rounded-3xl border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setActiveTab('shipment')}
            className={`px-8 py-3.5 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-300 flex items-center gap-2.5 border-none cursor-pointer ${activeTab === 'shipment'
              ? 'bg-white text-blue-600 shadow-lg shadow-blue-100/50'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Package size={18} />
            Theo dõi Đơn Hàng
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-8 py-3.5 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-300 flex items-center gap-2.5 border-none cursor-pointer ${activeTab === 'samples'
              ? 'bg-white text-purple-600 shadow-lg shadow-purple-100/50'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <FlaskConical size={18} />
            Theo dõi Pha Chế R&D
          </button>
        </div>
      </div>

      {/* ═══════ TAB 1: SHIPMENT TRACKING ═══════ */}
      {activeTab === 'shipment' && (
        <div className="space-y-8">
          {/* Search Banner */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-[32px] p-12 border border-slate-200/50 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-100/80 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Package size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Tracking Kiện Hàng VTSC
            </h2>
            <p className="text-slate-500 font-medium text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Nhập mã tracking đơn hàng để theo dõi thời gian và tiến độ giao nhận thời gian thực
            </p>
            <div className="flex gap-3 max-w-lg mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-slate-100/40 border border-slate-100">
              <div className="relative flex-1 flex items-center pl-3">
                <Search size={18} className="text-slate-400 pointer-events-none mr-2" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none font-bold"
                  placeholder="Nhập mã tracking (VD: VTSC-240601-001)..."
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all cursor-pointer border-none shadow-md shadow-blue-600/10"
                onClick={handleSearch}
              >
                Tra cứu
              </button>
            </div>
          </div>

          {/* Tracking Result */}
          {selectedTracking && (
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl overflow-hidden mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Left Side: Tall Map */}
                <div className="relative h-[500px] lg:h-[800px] lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50 order-last lg:order-first">
                  <RouteMap
                    origin="Số 215 Lạch Tray, Gia Viên, Hải Phòng"
                    destination={selectedTracking.address || ''}
                    isDelivered={selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công'}
                  />
                  <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg z-[400] pointer-events-none ${selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? <CheckCircle2 size={13} /> : <Truck size={13} />}
                    {selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công' ? 'Đã giao thành công' : 'Đang trên đường giao'}
                  </div>
                </div>

                {/* Right Side: Info & Timeline */}
                <div className="p-8 flex flex-col h-[500px] lg:h-[800px] overflow-y-auto order-first lg:order-last">
                  {/* Order Info Header */}
                  <div className="flex justify-between items-start flex-wrap gap-6 mb-8 pb-8 border-b border-slate-100 shrink-0">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">Mã đơn hàng</span>
                      <h3 className="text-2xl font-black text-slate-900 mt-2 mb-4">
                        {selectedTracking.code}
                      </h3>
                      {/* Enhanced Order Info Cards */}
                      <div className="mt-4 space-y-6">

                        {/* Customer Info Card */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User size={12} className="text-blue-500" /> Thông tin người nhận
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-slate-500 text-xs font-semibold">Khách hàng:</span>
                              <strong className="text-slate-900 text-sm">{selectedTracking.customer}</strong>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-slate-500 text-xs font-semibold">Số điện thoại:</span>
                              <strong className="text-slate-900 text-sm">{selectedTracking.phone}</strong>
                            </div>
                            <div className="flex justify-between items-start pt-2 border-t border-slate-200/60 mt-1">
                              <span className="text-slate-500 text-xs font-semibold shrink-0 mt-0.5">Địa chỉ:</span>
                              <strong className="text-slate-800 text-[13px] text-right leading-tight ml-4">{selectedTracking.address}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Product List Card */}
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <Package size={12} className="text-amber-500" /> Sản phẩm ({selectedTracking.allProducts?.length || 1})
                          </h4>
                          <div className="space-y-2.5">
                            {selectedTracking.allProducts && selectedTracking.allProducts.length > 0 ? (
                              selectedTracking.allProducts.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                      <Package size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 line-clamp-2">{p.TenSanPham || p.name}</span>
                                  </div>
                                  <span className="text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border border-blue-100/50 shrink-0 ml-3">
                                    {p.SoLuong ? `${p.SoLuong} Thùng` : p.quantity}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                    <Package size={16} />
                                  </div>
                                  <span className="text-sm font-bold text-slate-800 line-clamp-2">{selectedTracking.product}</span>
                                </div>
                                <span className="text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border border-blue-100/50 shrink-0 ml-3">
                                  {selectedTracking.quantity}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 mt-8">
                    {selectedTracking.isRealDB ? (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Truck size={12} className="text-emerald-500" /> Lịch sử lộ trình
                        </h4>
                        <div className="relative space-y-6 pl-2">
                          <div className="absolute left-[72px] top-1 bottom-1 w-px bg-slate-100"></div>
                          {selectedTracking.dbRecord?.LoTrinh?.map((log: any, idx: number) => {
                            const isComplete = log.Status === "COMPLETE";
                            const isProcessing = log.Status === "PROCESSING";
                            return (
                              <div key={idx} className="flex items-start gap-6 relative">
                                <div className={`w-[60px] text-right shrink-0 pt-0.5 ${isComplete ? 'text-slate-900' : 'text-slate-300'}`}>
                                  <div className="text-sm font-bold">
                                    {log.ThoiGian ? new Date(log.ThoiGian).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                    {log.ThoiGian ? new Date(log.ThoiGian).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                                  </div>
                                </div>
                                <div className="relative z-10 bg-slate-50 pt-0.5">
                                  {isComplete
                                    ? <CheckCircle2 size={16} className="text-emerald-500" />
                                    : isProcessing
                                      ? <div className="w-[16px] h-[16px] rounded-full bg-blue-600 border-4 border-blue-100"></div>
                                      : <Circle size={16} className="text-slate-200" />}
                                </div>
                                <p className={`text-[13px] pt-0.5 ${(isComplete || isProcessing) ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                                  {log.NoiDung}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-2">
                        {selectedTracking.steps.map((step: any, i: number) => {
                          const Icon = iconMap[step.label] || Package;
                          return (
                            <div key={i} className="flex flex-col items-center gap-3 flex-1 relative text-center">
                              {/* Connector line */}
                              {i < selectedTracking.steps.length - 1 && (
                                <div className={`hidden md:block absolute top-5 left-1/2 w-full h-0.5 z-0 ${step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                              )}
                              {/* Dot */}
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center z-10 shadow-sm transition-all ${statusColors[step.status as keyof typeof statusColors]}`}>
                                <Icon size={18} />
                              </div>
                              <div className="space-y-1">
                                <span className="text-sm font-bold text-slate-800 block">{step.label}</span>
                                {step.time && <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md inline-block">{step.time}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* QR Code at bottom */}
                  <div className="mt-8 flex justify-center">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center shrink-0">
                      <QRCodeSVG
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://vtsc.vn'}/theo-doi-don-hang?code=${selectedTracking.code}`}
                        size={100}
                        bgColor="#ffffff"
                        fgColor="#0a0e27"
                        level="H"
                      />
                      <div className="text-center mt-3 text-[10px] text-slate-400 font-mono font-bold">
                        Quét mã để theo dõi
                        <br />
                        {selectedTracking.code}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of Shipments */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-slate-900">Danh Sách Kiện Hàng Của Bạn</h3>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Click để xem chi tiết lộ trình vận chuyển</p>
              </div>
            </div>
            {filteredTrackingData.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center text-slate-500">
                <Package size={32} className="mx-auto mb-3 text-slate-300" />
                <p>Bạn chưa có đơn hàng nào đang được vận chuyển.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTrackingData.map(t => {
                  const currentStep = t.steps.find((s: any) => s.status === 'current');
                  const completedSteps = t.steps.filter((s: any) => s.status === 'completed').length;
                  const totalSteps = t.steps.length;
                  return (
                    <div
                      key={t.code}
                      className="bg-white border border-slate-100 rounded-3xl p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 group flex justify-between items-center"
                      onClick={() => {
                        setSelectedTracking(t);
                        setTrackingCode(t.code);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 text-sm">{t.code}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="text-xs font-bold text-slate-400 uppercase">{t.customer}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-[15px]">{t.product}</h4>
                          <div className="flex items-center gap-2 mt-3">
                            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{completedSteps}/{totalSteps} chặng</span>
                          </div>
                        </div>
                        {currentStep && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {currentStep.label}
                          </span>
                        )}
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                        <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://vtsc.vn'}/theo-doi-don-hang?code=${t.code}`} size={70} bgColor="transparent" fgColor="#0f172a" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ TAB 2: R&D TRACKING (PRIVATE) ═══════ */}
      {activeTab === 'samples' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Đăng Nhập Quản Trị</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Vui lòng đăng nhập để xem thông tin R&D và pha chế.</p>
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold mb-6">
                  <AlertCircle size={16} /> {loginError}
                </div>
              )}  <form onSubmit={handleInlineLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-5 text-sm font-bold text-slate-800 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/5 transition-all"
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
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-5 text-sm font-bold text-slate-800 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/5 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 bg-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-600/20 hover:-translate-y-0.5 transition-all cursor-pointer border-none mt-6 disabled:opacity-50"
                >
                  {isLoggingIn ? <Clock className="animate-spin" size={18} /> : <LogIn size={18} />}
                  Đăng Nhập Ngay
                </button>
              </form>
            </div >
          ) : (
            /* ═══════ AUTHENTICATED R&D DASHBOARD ═══════ */
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Beaker size={18} />
                      </span>
                      Lịch Sử Yêu Cầu R&D
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Danh sách mẫu pha chế bạn đã gửi</p>
                  </div>
                  {/* Quick Search */}
                  <div className="relative group w-full sm:w-72 shrink-0">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl px-10 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 font-bold"
                      placeholder="Tìm theo Mã Yêu Cầu, Màu..."
                      value={sampleSearchTerm}
                      onChange={e => setSampleSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* List Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerRequests.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-slate-400 font-medium italic text-sm">
                      Không tìm thấy yêu cầu pha chế nào.
                    </div>
                  ) : (
                    customerRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col group"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[12px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                            {req.id}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {req.date}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-lg mb-1">{req.colorCode}</h4>
                        <div className="flex items-center gap-2 mb-4">
                          <Layers size={14} className="text-slate-400" />
                          <span className="text-xs text-slate-500 font-medium">{req.surface}</span>
                          <span className={`ml-auto status-badge text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : req.status === 'processing'
                              ? 'bg-orange-50 text-orange-600 animate-pulse border border-orange-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                            {req.status === 'approved' ? 'APPROVED' : req.status}
                          </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setQrRequestId(req.id);
                              setShowQRModal(true);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            <QrCode size={16} /> QR Code
                          </button>
                          <Link
                            href={`/rd-tracking/${req.id}`}
                            className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 hover:-translate-y-0.5 transition-all"
                          >
                            Xem chi tiết <ChevronRight size={16} />
                          </Link>
                        </div>
                        {req.imageUrl && (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh mẫu y/c</span>
                            <img
                              src={req.imageUrl}
                              alt="Ảnh mẫu khách gửi"
                              className="w-16 h-16 object-cover rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(req.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrRequestId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border-none bg-transparent"
            >
              <XCircle size={24} />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <QrCode size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Mã QR Lộ Trình</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Quét mã dưới đây bằng điện thoại để xem lộ trình R&D.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'https://vtsc.vn'}/theo-doi-don-hang/rd/${qrRequestId}`}
                  size={180}
                  bgColor="#f8fafc"
                  fgColor="#0f172a"
                  level="H"
                />
                <div className="mt-4 font-mono font-bold text-sm text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                  {qrRequestId}
                </div>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all cursor-pointer border-none"
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