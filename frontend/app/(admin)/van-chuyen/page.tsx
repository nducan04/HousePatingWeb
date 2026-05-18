'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/utils/axiosAuth';
import {
  Truck, Map, PackageCheck, AlertTriangle, Search, Eye, MapPin,
  ArrowLeft, Calendar, FileText, Phone, PhoneCall, Share2, Upload,
  CheckCircle2, Circle, Clock, Package, MoreHorizontal, User, Navigation, Building
} from 'lucide-react';

interface TrackingLog {
  ThoiGian: string;
  NoiDung: string;
  Status: 'COMPLETE' | 'PROCESSING' | 'PENDING';
  Icon?: string;
}

interface VanChuyen {
  _id: string;
  MaVanChuyen: string;
  DonHang: {
    _id: string;
    MaDonHang: string;
    DiaChiGiaoHang: string;
    GhiChu: string;
    KhachHang: {
      MaKH: string;
      TenKhachHang: string;
    };
  };
  LoHang: {
    SoKien: number;
    KhoiLuong: number;
    MauSon: string;
    BienBanFile?: string;
  };
  VanChuyenInfo: {
    DonVi: string;
    NhanVien: {
      _id: string;
      HoTen: string;
      SDT: string;
    } | null;
    SDT: string;
    PhiVC: number;
  };
  LoTrinh: TrackingLog[];
  TrangThaiTongQuat: string;
  DuKienBanGiao?: string;
  HinhAnhGiaoHang?: string[];
  createdAt: string;
}



