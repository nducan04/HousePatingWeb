'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, Package, CheckCircle2, Clock, Truck, MapPin, 
  Beaker, FlaskConical, AlertCircle, Eye, ArrowRight, 
  ShieldCheck, User, Calendar, Layers, Scale, 
  MessageSquare, Image as ImageIcon, Sparkles, LogIn, ChevronRight, XCircle
} from 'lucide-react';
import { trackingData, paintColors } from '@/lib/data/colors-data';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';

export default function TrackingPage() {
  const { isAuthenticated, user, loginState } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'shipment' | 'samples'>('shipment');

  // Shipment states
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
    const itemCustomer = item.ContractID?.title || item.customerName || 'Khách hàng';
    return {
      id: item.MaNhatKy || item._id,
      customer: itemCustomer,
      colorCode: item.MaMauYeuCau || 'RAL-MIX',
      colorName: item.colorName,
      surface: item.ContractID?.surface || item.surface || 'Kim loại',
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
    return [...dbRDList];
  }, [dbRDList]);

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

      // No more localStorage. Just rely on dbRDList and filteredTrackingData.

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
<<<<<<< Updated upstream
          // Check local R&D requests
          const foundRD = localReqs.find((r: any) => r.id.toLowerCase() === code.toLowerCase());
=======
          // Check DB R&D requests
          const foundRD = dbRDList.find((r: any) => r.id === trackingCode);
