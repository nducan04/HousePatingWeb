'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Package, CheckCircle2, Clock, Truck, MapPin, Compass, ShieldAlert, Cpu, Activity, RefreshCw, XCircle, Beaker, Loader2, Camera, ArrowLeft } from 'lucide-react';
import { trackingData, paintColors } from '@/lib/data/colors-data';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

// Define stylized GPS waypoints for routes
const ROUTES_COORDINATES: Record<string, { name: string; lat: number; lng: number; x: number; y: number }[]> = {
  'VTSC-240601-001': [
    { name: 'Nhà máy VTSC Hải Phòng, VN', lat: 20.8688, lng: 106.6798, x: 745, y: 245 },
    { name: 'Biển Đông (East Vietnam Sea)', lat: 12.2452, lng: 111.4589, x: 765, y: 275 },
    { name: 'Eo biển Singapore', lat: 1.3521, lng: 103.8198, x: 740, y: 310 },
    { name: 'Ấn Độ Dương (Indian Ocean)', lat: -5.1252, lng: 85.4121, x: 670, y: 350 },
    { name: 'Cảng Aden, Yemen', lat: 12.7855, lng: 44.9749, x: 580, y: 270 },
    { name: 'Kênh đào Suez, Ai Cập', lat: 29.9752, lng: 32.5212, x: 550, y: 210 },
    { name: 'Cảng Rotterdam, Hà Lan', lat: 51.9244, lng: 4.4777, x: 450, y: 120 }
  ],
  'VTSC-240610-002': [
    { name: 'Nhà máy VTSC Hải Phòng, VN', lat: 20.8688, lng: 106.6798, x: 745, y: 245 },
    { name: 'Quần đảo Hoàng Sa', lat: 16.5242, lng: 112.0832, x: 765, y: 260 },
    { name: 'Biển Hoa Đông', lat: 28.5212, lng: 124.6147, x: 795, y: 220 },
    { name: 'Cảng Busan, Hàn Quốc', lat: 35.1796, lng: 129.0756, x: 815, y: 195 },
    { name: 'Vịnh Tokyo, Nhật Bản', lat: 35.6762, lng: 139.6503, x: 840, y: 200 }
  ]
};

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<any | null>(null);

  // R&D Tracking states
  const [activeTab, setActiveTab] = useState<'shipping' | 'rd'>('shipping');
  const [selectedRDRequest, setSelectedRDRequest] = useState<any | null>(null);
  const [sampleRequests, setSampleRequests] = useState<any[]>([]);
  const [loadingRD, setLoadingRD] = useState(false);

  // Live simulation states
  const [simProgress, setSimProgress] = useState(0.45);
  const [simSpeed, setSimSpeed] = useState(72);
  const [simTemp, setSimTemp] = useState(19.4);
  const [lastPing, setLastPing] = useState(0);

  const { user } = useAuthStore();

  const [dbTrackingList, setDbTrackingList] = useState<any[]>([]);

  const mapDBTrackingToUI = (item: any) => {
    const donHang = item.DonHang || {};
    const khachHang = donHang.KhachHang || {};

    let product = 'Sơn tĩnh điện AkzoNobel';
    let qtyStr = 'N/A';
    if (donHang.Items && donHang.Items.length > 0) {
      product = donHang.Items[0].TenSanPham || product;
      qtyStr = `${donHang.Items[0].SoLuong} Thùng`;
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

    return {
      code: item.MaVanChuyen || `DEL-${donHang.MaDonHang || 'DH'}`,
      customer: khachHang.TenKhachHang || 'Khách hàng',
      product: product,
      quantity: qtyStr,
      steps: steps,
      isRealDB: true,
      dbRecord: item
    };
  };

  const fetchDBTracking = async () => {
    try {
      const res = await api.get('/van-chuyen');
      if (res.data.success) {
        const mapped = res.data.data.map(mapDBTrackingToUI);
        setDbTrackingList(mapped);

        // Auto-select the first item if no query params exist
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          const orderId = params.get('orderId');
          if (!code && !orderId && mapped.length > 0) {
            setSelectedTracking(mapped[0]);
            setTrackingCode(mapped[0].code);
            setActiveTab('shipping');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching database shipping tracking:', e);
    }
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
      const res = await api.get(`/rd-tracking/${code}`);
      if (res.data.success) {
        const item = res.data.data;
        const itemCustomer = item.ContractID?.title || 'Khách hàng';
        if (user && user.role !== 'Admin' && user.role !== 'NhanVien') {
          const customerName = user.profile?.TenKhachHang || '';
          const belongsToMe = itemCustomer.toLowerCase().includes(customerName.toLowerCase()) ||
            customerName.toLowerCase().includes(itemCustomer.toLowerCase());
          if (!belongsToMe) {
            alert('Bạn không có quyền truy cập dữ liệu pha chế này.');
            setLoadingRD(false);
            return;
          }
        }
        setSelectedRDRequest({
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
        setActiveTab('rd');
      } else {
        alert('Không tìm thấy mã nhật ký R&D hoặc mã yêu cầu.');
      }
    } catch (e) {
      console.error('Failed to load R&D from DB:', e);
      alert('Không tìm thấy mã nhật ký R&D. Thử: REQ-001 hoặc REQ-002');
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
    // Read pre-filled query param if exists
    if (typeof window !== 'undefined' && filteredTrackingData.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const orderId = params.get('orderId');
      const tabParam = params.get('tab');

      if (tabParam === 'rd') {
        setActiveTab('rd');
      }

      // Load sample requests from localstorage
      const stored = localStorage.getItem('sampleRequests');
      let localReqs = [];
      if (stored) {
        localReqs = JSON.parse(stored);
        setSampleRequests(localReqs);
      } else {
        const defaultRequests = [
          { id: 'REQ-001', customer: 'NCC Aluminium', colorCode: 'INT-D2525', surface: 'Nhôm định hình', status: 'pending', date: '12/05/2026', LichSuPhienBan: [] },
          { id: 'REQ-002', customer: 'VPIC Steel', colorCode: 'RAL-9005', surface: 'Thép tấm', status: 'processing', date: '11/05/2026', LichSuPhienBan: [] },
        ];
        localStorage.setItem('sampleRequests', JSON.stringify(defaultRequests));
        setSampleRequests(defaultRequests);
        localReqs = defaultRequests;
      }

      if (orderId) {
        const foundShipping = filteredTrackingData.find(t => t.dbRecord?.DonHang?._id === orderId || t.dbRecord?.DonHang === orderId);
        if (foundShipping) {
          setTrackingCode(foundShipping.code);
          setSelectedTracking(foundShipping);
          setActiveTab('shipping');
        }
      } else if (code) {
        setTrackingCode(code);
        // Try searching in shippingData
        const foundShipping = filteredTrackingData.find(t => t.code.toLowerCase() === code.toLowerCase());
        if (foundShipping) {
          setSelectedTracking(foundShipping);
          setActiveTab('shipping');
        } else {
          // Check local R&D requests
          const foundRD = localReqs.find((r: any) => r.id.toLowerCase() === code.toLowerCase());
          if (foundRD) {
            setSelectedRDRequest(foundRD);
            setActiveTab('rd');
          } else {
            // Try fetching from DB if not start with REQ
            if (!code.toLowerCase().startsWith('req-')) {
              fetchDBRDRequest(code);
            }
          }
        }
      }
    }
  }, [filteredTrackingData, user]);

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

  const handleSearch = () => {
    if (!trackingCode) return;

    if (activeTab === 'shipping') {
      const found = filteredTrackingData.find(t => t.code.toLowerCase() === trackingCode.toLowerCase());
      if (found) {
        setSelectedTracking(found);
      } else {
        // Try searching in local R&D in case they entered R&D code under shipping tab
        const stored = localStorage.getItem('sampleRequests');
        if (stored) {
          const reqs = JSON.parse(stored);
          const foundRD = reqs.find((r: any) => r.id.toLowerCase() === trackingCode.toLowerCase());
          if (foundRD) {
            setSelectedRDRequest(foundRD);
            setActiveTab('rd');
            setSelectedTracking(null);
            return;
          }
        }

        // Try DB R&D
        if (!trackingCode.toLowerCase().startsWith('req-')) {
          fetchDBRDRequest(trackingCode);
          return;
        }

        alert('Không tìm thấy mã tracking vận chuyển. Thử: VTSC-240601-001 hoặc VTSC-240610-002');
      }
    } else {
      // Searching under RD tab
      const stored = localStorage.getItem('sampleRequests');
      let localReqs = [];
      if (stored) {
        localReqs = JSON.parse(stored);
      }

      const foundRD = localReqs.find((r: any) => r.id.toLowerCase() === trackingCode.toLowerCase());
      if (foundRD) {
        setSelectedRDRequest(foundRD);
        setSelectedTracking(null);
      } else if (!trackingCode.toLowerCase().startsWith('req-')) {
        fetchDBRDRequest(trackingCode);
      } else {
        alert('Không tìm thấy yêu cầu R&D. Thử: REQ-001 hoặc REQ-002');
      }
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

  // Get active routes details
  const activeRouteData = useMemo(() => {
    const code = selectedTracking?.code || 'VTSC-240601-001';
    return ROUTES_COORDINATES[code] || ROUTES_COORDINATES['VTSC-240601-001'];
  }, [selectedTracking]);

  // Interpolated marker coordinates
  const currentPos = useMemo(() => {
    const route = activeRouteData;
    const count = route.length;
    if (count === 0) return { x: 0, y: 0, lat: '0', lng: '0', name: '' };

    const segment = Math.min(count - 2, Math.floor(simProgress * (count - 1)));
    const localProgress = (simProgress * (count - 1)) - segment;

    const p1 = route[segment];
    const p2 = route[segment + 1];

    if (!p2) return { x: p1.x, y: p1.y, lat: p1.lat.toFixed(4), lng: p1.lng.toFixed(4), name: p1.name };

    const x = p1.x + (p2.x - p1.x) * localProgress;
    const y = p1.y + (p2.y - p1.y) * localProgress;
    const lat = p1.lat + (p2.lat - p1.lat) * localProgress;
    const lng = p1.lng + (p2.lng - p1.lng) * localProgress;

    return {
      x,
      y,
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      name: localProgress > 0.5 ? p2.name : p1.name
    };
  }, [activeRouteData, simProgress]);

  // Generate SVG path for route lines
  const routePathD = useMemo(() => {
    const route = activeRouteData;
    if (route.length === 0) return '';
    return route.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} Q ${(route[idx - 1].x + pt.x) / 2} ${(route[idx - 1].y + pt.y) / 2 - 15}, ${pt.x} ${pt.y}`;
    }, '');
  }, [activeRouteData]);

  const isCustomer = user?.role === 'KhachHangB2B' || user?.role === 'KhachHangB2C';

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Header Section */}
      <div className="bg-[#0c102a] text-white pt-24 pb-32 px-4 rounded-b-[48px] relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-blue-900/20" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Back Button */}
        <div className="absolute top-8 left-4 md:left-8 z-20">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-semibold transition-all border border-white/10 shadow-lg cursor-pointer">
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              {activeTab === 'shipping' ? (
                <Compass size={32} className="animate-spin-slow" />
              ) : (
                <Beaker size={32} className="animate-pulse text-purple-400" />
              )}
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
            {isCustomer
              ? (activeTab === 'shipping' ? `Lộ trình vận chuyển` : `Tiến độ R&D`)
              : (activeTab === 'shipping' ? 'Hành Trình Giao Nhận Toàn Cầu' : 'Quy Trình R&D Pha Chế Sơn')
            }
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium">
            {isCustomer
              ? (activeTab === 'shipping'
                ? 'Theo dõi chi tiết vị trí và trạng thái các kiện hàng đang được giao đến bạn.'
                : 'Kiểm tra lịch sử các mẻ test pha chế sơn được yêu cầu bởi doanh nghiệp của bạn.')
              : (activeTab === 'shipping'
                ? 'Nhập mã vận đơn VTSC để theo dõi tọa độ, thời gian thực, vị trí của kiện hàng trên bản đồ vệ tinh toàn thế giới.'
                : 'Nhập mã yêu cầu R&D để tra cứu lịch sử mẻ test pha chế sơn, phản hồi thông số từ phòng kiểm nghiệm chất lượng KCS.')
            }
          </p>

          {!isCustomer && (
            <div className="flex gap-2.5 max-w-md mx-auto bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md">
              <div className="relative flex-1 flex items-center">
                <Search size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none text-white text-sm font-semibold placeholder:text-slate-500 outline-none pl-11 pr-4"
                  placeholder={activeTab === 'shipping' ? 'VD: VTSC-240601-001...' : 'VD: REQ-001, REQ-002...'}
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer border-none"
                onClick={handleSearch}
              >
                Tra cứu
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 max-w-[1400px] mx-auto px-4 md:px-8 py-6">

        {/* Dynamic Tab Bar */}
        <div className="flex justify-center border-b border-slate-200 max-w-md mx-auto mb-8">
          <button
            onClick={() => {
              setActiveTab('shipping');
              setSelectedRDRequest(null);
              setTrackingCode('');
            }}
            className={`flex-1 pb-3.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${activeTab === 'shipping'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
              }`}
          >
            <Truck size={15} />
            Theo dõi Vận chuyển
          </button>
          <button
            onClick={() => {
              setActiveTab('rd');
              setSelectedTracking(null);
              setTrackingCode('');
              // Preload sampleRequests in state
              const stored = localStorage.getItem('sampleRequests');
              if (stored) {
                setSampleRequests(JSON.parse(stored));
              }
            }}
            className={`flex-1 pb-3.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${activeTab === 'rd'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
              }`}
          >
            <Beaker size={15} />
            Theo dõi Pha chế R&D
          </button>
        </div>

        {/* Tab Contents: Shipping Logistics */}
        {activeTab === 'shipping' && (
          <>
            {selectedTracking && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* World Map Container */}
                <div className="lg:col-span-2 bg-slate-950 rounded-[32px] p-6 border border-slate-850 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  {/* World Map Header Status */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 z-10 relative">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3.5 w-3.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                      </span>
                      <div>
                        <h3 className="font-extrabold text-[15px] text-white tracking-wider uppercase">VỆ TINH LIVE FEED</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">TỔNG CỤC HẢI QUAN & LOGISTICS VTSC</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px] text-blue-400 shadow-inner">
                      <Activity size={12} className="animate-pulse" />
                      <span>Pings: {lastPing}s ago</span>
                    </div>
                  </div>

                  {/* Embedded Real Map */}
                  <div className="flex-1 w-full h-[350px] md:h-[450px] my-4 select-none relative z-10 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                    {(() => {
                      const origin = 'Số 215 Lạch Tray, Gia Viên, Hải Phòng';
                      const dest = selectedTracking.dbRecord?.DonHang?.DiaChiGiaoHang || '';
                      const lotrinh = selectedTracking.dbRecord?.LoTrinh || [];

                      const extractLocation = (text: string) => {
                        if (!text) return null;
                        const lower = text.toLowerCase();
                        const cities = [
                          'hà nội', 'hải phòng', 'hồ chí minh', 'đà nẵng', 'cần thơ',
                          'bắc ninh', 'hưng yên', 'hải dương', 'vĩnh phúc', 'thái nguyên',
                          'thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị', 'thừa thiên huế',
                          'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'nha trang',
                          'bình thuận', 'ninh thuận', 'lâm đồng', 'đà lạt',
                          'bình dương', 'đồng nai', 'bà rịa', 'vũng tàu', 'long an', 'tiền giang',
                          'củ chi', 'bến tre', 'trà vinh', 'vĩnh long', 'đồng tháp', 'an giang', 'kiên giang',
                          'cà mau', 'bạc liêu', 'sóc trăng', 'hậu giang'
                        ];

                        // Fallback 1: Extract city by matching
                        for (const city of cities) {
                          if (lower.includes(city)) return city + ', Việt Nam';
                        }

                        // Fallback 2: Extract string after colon
                        if (text.includes(':')) {
                          const loc = text.split(':')[1].trim();
                          return loc.length > 2 ? loc + ', Việt Nam' : null;
                        }

                        return null;
                      };

                      // Only take unique waypoints to avoid overlapping pins
                      const rawWaypoints = lotrinh.map((l: any) => extractLocation(l.NoiDung)).filter(Boolean) as string[];
                      const waypoints = Array.from(new Set(rawWaypoints));

                      const mapSrc = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${waypoints.length > 0
                        ? waypoints.map((wp) => encodeURIComponent(wp)).join('+to:') + '+to:' + encodeURIComponent(dest)
                        : encodeURIComponent(dest)
                        }&output=embed`;

                      const isDelivered = selectedTracking.dbRecord?.TrangThaiTongQuat === 'Giao hàng thành công';
                      const currentLocationText = isDelivered
                        ? dest.split(',')[0]
                        : waypoints.length > 0
                          ? (waypoints[waypoints.length - 1] as string).replace(', Việt Nam', '')
                          : origin.split(',').pop()?.trim();

                      return (
                        <>
                          {/* Floating Truck/Location Indicator */}
                          {!isDelivered && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 z-20 pointer-events-none">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-rose-200 rounded-full animate-ping opacity-75"></div>
                                <div className="p-2 rounded-full text-white shadow-md relative z-10 bg-rose-500">
                                  <Truck size={16} />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                  Vị trí hiện tại
                                </span>
                                <span className="text-sm font-black leading-none text-rose-600">
                                  {currentLocationText}
                                </span>
                              </div>
                            </div>
                          )}

                          <iframe
                            title="Tracking Map"
                            width="100%"
                            height="100%"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            allowFullScreen
                            src={mapSrc}
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Shipment & Customer Details Panel */}
                <div className="bg-white border border-slate-200 rounded-[32px] shadow-xl p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                          ĐANG VẬN CHUYỂN
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                          {selectedTracking.code}
                        </h3>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <QRCodeSVG
                          value={`https://vtsc.vn/tracking/${selectedTracking.code}`}
                          size={80}
                          bgColor="#ffffff"
                          fgColor="#0c102a"
                          level="H"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">KHÁCH HÀNG:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedTracking.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">DÒNG SẢN PHẨM:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedTracking.product}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">SỐ LƯỢNG:</span>
                        <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">{selectedTracking.quantity}</span>
                      </div>
                    </div>

                    {/* Real Status Stepper / Timeline */}
                    {selectedTracking.dbRecord && selectedTracking.dbRecord.LoTrinh && (
                      <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">LỊCH SỬ LỘ TRÌNH THỰC TẾ</h4>
                        <div className="flex flex-col gap-5">
                          {selectedTracking.dbRecord.LoTrinh.map((log: any, i: number) => {
                            const Icon = iconMap[log.Icon] || Package;
                            const isCompleted = log.Status === 'COMPLETE';
                            const isCurrent = log.Status === 'PROCESSING';
                            return (
                              <div key={i} className="flex gap-4 items-start relative">
                                {/* Connector line */}
                                {i < selectedTracking.dbRecord.LoTrinh.length - 1 && (
                                  <div className={`absolute left-[18px] top-9 w-0.5 h-7 ${isCompleted ? 'bg-emerald-400' : 'bg-blue-300'}`} />
                                )}
                                {/* Dot status indicator */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/20' : isCurrent ? 'bg-blue-600 text-white animate-pulse shadow-blue-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                  <Icon size={15} />
                                </div>
                                <div>
                                  <div className={`text-sm font-extrabold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {log.NoiDung}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                    {log.ThoiGian ? new Date(log.ThoiGian).toLocaleString('vi-VN') : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shipment Evidence */}
                    {selectedTracking.dbRecord && selectedTracking.dbRecord.HinhAnhGiaoHang && selectedTracking.dbRecord.HinhAnhGiaoHang.length > 0 && (
                      <div className="pt-6 border-t border-slate-100 mt-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">📸 Hình ảnh minh chứng giao hàng</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedTracking.dbRecord.HinhAnhGiaoHang.map((url: string, i: number) => {
                            const getMediaUrl = (url: string) => {
                              if (!url) return '';
                              if (url.startsWith('http')) return url;
                              const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
                              return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                            };
                            return (
                              <div key={i} onClick={() => window.open(getMediaUrl(url), '_blank')} className="rounded-xl overflow-hidden h-32 bg-slate-50 hover:scale-105 transition-transform cursor-pointer shadow-sm border border-slate-100">
                                <img src={getMediaUrl(url)} alt={`Evidence ${i}`} className="w-full h-full object-cover" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Delivery File (BienBan) */}
                    {selectedTracking.dbRecord && selectedTracking.dbRecord.LoHang?.BienBanFile && (
                      <div className="pt-6 border-t border-slate-100 mt-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">📝 Biên bản bàn giao</h4>
                        <div className="flex items-center gap-2">
                          <a href={
                            (() => {
                              const url = selectedTracking.dbRecord.LoHang.BienBanFile;
                              if (!url) return '';
                              if (url.startsWith('http')) return url;
                              const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
                              return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                            })()
                          } target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">
                            <Package size={14} /> Xem File đính kèm biên bản
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 flex items-start gap-3">
                    <ShieldAlert className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Tọa độ live được phát từ bộ định vị GPS đặt tại container. Cập nhật tự động mỗi 15 giây.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo QR Codes & Recent Shipments Grid */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Truck className="text-blue-600" size={22} />
                    Kiện Hàng Mới Nhất
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Click để nạp tọa độ hành trình lên bản đồ vệ tinh toàn cầu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTrackingData.map(t => {
                  const currentStep = t.steps.find((s: any) => s.status === 'current');
                  const completedSteps = t.steps.filter((s: any) => s.status === 'completed').length;
                  const totalSteps = t.steps.length;
                  return (
                    <div
                      key={t.code}
                      className="bg-white border border-slate-200 rounded-[28px] p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex items-center justify-between group relative overflow-hidden"
                      onClick={() => {
                        setSelectedTracking(t);
                        setTrackingCode(t.code);
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/20 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                      <div className="relative z-10 flex-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {t.code}
                        </span>
                        <div className="font-extrabold text-slate-800 mt-3 text-[15px]">{t.customer}</div>
                        <div className="text-[13px] text-slate-400 font-semibold mt-0.5">{t.product}</div>

                        <div className="flex items-center gap-2 mt-4">
                          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">{completedSteps}/{totalSteps} chặng</span>
                        </div>
                        {currentStep && (
                          <span className="inline-block mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold shadow-sm">
                            • {currentStep.label.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 bg-white p-3 rounded-2xl border border-slate-100 group-hover:border-blue-200 transition-colors shadow-sm ml-4">
                        <QRCodeSVG value={`https://vtsc.vn/tracking/${t.code}`} size={75} bgColor="#ffffff" fgColor="#0c102a" level="M" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Tab Contents: R&D Paint Formulation Process */}
        {activeTab === 'rd' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick List Selector */}
            <div className="bg-slate-50 rounded-[28px] p-6 border border-slate-150 shadow-inner">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Beaker size={16} className="text-purple-600 animate-pulse" />
                Yêu cầu mẫu thử R&D của bạn
              </h3>

              {filteredSampleRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-bold text-xs">
                  Chưa có yêu cầu pha chế nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSampleRequests.map((req) => {
                    const isSelected = selectedRDRequest?.id === req.id;
                    const colorHex = paintColors.find(c => c.code === req.colorCode)?.hex || '#cbd5e1';

                    return (
                      <button
                        key={req.id}
                        onClick={() => {
                          setSelectedRDRequest(req);
                          setTrackingCode(req.id);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className={`p-5 rounded-[22px] border text-left transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between h-[155px] ${isSelected
                          ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/5'
                          : 'bg-white border-slate-200 hover:border-blue-400'
                          }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              {req.id}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              req.status === 'processing' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                              {req.status === 'approved' ? 'Đạt chuẩn' : req.status === 'processing' ? 'Pha chế' : 'Chờ test'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 my-3">
                            <span
                              className="w-5 h-5 rounded-full border border-slate-200 shadow-sm shrink-0"
                              style={{ backgroundColor: colorHex }}
                            />
                            <div>
                              <div className="text-xs font-black text-slate-800">{req.colorCode}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{req.surface}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                          <span className="truncate max-w-[120px]">{req.customer}</span>
                          <span>{req.date}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* R&D Log loading state */}
            {loadingRD && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Đang đồng bộ dữ liệu R&D từ phòng LAB...</p>
              </div>
            )}

            {/* Mixing timeline detail */}
            {!loadingRD && selectedRDRequest && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-500">
                {/* Left Info Column */}
                <div className="bg-white border border-slate-200 rounded-[32px] shadow-xl p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-3 py-1 rounded-full uppercase tracking-widest">
                          R&D PHA CHẾ SƠN
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                          {selectedRDRequest.id}
                        </h3>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <QRCodeSVG
                          value={`https://vtsc.vn/tracking?code=${selectedRDRequest.id}&tab=rd`}
                          size={75}
                          bgColor="#ffffff"
                          fgColor="#0c102a"
                          level="M"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">KHÁCH HÀNG:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedRDRequest.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">MÃ MÀU MỤC TIÊU:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedRDRequest.colorCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">BỀ MẶT SỬ DỤNG:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedRDRequest.surface}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">KHỞI TẠO R&D:</span>
                        <span className="text-sm font-extrabold text-slate-800">{selectedRDRequest.date}</span>
                      </div>
                    </div>

                    {/* QC signature status */}
                    {selectedRDRequest.status === 'approved' ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
                        <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5 animate-bounce" size={18} />
                        <div>
                          <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">ĐÃ DUYỆT KCS CHẤT LƯỢNG</div>
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">
                            Người duyệt: {selectedRDRequest.signedBy || 'KCS Phòng Lab VTSC'}
                          </p>
                          {selectedRDRequest.signedAt && (
                            <p className="text-[9px] text-emerald-500 font-medium">
                              Thời gian: {new Date(selectedRDRequest.signedAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
                        <Clock className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">ĐANG PHA CHẾ THỬ NGHIỆM</div>
                          <p className="text-[10px] text-amber-600/80 font-semibold mt-1">
                            Các mẻ test đang được phòng Lab VTSC tinh chỉnh tỉ lệ màu tối ưu.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 flex items-start gap-3">
                    <ShieldAlert className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Nhật ký mẻ test này được ghi lại trực tiếp bởi kỹ thuật viên trong phòng thí nghiệm R&D. Lịch sử pha chế được đồng bộ hóa tức thời cho khách hàng.
                    </p>
                  </div>
                </div>

                {/* R&D Log Timeline Container */}
                <div className="lg:col-span-2 bg-slate-950 rounded-[32px] p-6 border border-slate-850 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 z-10 relative">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3.5 w-3.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                      </span>
                      <div>
                        <h3 className="font-extrabold text-[15px] text-white tracking-wider uppercase">LỊCH SỬ PHA CHẾ SƠN</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">VTSC LAB FORMULATION TRACE LOG</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px] text-blue-400 shadow-inner">
                      <Activity size={12} className="animate-pulse" />
                      <span>Mẻ Test: {selectedRDRequest.LichSuPhienBan?.length || 0} lần</span>
                    </div>
                  </div>

                  {/* Timeline detailed list */}
                  <div className="flex-1 w-full max-h-[500px] overflow-y-auto pr-2 space-y-6 scrollbar-thin relative z-10 my-4">
                    {(!selectedRDRequest.LichSuPhienBan || selectedRDRequest.LichSuPhienBan.length === 0) ? (
                      <div className="text-center py-20 flex flex-col items-center justify-center text-slate-500">
                        <Clock size={40} className="mb-3 text-slate-600 animate-spin-slow" />
                        <p className="text-sm font-bold">Chưa có mẻ test nào được ghi nhận</p>
                        <p className="text-xs text-slate-600 mt-1">Kỹ thuật viên đang chuẩn bị nguyên liệu để sấy mẻ đầu tiên.</p>
                      </div>
                    ) : (
                      [...selectedRDRequest.LichSuPhienBan].reverse().map((v: any, idx: number) => {
                        const wastage = v.inputWeight && v.outputWeight
                          ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1)
                          : '0.0';

                        return (
                          <div key={idx} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-800 last:before:hidden">
                            {/* Dot status */}
                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-slate-950 z-10 ${v.result === 'pass' ? 'bg-emerald-500' : v.result === 'fail' ? 'bg-rose-500' : 'bg-amber-500'
                              }`}>
                              {v.result === 'pass' ? <CheckCircle2 size={12} /> : v.result === 'fail' ? <XCircle size={12} /> : <Clock size={12} />}
                            </div>

                            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-inner hover:border-slate-800 transition-colors">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white">Phiên bản V{v.version}</span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${v.result === 'pass' ? 'bg-emerald-950 text-emerald-400' :
                                    v.result === 'fail' ? 'bg-rose-950 text-rose-400' :
                                      'bg-amber-950 text-amber-400'
                                    }`}>
                                    {v.result === 'pass' ? 'ĐẠT CHUẨN KCS' : v.result === 'fail' ? 'LỖI - YÊU CẦU RE-TEST' : 'ĐANG CHỜ TIỂU CHUẨN'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {new Date(v.date).toLocaleString('vi-VN')}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Left specs */}
                                <div className="space-y-2">
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">⚙️ Thông số kỹ thuật</div>
                                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-slate-300 leading-relaxed font-medium">
                                    {v.parameters || 'Không có thông số đặc thù.'}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-blue-950/40 text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                      Input: <strong className="font-black">{v.inputWeight}kg</strong>
                                    </span>
                                    <span className="bg-purple-950/40 text-purple-400 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                      Output: <strong className="font-black">{v.outputWeight}kg</strong>
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${parseFloat(wastage) > 5 ? 'bg-rose-950/40 text-rose-400' : 'bg-emerald-950/40 text-emerald-400'
                                      }`}>
                                      Hao hụt: <strong className="font-black">{wastage}%</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Right Feedback */}
                                <div className="space-y-2">
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">💬 Phản hồi phòng Lab</div>
                                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-slate-300 leading-relaxed font-medium">
                                    {v.feedback || 'Chưa ghi nhận phản hồi lệch màu.'}
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                                    <span>Tester: <strong className="text-slate-300">{v.tester}</strong></span>
                                    {v.testerCode && <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono text-[9px]">{v.testerCode}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-900 z-10 relative">
                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <Beaker size={18} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TỔNG MẺ TEST CHẠY</div>
                        <div className="font-mono text-sm font-bold text-white mt-0.5">{selectedRDRequest.LichSuPhienBan?.length || 0} Lô</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SỐ MẺ ĐẠT TIÊU CHUẨN</div>
                        <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                          {selectedRDRequest.LichSuPhienBan?.filter((v: any) => v.result === 'pass').length || 0} Lô
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850/60 flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="w-9 h-9 rounded-xl bg-rose-950 text-rose-400 flex items-center justify-center flex-shrink-0">
                        <XCircle size={18} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SỐ MẺ THẤT BẠI/RE-TEST</div>
                        <div className="font-mono text-sm font-bold text-rose-400 mt-0.5">
                          {selectedRDRequest.LichSuPhienBan?.filter((v: any) => v.result === 'fail').length || 0} Lô
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