export default function VanChuyenPage() {
  const [data, setData] = useState<VanChuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTracking, setSelectedTracking] = useState<VanChuyen | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/van-chuyen');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleShareLocation = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép liên kết theo dõi vào bộ nhớ tạm!');
  };

  const handleCallDriver = () => {
    const sdt = selectedTracking?.VanChuyenInfo?.NhanVien?.SDT || selectedTracking?.VanChuyenInfo?.SDT;
    if (sdt) {
      window.location.href = `tel:${sdt}`;
    } else {
      alert('Không tìm thấy số điện thoại tài xế');
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PHOTO' | 'RECEIPT') => {
    const file = e.target.files?.[0];
    if (!file || !selectedTracking) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await api.post('/files/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const fileUrl = uploadRes.data.url;
        let updatePayload: any = {};
        let newLog: TrackingLog = {
          ThoiGian: new Date().toISOString(),
          NoiDung: '',
          Status: 'COMPLETE',
          Icon: 'Camera'
        };

        if (type === 'PHOTO') {
          const updatedPhotos = [...(selectedTracking.HinhAnhGiaoHang || []), fileUrl];
          updatePayload.HinhAnhGiaoHang = updatedPhotos;
          newLog.NoiDung = 'Đã cập nhật ảnh bằng chứng giao hàng.';
        } else {
          updatePayload.BienBanFile = fileUrl;
          newLog.NoiDung = 'Đã tải lên biên bản bàn giao có chữ ký.';
        }

        const updatedLogs = [...selectedTracking.LoTrinh, newLog];
        updatePayload.LoTrinh = updatedLogs;

        const res = await api.patch(`/van-chuyen/${selectedTracking._id}`, updatePayload);
        if (res.data.success) {
          alert('Cập nhật thành công!');
          setSelectedTracking(res.data.data);
          fetchTrackingData();
        }
      }
    } catch (error) {
      console.error('Lỗi khi upload:', error);
      alert('Có lỗi xảy ra khi tải file');
    }
  };

  const handleConfirmSuccess = async () => {
    if (!selectedTracking) return;
    if (!confirm('Xác nhận đơn hàng đã được giao hàng thành công? Hệ thống sẽ tự động cập nhật trạng thái đơn hàng và ghi nhận công trạng cho tài xế.')) return;

    try {
      const updatePayload = {
        TrangThaiTongQuat: 'Giao hàng thành công',
        LoTrinh: [
          ...selectedTracking.LoTrinh,
          {
            ThoiGian: new Date().toISOString(),
            NoiDung: 'Đơn hàng đã được bàn giao thành công cho khách hàng.',
            Status: 'COMPLETE',
            Icon: 'CheckCircle'
          }
        ]
      };

      const res = await api.patch(`/van-chuyen/${selectedTracking._id}`, updatePayload);
      if (res.data.success) {
        alert('Đã xác nhận giao hàng thành công!');
        setSelectedTracking(res.data.data);
        fetchTrackingData();
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận giao hàng:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);

  const getReceiverPhone = (ghiChu: string) => {
    if (!ghiChu) return 'N/A';
    const match = ghiChu.match(/SĐT nhận:\s*([\d.\s]+)/);
    return match ? match[1].trim() : 'N/A';
  };

  const STATS = {
    total: data.length,
    delivering: data.filter(d => d.TrangThaiTongQuat === 'Đang giao hàng').length,
    delivered: data.filter(d => d.TrangThaiTongQuat === 'Giao hàng thành công').length,
    issues: 0,
  };

  const filteredData = data.filter(item => {
    const tenKH = item?.DonHang?.KhachHang?.TenKhachHang || '';
    const maVC = item?.MaVanChuyen || '';
    const maDH = item?.DonHang?.MaDonHang || '';

    const matchSearch = tenKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maVC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maDH.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 20 }}>
        <div className="spinner"></div>
        <div style={{ color: '#2563eb', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Đang tải dữ liệu vận chuyển...</div>
      </div>
    );
  }

  if (viewMode === 'DETAIL' && selectedTracking) {
    return (
      <div className="fade-in">
        {/* HEADER: Quay lại + Mã đơn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => setViewMode('LIST')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 18px', borderRadius: 8 }}
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
            THEO DÕI VẬN CHUYỂN ĐƠN HÀNG #{selectedTracking.DonHang?.MaDonHang || 'N/A'}
          </h2>
        </div>

        {/* Dynamic Status Flags */}
        {(() => {
          const isDelivered = selectedTracking.TrangThaiTongQuat === 'Giao hàng thành công';
          return (
            <>
              {/* TRẠNG THÁI TỔNG QUÁT */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24, marginBottom: 24, borderLeft: `4px solid ${isDelivered ? '#059669' : '#2563eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Trạng thái tổng quát:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${isDelivered ? 'approved' : 'testing'}`} style={{ fontSize: 16, padding: '6px 16px' }}>
                        {isDelivered ? '✅' : '🚚'} {selectedTracking.TrangThaiTongQuat}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 14 }}>
                        {isDelivered ? `Hoàn tất lúc: ${new Date().toLocaleTimeString()} - ${new Date().toLocaleDateString()}` : `Dự kiến bàn giao: ${selectedTracking.DuKienBanGiao ? new Date(selectedTracking.DuKienBanGiao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(selectedTracking.DuKienBanGiao).toLocaleDateString() : 'N/A'}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BẢN ĐỒ LỘ TRÌNH (Visual Dynamic) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 32, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <MapPin size={18} color="#e11d48" /> BẢN ĐỒ LỘ TRÌNH
                </div>

                <div style={{ position: 'relative', padding: '40px 0' }}>
                  {/* Linear Track Line */}
                  <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: 2, background: '#e2e8f0', transform: 'translateY(-50%)' }}></div>

                  {/* Active Track Line */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    width: isDelivered ? '80%' : '50%',
                    height: 2,
                    background: isDelivered ? '#059669' : '#2563eb',
                    transform: 'translateY(-50%)',
                    boxShadow: `0 0 10px ${isDelivered ? '#059669' : '#2563eb'}`,
                    transition: 'all 1s ease-in-out'
                  }}></div>

                  {/* Waypoints */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 10%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffffff', border: '2px solid #2563eb', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={20} color="#2563eb" />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>Xưởng Sơn</div>
                    </div>

                    <div style={{ textAlign: 'center', visibility: isDelivered ? 'hidden' : 'visible' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#2563eb', border: '4px solid rgba(0,212,255,0.2)', margin: '12px auto 26px' }}></div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {/* Current Vehicle Position */}
                      <div style={{
                        position: 'absolute',
                        left: isDelivered ? '90%' : '50%',
                        top: '50%',
                        transform: 'translate(-50%, -100%)',
                        marginBottom: 20,
                        transition: 'all 1s ease-in-out'
                      }}>
                        <div style={{
                          background: isDelivered ? '#059669' : '#2563eb',
                          color: 'black', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 8, whiteSpace: 'nowrap'
                        }}>
                          {isDelivered ? 'Đã bàn giao' : 'Đang di chuyển'}
                        </div>
                        <Truck size={32} color={isDelivered ? '#059669' : '#2563eb'} style={{ filter: `drop-shadow(0 0 12px ${isDelivered ? '#059669' : '#2563eb'})` }} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', visibility: isDelivered ? 'hidden' : 'visible' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffffff', border: '2px solid #e2e8f0', margin: '12px auto 26px' }}></div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: isDelivered ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                        border: `2px solid ${isDelivered ? '#059669' : '#e2e8f0'}`,
                        margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.5s ease'
                      }}>
                        {isDelivered ? <CheckCircle2 size={24} color="#059669" /> : <User size={20} color="#94a3b8" />}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isDelivered ? '#059669' : '#94a3b8' }}>{selectedTracking.DonHang?.KhachHang?.TenKhachHang || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                    {isDelivered ? 'Đơn hàng đã được giao nhận thành công. Cảm ơn quý khách!' : '(Giao diện bản đồ tích hợp Google Maps API hiển thị vị trí xe tải thực tế)'}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* INFO GRIDS: Section III & IV */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* III. CHI TIẾT LÔ HÀNG */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              III. CHI TIẾT LÔ HÀNG
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#94a3b8' }}>* Số kiện:</span>
                <span style={{ fontWeight: 600 }}>{selectedTracking.LoHang.SoKien} kiện (Đã đóng gói)</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#94a3b8' }}>* Khối lượng:</span>
                <span style={{ fontWeight: 600 }}>{selectedTracking.LoHang.KhoiLuong} kg</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#94a3b8' }}>* Màu sơn:</span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{selectedTracking.LoHang.MauSon} (Kiểm tra OK)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>* Biên bản bàn giao:</span>
                {selectedTracking.LoHang.BienBanFile ? (
                  <a
                    href={selectedTracking.LoHang.BienBanFile}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}
                  >
                    <FileText size={16} /> Xem File
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                )}
                <button
                  onClick={() => receiptInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                  style={{ fontSize: 11, padding: '4px 8px', marginLeft: 8 }}
                >
                  <Upload size={12} /> Tải lên
                </button>
              </div>
            </div>
          </div>

          {/* IV. THÔNG TIN VẬN CHUYỂN */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              IV. THÔNG TIN VẬN CHUYỂN
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#94a3b8' }}>* Đơn vị:</span>
                <span style={{ fontWeight: 600 }}>{selectedTracking.VanChuyenInfo.DonVi}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#475569' }}>* Tài xế:</span>
                <span style={{ fontWeight: 600 }}>{selectedTracking.VanChuyenInfo.NhanVien?.HoTen || 'Chưa phân công'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#475569' }}>* SĐT:</span>
                <span style={{ fontWeight: 600, color: '#d97706' }}>{selectedTracking.VanChuyenInfo.NhanVien?.SDT || selectedTracking.VanChuyenInfo.SDT || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#94a3b8' }}>* Phí VC:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{selectedTracking.VanChuyenInfo.PhiVC.toLocaleString()}đ (Đã bao gồm)</span>
              </div>
            </div>
          </div>
        </div>

        {/* VI. THÔNG TIN NGƯỜI NHẬN (NEW) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(to right, rgba(20, 25, 35, 0.8), rgba(30, 40, 55, 0.5))' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
            VI. CHI TIẾT PHIẾU GIAO (THÔNG TIN NGƯỜI NHẬN)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Người nhận hàng:</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedTracking.DonHang?.KhachHang?.TenKhachHang || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Số điện thoại:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#d97706' }}>{getReceiverPhone(selectedTracking.DonHang?.GhiChu || '')}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Địa chỉ bàn giao:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{selectedTracking.DonHang?.DiaChiGiaoHang || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* V. LỊCH SỬ LỘ TRÌNH (TIMELINE) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 32, marginBottom: 32 }}>
          <h4 style={{ margin: '0 0 24px 0', fontSize: 15, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 }}>
            V. LỊCH SỬ LỘ TRÌNH (TIMELINE)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Timeline Vertical Line */}
            <div style={{ position: 'absolute', left: 88, top: 12, bottom: 12, width: 2, background: '#e2e8f0' }}></div>

            {selectedTracking.LoTrinh.map((log, idx) => {
              const isComplete = log.Status === 'COMPLETE';
              const isProcessing = log.Status === 'PROCESSING';
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 32, position: 'relative' }}>
                  {/* Time */}
                  <div style={{ width: 70, textAlign: 'right', fontSize: 14, fontWeight: 700, color: isComplete ? '#0f172a' : '#94a3b8', paddingTop: 2 }}>
                    {log.ThoiGian ? new Date(log.ThoiGian).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>

                  {/* Dot Icon */}
                  <div style={{ zIndex: 2, background: '#ffffff', padding: '2px 0' }}>
                    {isComplete ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : isProcessing ? (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563eb', border: '4px solid rgba(0,212,255,0.2)' }}></div>
                    ) : (
                      <Circle size={18} color="#94a3b8" />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: (isComplete || isProcessing) ? 600 : 400, color: (isComplete || isProcessing) ? '#0f172a' : '#94a3b8' }}>
                      {log.NoiDung}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HÌNH ẢNH GIAO HÀNG (GALLERY) */}
          {selectedTracking.HinhAnhGiaoHang && selectedTracking.HinhAnhGiaoHang.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, fontWeight: 700, textTransform: 'uppercase' }}>
                📸 HÌNH ẢNH MINH CHỨNG GIAO HÀNG
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                {selectedTracking.HinhAnhGiaoHang.map((url, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 4, borderRadius: 8, overflow: 'hidden', height: 150 }}>
                    <img src={url} alt={`Evidence ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 32 }}>
          <button
            onClick={handleCallDriver}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e11d48', border: '1px solid #e11d48', padding: '12px 24px' }}
          >
            <PhoneCall size={20} /> Gọi Tài Xế
          </button>
          <button
            onClick={handleShareLocation}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', border: '1px solid #2563eb', padding: '12px 24px' }}
          >
            <Share2 size={20} /> Chia Sẻ Vị Trí
          </button>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 32px' }}
          >
            <Upload size={20} /> Cập Nhật Ảnh Giao Hàng
          </button>
          {selectedTracking.TrangThaiTongQuat !== 'Giao hàng thành công' && (
            <button
              onClick={handleConfirmSuccess}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 32px', background: '#059669', border: 'none' }}
            >
              <CheckCircle2 size={20} /> Xác nhận giao hàng thành công
            </button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={photoInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => handleUploadFile(e, 'PHOTO')}
        />
        <input
          type="file"
          ref={receiptInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleUploadFile(e, 'RECEIPT')}
        />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Map size={22} /></div>
          <div className="kpi-label">Tổng Chuyến Hàng</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Truck size={22} /></div>
          <div className="kpi-label">Đang Vận Chuyển</div>
          <div className="kpi-value">{STATS.delivering}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><PackageCheck size={22} /></div>
          <div className="kpi-label">Giao Thành Công</div>
          <div className="kpi-value">{STATS.delivered}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-label">Cảnh Báo Sự Cố Phát Sinh</div>
          <div className="kpi-value">{STATS.issues}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Tra cứu MVĐ, Đơn hàng, Tên khách..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Mã Vận Chuyển</th>
              <th>Bill Đơn Hàng</th>
              <th>Khách Hàng</th>
              <th>Hàng Hóa</th>
              <th>Tài Xế</th>
              <th>Trạng Thái Hiện Tại</th>
              <th>Ngày Tạo</th>
              <th style={{ textAlign: 'right' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaVanChuyen}</td>
                <td style={{ fontWeight: 600 }}>{item.DonHang?.MaDonHang || 'N/A'}</td>
                <td>{item.DonHang?.KhachHang?.TenKhachHang || 'N/A'}</td>
                <td>{item.LoHang.SoKien} kiện - {item.LoHang.KhoiLuong}kg</td>
                <td style={{ fontWeight: 600, color: '#d97706' }}>{item.VanChuyenInfo.NhanVien?.HoTen || 'Chưa phân công'}</td>
                <td>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                    {item.TrangThaiTongQuat}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setSelectedTracking(item);
                      setViewMode('DETAIL');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