>>>>>>> Stashed changes
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

  // R&D samples states
  const [sampleRequests, setSampleRequests] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);
  const [sampleSearchTerm, setSampleSearchTerm] = useState('');

  // Inline login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const loadSampleRequests = () => {
    if (typeof window !== 'undefined') {
<<<<<<< Updated upstream
      const stored = localStorage.getItem('sampleRequests');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSampleRequests(parsed);
        
        // Find user display name
        const displayName = user?.profile?.HoTen || user?.profile?.TenKhachHang || user?.username || '';
        const myReqs = parsed.filter((r: any) => 
          r.customer === displayName || 
          (r.customer && r.customer.toLowerCase() === displayName.toLowerCase())
        );
        
        if (myReqs.length > 0) {
          setSelectedSample(myReqs[0]);
        } else {
          setSelectedSample(null);
        }
      } else {
        const defaultRequests = [
          { id: 'REQ-001', customer: 'NCC Aluminium', colorCode: 'INT-D2525', surface: 'Nhôm định hình', status: 'pending', date: '12/05/2026', LichSuPhienBan: [] },
          { id: 'REQ-002', customer: 'VPIC Steel', colorCode: 'RAL-9005', surface: 'Thép tấm', status: 'processing', date: '11/05/2026', LichSuPhienBan: [] },
        ];
        setSampleRequests(defaultRequests);
        localStorage.setItem('sampleRequests', JSON.stringify(defaultRequests));
        
        const displayName = user?.profile?.HoTen || user?.profile?.TenKhachHang || user?.username || '';
        const myReqs = defaultRequests.filter((r: any) => 
          r.customer === displayName || 
          (r.customer && r.customer.toLowerCase() === displayName.toLowerCase())
        );
        if (myReqs.length > 0) {
          setSelectedSample(myReqs[0]);
        }
=======
      const parsed = dbRDList;
      
      // Find user display name
      const displayName = user?.profile?.HoTen || user?.profile?.TenKhachHang || user?.username || '';
      const myReqs = parsed.filter((r: any) =>
        r.customer === displayName ||
        (r.customer && r.customer.toLowerCase() === displayName.toLowerCase())
      );

      if (myReqs.length > 0) {
        setSelectedSample(myReqs[0]);
      } else {
        setSelectedSample(null);
>>>>>>> Stashed changes
      }
    }
  };

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
      const reqs = dbRDList;
      const foundRD = reqs.find((r: any) => r.id.toLowerCase() === trackingCode.toLowerCase());
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

  // Filter requests for the current customer
  const displayName = user?.profile?.HoTen || user?.profile?.TenKhachHang || user?.username || '';
  const customerRequests = dbRDList.filter(req => {
    const isMine = req.customer === displayName || (req.customer && req.customer.toLowerCase() === displayName.toLowerCase());
    const matchSearch = req.id.toLowerCase().includes(sampleSearchTerm.toLowerCase()) ||
                        req.colorCode.toLowerCase().includes(sampleSearchTerm.toLowerCase());
    return isMine && matchSearch;
  });

  return (
    <div className="max-w-[1300px] mx-auto px-4 py-8 animate-in fade-in duration-700">
      {/* ═══════ NAV TABS SECTION ═══════ */}
      <div className="flex justify-center mb-10">
        <div className="flex p-1.5 bg-slate-100 rounded-3xl border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setActiveTab('shipment')}
            className={`px-8 py-3.5 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-300 flex items-center gap-2.5 border-none cursor-pointer ${
              activeTab === 'shipment'
                ? 'bg-white text-blue-600 shadow-lg shadow-blue-100/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={18} />
            Theo dõi Đơn Hàng
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-8 py-3.5 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-300 flex items-center gap-2.5 border-none cursor-pointer ${
              activeTab === 'samples'
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
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 mb-8">
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

              {/* Timeline */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-2">
                {selectedTracking.steps.map((step, i) => {
                  const Icon = iconMap[step.label] || Package;
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 flex-1 relative text-center">
                      {/* Connector line */}
                      {i < selectedTracking.steps.length - 1 && (
                        <div className={`hidden md:block absolute top-5 left-1/2 w-full h-0.5 z-0 ${step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                      )}
                      {/* Dot */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center z-10 shadow-sm transition-all ${statusColors[step.status]}`}>
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
            </div>
          )}

          {/* Demo Cards */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-slate-900">Kiện Hàng Mới Nhất</h3>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Click để xem chi tiết lộ trình vận chuyển</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trackingData.map(t => {
                const currentStep = t.steps.find(s => s.status === 'current');
                const completedSteps = t.steps.filter(s => s.status === 'completed').length;
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
                      <QRCodeSVG value={`https://vtsc.vn/tracking/${t.code}`} size={70} bgColor="transparent" fgColor="#0f172a" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* ═══════ TAB 2: R&D MIXING REQUEST TRACKING ═══════ */}
      {activeTab === 'samples' && (
        <div className="space-y-8">
          {!isAuthenticated ? (
            /* ═══════ sleEK GLASSMORPHIC INLINE LOGIN CARD ═══════ */
            <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <FlaskConical size={26} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Theo dõi R&D Yêu cầu Mẫu</h3>
                <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                  Vui lòng đăng nhập tài khoản Khách hàng để theo dõi tiến trình pha chế mẻ thử và xem logs KCS phòng thí nghiệm.
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
            </div>
          ) : (
            /* ═══════ AUTHENTICATED R&D DASHBOARD ═══════ */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Your Sample Requests List */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm space-y-6">
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
                  <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl px-10 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 font-bold"
                      placeholder="Tìm theo Mã Yêu Cầu, Màu..."
                      value={sampleSearchTerm}
                      onChange={e => setSampleSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* List Container */}
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {customerRequests.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 font-medium italic text-sm">
                        Không tìm thấy yêu cầu pha chế nào.
                      </div>
                    ) : (
                      customerRequests.map(req => {
                        const isSelected = selectedSample?.id === req.id;
                        return (
                          <div
                            key={req.id}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50/50 border-purple-200'
                                : 'bg-white border-slate-100 hover:bg-slate-50'
                            }`}
                            onClick={() => setSelectedSample(req)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[12px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                {req.id}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{req.date}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm">{req.colorCode}</h4>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                              <span className="text-[11px] text-slate-400 font-medium">{req.surface}</span>
                              <span className={`status-badge text-[10px] font-black px-2 py-0.5 rounded-md ${
                                req.status === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : req.status === 'processing' 
                                    ? 'bg-orange-50 text-orange-600 animate-pulse' 
                                    : 'bg-amber-50 text-amber-600'
                              }`}>
                                {req.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Visual R&D Process Timeline Roadmap */}
              <div className="lg:col-span-2 space-y-6">
                {selectedSample ? (
                  <>
                    {/* Header Detail Card */}
                    <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl" />
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                              ID Yêu cầu: {selectedSample.id}
                            </span>
                            <span className={`status-badge text-xs font-black px-2.5 py-1 rounded-lg ${
                              selectedSample.status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : selectedSample.status === 'processing' 
                                  ? 'bg-orange-50 text-orange-600' 
                                  : 'bg-amber-50 text-amber-600'
                            }`}>
                              {selectedSample.status === 'approved' ? 'APPROVED KCS' : selectedSample.status.toUpperCase()}
                            </span>
                          </div>
                          <h2 className="text-2xl font-black text-slate-900 mt-3 mb-2">{selectedSample.colorCode}</h2>
                          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Ngày tạo: <span className="text-slate-800">{selectedSample.date}</span></span>
                            {selectedSample.deadline && (
                              <span className="flex items-center gap-1.5"><Clock size={14} /> Hạn R&D: <span className="text-rose-600 font-bold">{selectedSample.deadline}</span></span>
                            )}
                            <span className="flex items-center gap-1.5"><Layers size={14} /> Bề mặt: <span className="text-slate-800">{selectedSample.surface}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* interactive 5-Step Process Timeline */}
                    <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm space-y-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">Bản Đồ Lộ Trình Quy Trình Pha Chế Sơn</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Lịch trình pha chế R&D thời gian thực tương tác với phòng thí nghiệm</p>
                      </div>

                      {/* 5 Steps Render */}
                      <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {(() => {
                          const versions = selectedSample.LichSuPhienBan || [];
                          const hasVersions = versions.length > 0;
                          const isApproved = selectedSample.status === 'approved' || selectedSample.status === 'complete';
                          const hasPassed = versions.some((v: any) => v.result === 'pass') || isApproved;
                          const isProcessing = selectedSample.status === 'processing' || hasVersions;

                          const steps = [
                            {
                              label: 'Tiếp nhận yêu cầu R&D',
                              desc: 'Yêu cầu của bạn đã được tiếp nhận và ghi nhận thành công trên hệ thống VTSC PaintPro.',
                              status: 'completed', // always complete
                              time: selectedSample.date
                            },
                            {
                              label: 'Phân tích Lab & Hạt màu',
                              desc: 'Chuyên gia Lab VTSC đang phân tích đặc tính quang phổ hạt màu, độ bền và lựa chọn cấu trúc lớp nền.',
                              status: isProcessing ? 'completed' : 'current',
                              time: isProcessing ? selectedSample.date : null
                            },
                            {
                              label: 'Pha chế mẫu thử (Lab Mixing)',
                              desc: 'Hệ thống thiết bị R&D tiến hành pha chế các mẻ test định biên theo công thức tiêu chuẩn AkzoNobel.',
                              status: hasVersions ? (hasPassed ? 'completed' : 'current') : 'upcoming',
                              detail: hasVersions ? (
                                <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                                  <div className="text-[11px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <Beaker size={12} /> Nhật ký test của R&D Lab ({versions.length} phiên bản)
                                  </div>
                                  <div className="space-y-3">
                                    {versions.map((v: any, index: number) => (
                                      <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-2.5">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-black text-slate-800">Phiên bản {v.version}</span>
                                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                            v.result === 'pass' 
                                              ? 'bg-emerald-50 text-emerald-600' 
                                              : 'bg-rose-50 text-rose-600'
                                          }`}>
                                            {v.result === 'pass' ? 'ĐẠT CHUẨN KCS' : 'CHƯA ĐẠT - RE-TEST'}
                                          </span>
                                        </div>
                                        {v.parameters && (
                                          <div className="text-xs text-slate-500 font-medium">
                                            <strong>Thông số: </strong>{v.parameters}
                                          </div>
                                        )}
                                        {v.feedback && (
                                          <div className="text-xs text-slate-600 font-medium bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                            <strong>Phản hồi kỹ thuật: </strong>{v.feedback}
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-400">
                                          <span>Hao hụt: <strong className="text-slate-700">{(v.inputWeight && v.outputWeight) ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1) : '0.0'}%</strong></span>
                                          <span>Người test: <strong className="text-slate-700">{v.tester || 'Admin'}</strong></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null
                            },
                            {
                              label: 'Kiểm định KCS chất lượng',
                              desc: 'Mẫu sơn pha chế được test va đập vật lý, đo độ bóng bề mặt và sai lệch sai số màu Delta E.',
                              status: hasPassed ? (isApproved ? 'completed' : 'current') : 'upcoming'
                            },
                            {
                              label: 'Bàn giao mẫu thực tế & Duyệt',
                              desc: 'Khách hàng nhận mẫu màu thật, thử nghiệm thực tế tại công trình để phê duyệt sản xuất hàng loạt.',
                              status: isApproved ? 'completed' : 'upcoming'
                            }
                          ];

                          return steps.map((s, i) => {
                            const isComp = s.status === 'completed';
                            const isCurr = s.status === 'current';
                            return (
                              <div key={i} className="relative pl-10 group">
                                {/* Step Icon/Dot */}
                                <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-all ${
                                  isComp 
                                    ? 'bg-emerald-500 text-white' 
                                    : isCurr 
                                      ? 'bg-purple-600 text-white animate-pulse' 
                                      : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {isComp ? <CheckCircle2 size={16} /> : isCurr ? <Clock size={16} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                                </div>

                                {/* Step Card */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{s.label}</h4>
                                    {isCurr && (
                                      <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase tracking-wider">Đang Xử Lý</span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-xl">{s.desc}</p>
                                  {s.detail}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-24 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                    <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
                    <h4 className="font-bold text-slate-700">Chưa chọn yêu cầu pha chế</h4>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng chọn một mã yêu cầu ở danh sách bên trái để theo dõi</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
