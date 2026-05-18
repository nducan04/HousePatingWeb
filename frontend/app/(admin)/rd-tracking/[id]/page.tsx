'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Plus, PenTool, User,
  Calendar, Layers, MessageSquare, ImageIcon, Scale, AlertTriangle,
  Beaker, Trash2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { paintColors } from '@/lib/data/colors-data';

export default function RDDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuthStore();
  const router = useRouter();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [newVersion, setNewVersion] = useState({
    parameters: '',
    feedback: '',
    inputWeight: '',
    outputWeight: '',
    result: 'pending' as 'pass' | 'fail' | 'pending',
    components: [{ materialId: '', quantity: 0 }]
  });

  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMaterials();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/kho/nguyen-vat-lieu');
      if (res.data.success && res.data.data.length > 0) {
        const mapped = res.data.data.map((item: any) => ({
          id: item.MaNVL,
          name: item.TenNguyenVatLieu,
          category: item.PhanLoai || 'Resin',
          stock: item.TonKho || 0,
          unit: item.DonViTinh || 'kg',
          cost: item.DonGia || 0,
          supplier: item.NhaCungCap?.TenNCC || 'Local'
        }));
        setMaterials(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rdMaterials', JSON.stringify(mapped));
        }
        return;
      }
    } catch (error) {
      console.error('Failed to sync raw materials from DB in R&D Details:', error);
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rdMaterials');
      if (stored) {
        setMaterials(JSON.parse(stored));
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (id.startsWith('REQ-')) {
        // Load from localStorage
        if (typeof window !== 'undefined') {
          const storedRequests = localStorage.getItem('sampleRequests');
          if (storedRequests) {
            const requests = JSON.parse(storedRequests);
            const req = requests.find((r: any) => r.id === id);
            if (req) {
              setRequest({
                MaNhatKy: req.id,
                MaMauYeuCau: req.colorCode,
                TrangThai: req.status,
                LichSuPhienBan: req.LichSuPhienBan || [],
                updatedAt: new Date().toISOString(),
                ContractID: { title: req.customer, MaHopDong: 'N/A' },
                signedBy: req.signedBy,
                signedAt: req.signedAt,
                deadline: req.deadline
              });
              setIsSigned(req.status === 'approved');
            } else {
              setRequest(null);
            }
          }
        }
      } else {
        const res = await api.get(`/rd-tracking/${id}`);
        if (res.data.success) {
          const data = res.data.data;
          const fixedLichSu = (data.LichSuPhienBan || []).map((v: any) => ({
            ...v,
            tester: v.tester === 'Unknown Tester' || !v.tester ? ((user as any)?.name || 'Phi Binh Minh') : v.tester
          }));
          setRequest({ ...data, LichSuPhienBan: fixedLichSu });
          setIsSigned(data.TrangThai === 'approved' || data.TrangThai === 'complete');
        }
      }
    } catch (err) {
      console.error('Failed to fetch R&D details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVersion = async (result: 'pass' | 'fail' | 'pending') => {
    // Check if there is enough stock for each selected component
    if (typeof window !== 'undefined') {
      const storedMaterials = localStorage.getItem('rdMaterials');
      if (storedMaterials) {
        const materialsList = JSON.parse(storedMaterials);
        
        // Sum up quantities by materialId to handle potential duplicate selections
        const sumQuantities: { [key: string]: number } = {};
        for (const comp of newVersion.components) {
          if (!comp.materialId) continue;
          sumQuantities[comp.materialId] = (sumQuantities[comp.materialId] || 0) + parseFloat(comp.quantity as any || 0);
        }

        // Validate each material and collect deficient quantities
        const outOfStockList: string[] = [];
        for (const [materialId, reqQty] of Object.entries(sumQuantities)) {
          const mat = materialsList.find((m: any) => m.id === materialId);
          if (mat) {
            const currentStock = parseFloat(mat.stock || 0);
            if (reqQty > currentStock) {
              const deficit = reqQty - currentStock;
              outOfStockList.push(`${mat.id}:${deficit}`);
            }
          }
        }

        if (outOfStockList.length > 0) {
          alert(`❌ Hiện không còn đủ hàng trong kho vui lòng nhập thêm!\nHệ thống sẽ tự động chuyển hướng bạn sang trang Nhập Kho để lập phiếu nhập.`);
          const prefill = outOfStockList.join(",");
          router.push(`/kho?tab=nhapxuat&openNX=true&prefillMaterials=${prefill}`);
          return;
        }
      }
    }

    try {
      if (id.startsWith('REQ-')) {
        // Handle in localStorage
        if (typeof window !== 'undefined') {
          const storedRequests = localStorage.getItem('sampleRequests');
          if (storedRequests) {
            const requests = JSON.parse(storedRequests);
            const reqIndex = requests.findIndex((r: any) => r.id === id);
            if (reqIndex !== -1) {
              const req = requests[reqIndex];

              // Initialize LichSuPhienBan if it doesn't exist
              if (!req.LichSuPhienBan) {
                req.LichSuPhienBan = [];
              }

              const nextVer = `${req.LichSuPhienBan.length + 1}.0`;

              // Deduct stock
              const storedMaterials = localStorage.getItem('rdMaterials');
              if (storedMaterials) {
                const materialsList = JSON.parse(storedMaterials);
                newVersion.components.forEach((comp: any) => {
                  const matIndex = materialsList.findIndex((m: any) => m.id === comp.materialId);
                  if (matIndex !== -1) {
                    materialsList[matIndex].stock -= parseFloat(comp.quantity || 0);
                  }
                });
                localStorage.setItem('rdMaterials', JSON.stringify(materialsList));
                setMaterials(materialsList);
              }

              req.LichSuPhienBan.push({
                version: nextVer,
                date: new Date().toISOString(),
                result,
                parameters: newVersion.parameters,
                feedback: newVersion.feedback,
                inputWeight: parseFloat(newVersion.inputWeight) || 0,
                outputWeight: parseFloat(newVersion.outputWeight) || 0,
                tester: (user as any)?.name || 'Admin',
                testerCode: (user as any)?.MaNhanVien || 'N/A',
                components: newVersion.components
              });

              requests[reqIndex] = req;
              localStorage.setItem('sampleRequests', JSON.stringify(requests));

              // Update state to reflect changes
              setRequest({
                ...request,
                LichSuPhienBan: req.LichSuPhienBan
              });

              setShowAddVersion(false);
              setNewVersion({ parameters: '', feedback: '', inputWeight: '', outputWeight: '', result: 'pending', components: [{ materialId: '', quantity: 0 }] });
              alert('✅ Đã cập nhật phiên bản test mới và trừ tồn kho!');
              return;
            }
          }
        }
      } else {
        const res = await api.post(`/rd-tracking/${id}/versions`, {
          ...newVersion,
          result,
          tester: (user as any)?.name || 'Admin',
          testerCode: (user as any)?.MaNhanVien || 'N/A'
        });
        if (res.data.success) {
          // Deduct stock locally upon success to keep the inventory synced
          const storedMaterials = localStorage.getItem('rdMaterials');
          if (storedMaterials) {
            const materialsList = JSON.parse(storedMaterials);
            newVersion.components.forEach((comp: any) => {
              const matIndex = materialsList.findIndex((m: any) => m.id === comp.materialId);
              if (matIndex !== -1) {
                materialsList[matIndex].stock -= parseFloat(comp.quantity || 0);
              }
            });
            localStorage.setItem('rdMaterials', JSON.stringify(materialsList));
            setMaterials(materialsList);
          }

          setRequest(res.data.data);
          setShowAddVersion(false);
          setNewVersion({ parameters: '', feedback: '', inputWeight: '', outputWeight: '', result: 'pending', components: [{ materialId: '', quantity: 0 }] });
          alert('✅ Đã cập nhật phiên bản test mới!');
        }
      }
    } catch (err) {
      console.error('Failed to add version:', err);
      alert('❌ Lỗi khi thêm phiên bản mới');
    }
  };

  const handleSignKCS = async () => {
    try {
      if (id.startsWith('REQ-')) {
        // Handle in localStorage
        if (typeof window !== 'undefined') {
          const storedRequests = localStorage.getItem('sampleRequests');
          if (storedRequests) {
            const requests = JSON.parse(storedRequests);
            const reqIndex = requests.findIndex((r: any) => r.id === id);
            if (reqIndex !== -1) {
              const req = requests[reqIndex];
              req.status = 'approved';
              req.signedBy = (user as any)?.name || 'Admin';
              req.signedAt = new Date().toISOString();

              requests[reqIndex] = req;
              localStorage.setItem('sampleRequests', JSON.stringify(requests));

              setIsSigned(true);
              setRequest({
                ...request,
                TrangThai: 'approved',
                signedBy: req.signedBy,
                signedAt: req.signedAt
              });

              alert('✅ KCS Đã xác nhận đạt chuẩn. Hợp đồng đã chuyển sang trạng thái Đang giao hàng.');
              return;
            }
          }
        }
      } else {
        const res = await api.patch(`/rd-tracking/${id}/sign-kcs`);
        if (res.data.success) {
          setIsSigned(true);
          alert('✅ KCS Đã xác nhận đạt chuẩn. Hợp đồng đã chuyển sang trạng thái Đang giao hàng.');
          fetchData(); // Refresh UI
        }
      }
    } catch (err: any) {
      console.error('Failed to sign KCS:', err);
      alert(err.response?.data?.message || '❌ Lỗi khi ký duyệt KCS');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>Đang tải log R&D...</div>;

  if (!request) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem' }}>
        <h2>Không tìm thấy yêu cầu R&D "{id}"</h2>
        <Link href="/rd-tracking" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ marginTop: '1.75rem' }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const passCount = request.LichSuPhienBan.filter((v: any) => v.result === 'pass').length;
  const failCount = request.LichSuPhienBan.filter((v: any) => v.result === 'fail').length;
  const passRate = request.LichSuPhienBan.length > 0
    ? Math.round((passCount / request.LichSuPhienBan.length) * 100)
    : 0;

  // Wastage Calculation for New Version
  const calculatedWastage = (input: string, output: string) => {
    const i = parseFloat(input);
    const o = parseFloat(output);
    if (!i || !o || i === 0) return null;
    return (((i - o) / i) * 100).toFixed(2);
  };

  const colorInfo = paintColors.find(c => c.code === request.MaMauYeuCau);

  const isKCSManager = user?.role?.toLowerCase() === 'admin' || (user as any)?.name === 'Phi Binh Minh';

  const contract = request.ContractID || {};

  const isPastDeadline = request?.deadline ? new Date() > new Date(request.deadline) : false;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100 }}>
      <Link href="/rd-tracking" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ marginBottom: '1.75rem' }}>
        <ArrowLeft size={16} /> Quay lại Trace Log R&D
      </Link>

      {/* Header Card - Industrial Style */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem', marginBottom: '2.25rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '30%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${contract.colorHex || '#00d4ff'}15)`,
          zIndex: 0
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.125rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, letterSpacing: 1, fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                LOG ID: {request.MaNhatKy}
              </div>
              <span className={`badge ${request.TrangThai}`}>
                {request.TrangThai === 'approved' ? 'COMPLETED' : request.TrangThai.toUpperCase()}
              </span>
              {isSigned && (
                <span className="bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> ĐÃ KÝ DUYỆT
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>{request.MaMauYeuCau} {colorInfo ? `- ${colorInfo.name}` : ''}</h2>

            {colorInfo && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{colorInfo.category}</span>
                </div>
                <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Gloss:</span>
                  <span style={{ fontWeight: 600 }}>{colorInfo.gloss}</span>
                </div>
                <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Surface:</span>
                  <span style={{ fontWeight: 600 }}>{colorInfo.surface}</span>
                </div>
              </div>
            )}

            <p style={{ color: '#475569' }}>
              Hợp đồng gốc: <strong style={{ color: '#0f172a' }}>{contract.MaHopDong} - {contract.title}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: colorInfo?.hex || contract.colorHex || '#333', border: '3px solid rgba(255,255,255,0.1)',
              boxShadow: `0 0 20px ${colorInfo?.hex || contract.colorHex || '#00d4ff'}40`
            }} />
            <div>
              <div style={{ fontWeight: 800 }}>{request.MaMauYeuCau}</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>HEX: {colorInfo?.hex || 'MIX'}</div>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '2.25rem', marginTop: 30, paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">TỔNG MẺ TEST</div>
            <div className="stat-value">{request.LichSuPhienBan.length} <span className="stat-unit">Lô</span></div>
          </div>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">TỶ LỆ PASS</div>
            <div className="stat-value" style={{ color: passRate >= 70 ? '#059669' : '#e11d48' }}>
              {passRate}<span className="stat-unit">%</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">HAO HỤT B/Q</div>
            <div className="stat-value" style={{ color: '#d97706' }}>
              {(request.LichSuPhienBan.reduce((acc: number, cur: any) => acc + (cur.inputWeight > 0 ? (cur.inputWeight - cur.outputWeight) / cur.inputWeight * 100 : 0), 0) / (request.LichSuPhienBan.length || 1)).toFixed(1)}<span className="stat-unit">%</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">CẬP NHẬT</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{new Date(request.updatedAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </div>

      {/* Cảnh báo hết nguyên liệu */}
      {materials.some(m => m.stock <= 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600" />
          <div>
            <div className="text-sm font-bold text-amber-800">Cảnh báo: Hết nguyên vật liệu pha chế!</div>
            <div className="text-xs text-amber-600 mt-0.5">
              Các nguyên liệu sau đã hết hàng: {materials.filter(m => m.stock <= 0).map(m => m.name).join(', ')}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 30 }}>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hành trình Phân tích & Pha chế (R&D Timeline)</h3>
          <p className="text-sm text-slate-400 mt-1">Dữ liệu vòng lặp test được ghi nhận qua từng phiên bản</p>
        </div>
        {!isSigned && (
          <div className="flex items-center gap-3">
            {passCount > 0 && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> Đã có phiên bản đạt chuẩn
              </span>
            )}
            {isPastDeadline && (
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> Đã quá hạn pha chế ({new Date(request.deadline).toLocaleDateString('vi-VN')})
              </span>
            )}
            <button
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer border-none no-underline shadow-sm ${(passCount > 0 || isPastDeadline)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              onClick={() => { if (passCount === 0 && !isPastDeadline) setShowAddVersion(!showAddVersion); }}
              disabled={passCount > 0 || isPastDeadline}
            >
              <Plus size={14} /> Log Mẻ Test Mới
            </button>
          </div>
        )}
      </div>

      {/* Add Version Form - Advanced */}
      {showAddVersion && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">
              Nhật ký chi tiết phiên bản V{request.LichSuPhienBan.length + 1}.0
            </h4>
          </div>

          {/* Card Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột trái */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                  <Layers size={14} /> Thông số Kỹ thuật (Công thức, ĐK Nhiệt...)
                </label>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  rows={4}
                  placeholder="VD: Bột Interpon 15%, Nhiệt độ sấy 200°C, Thời gian 12p..."
                  value={newVersion.parameters}
                  onChange={e => setNewVersion(p => ({ ...p, parameters: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    <Scale size={14} /> Khối lượng Input
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="0.00"
                      value={newVersion.inputWeight}
                      onChange={e => setNewVersion(p => ({ ...p, inputWeight: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      kg
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    <Scale size={14} /> Khối lượng Output
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="0.00"
                      value={newVersion.outputWeight}
                      onChange={e => setNewVersion(p => ({ ...p, outputWeight: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Materials Selection */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    <Beaker size={14} /> Thành phần nguyên liệu sử dụng
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewVersion(p => ({ ...p, components: [...p.components, { materialId: '', quantity: 0 }] }))}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Thêm
                  </button>
                </div>

                {newVersion.components.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      value={comp.materialId}
                      onChange={e => {
                        const comps = [...newVersion.components];
                        comps[idx].materialId = e.target.value;
                        setNewVersion(p => ({ ...p, components: comps }));
                      }}
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (Còn: {m.stock} {m.unit})</option>
                      ))}
                    </select>

                    <div className="relative w-24">
                      <input
                        type="number"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-8"
                        placeholder="0"
                        value={comp.quantity}
                        onChange={e => {
                          const comps = [...newVersion.components];
                          comps[idx].quantity = parseFloat(e.target.value) || 0;
                          setNewVersion(p => ({ ...p, components: comps }));
                        }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">kg</span>
                    </div>

                    {newVersion.components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const comps = newVersion.components.filter((_, i) => i !== idx);
                          setNewVersion(p => ({ ...p, components: comps }));
                        }}
                        className="text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                  <MessageSquare size={14} /> Phản hồi độ lệch màu & Feedback
                </label>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  rows={4}
                  placeholder="VD: Độ lệch màu Delta E = 0.5, Cần thêm 2% bột bóng..."
                  value={newVersion.feedback}
                  onChange={e => setNewVersion(p => ({ ...p, feedback: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                  <ImageIcon size={14} /> Hình ảnh thực tế mẻ test
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all duration-300 flex flex-col items-center justify-center min-h-[110px]">
                  <ImageIcon size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs font-medium text-gray-500">
                    Nhấn hoặc kéo thả ảnh mẻ test vào đây (jpg, png)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            {/* Thống kê bên trái */}
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              Hao hụt tự động:
              <span className="px-2.5 py-1 bg-orange-100 text-orange-600 rounded-md text-xs font-black">
                {calculatedWastage(newVersion.inputWeight, newVersion.outputWeight) || '0.00'}%
              </span>
            </div>

            {/* Nút bấm bên phải */}
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowAddVersion(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                onClick={() => handleAddVersion('fail')}
              >
                BÁO LỖI (RE-TEST)
              </button>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                onClick={() => handleAddVersion('pass')}
              >
                <CheckCircle2 size={16} /> Xác nhận hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Vertical Timeline */}
      <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {[...request.LichSuPhienBan].reverse().map((v: any, i: number) => {
          const wastage = v.inputWeight && v.outputWeight
            ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1)
            : '0.0';

          return (
            <div key={i} className="relative pl-12 group">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-all duration-300 ${v.result === 'pass' ? 'bg-emerald-500 text-white' :
                v.result === 'fail' ? 'bg-rose-500 text-white' :
                  'bg-amber-500 text-white'
                }`}>
                {v.result === 'pass' ? <CheckCircle2 size={14} /> : v.result === 'fail' ? <XCircle size={14} /> : <Clock size={14} />}
              </div>

              {/* Timeline Card */}
              <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-black text-slate-900 tracking-tight">Phiên bản {v.version}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${v.result === 'pass' ? 'bg-emerald-50 text-emerald-600' :
                      v.result === 'fail' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                      {v.result === 'pass' ? 'ĐẠT CHUẨN KCS' : 'CHƯA ĐẠT - RE-TEST'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[12px] font-medium text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(v.date).toLocaleString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{v.tester}</span>
                      {v.testerCode && (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {v.testerCode}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Specs */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">⚙️ Thông số kỹ thuật</div>
                    <div className="text-[14px] text-slate-600 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-50 leading-relaxed">
                      {v.parameters}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Input: <span className="font-black">{v.inputWeight}kg</span>
                      </div>
                      <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Output: <span className="font-black">{v.outputWeight}kg</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${parseFloat(wastage) > 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        Hao hụt: <span className="font-black">{wastage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Feedback */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">💬 Phản hồi lệch màu</div>
                    <div className="text-[14px] text-slate-600 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-50 leading-relaxed">
                      {v.feedback}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-100 transition-all cursor-pointer shadow-sm">
                        <ImageIcon size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {request.LichSuPhienBan.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-[24px] shadow-sm">
            <Clock size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-medium">Hành trình R&D chưa bắt đầu. Hãy thêm phiên bản đầu tiên.</p>
          </div>
        )}
      </div>

      {/* Admin KCS Sign-off Section */}
      <div className={`mt-12 p-6 rounded-2xl border transition-all duration-300 ${isSigned
        ? 'bg-emerald-50/50 border-emerald-100'
        : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1.5">
              <PenTool size={20} className={isSigned ? "text-emerald-600" : "text-blue-600"} />
              Xác nhận khóa mẫu & Chuẩn KCS
            </h3>
            <p className="text-sm text-slate-500 max-w-2xl">
              Khi nhân viên R&D pha chế thành công (có phiên bản ĐẠT), Admin có quyền ký duyệt KCS để khóa công thức và bàn giao mẫu cho khách hàng.
            </p>
            {passCount > 0 && !isSigned && (
              <div className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Người pha chế thành công: <span className="font-bold">{request.LichSuPhienBan.find((v: any) => v.result === 'pass')?.tester}</span>
              </div>
            )}
          </div>

          <div>
            {!isSigned ? (
              <div className="text-right">
                <button
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm ${isKCSManager && passCount > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  disabled={!isKCSManager || passCount === 0}
                  onClick={handleSignKCS}
                  style={{ minWidth: 200 }}
                >
                  <PenTool size={16} /> Ký Duyệt KCS
                </button>
                {!isKCSManager && (
                  <p className="text-xs text-rose-600 mt-2 flex items-center justify-end gap-1 font-medium">
                    <AlertTriangle size={12} /> Bạn không có quyền ký duyệt mục này
                  </p>
                )}
                {isKCSManager && passCount === 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center justify-end gap-1 font-medium">
                    <AlertTriangle size={12} /> Cần ít nhất 1 phiên bản Đạt để ký duyệt
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="border-2 border-emerald-600 px-4 py-2 rounded-lg transform -rotate-3 bg-white shadow-sm">
                  <div className="text-emerald-600 font-black text-xl text-center">ĐÃ DUYỆT KCS</div>
                  <div className="text-[10px] text-slate-500 text-center uppercase font-bold">
                    Bởi: {request.signedBy} — {new Date(request.signedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline-container {
          position: relative;
          padding-left: 40px;
        }
        .timeline-container::before {
          content: '';
          position: absolute;
          left: 19px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #2563eb, rgba(0, 212, 255, 0.05));
        }
        .timeline-item {
          position: relative;
          margin-bottom: 40px;
        }
        .timeline-dot {
          position: absolute;
          left: -32px;
          top: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .timeline-dot.pass { border-color: #059669; color: #059669; box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        .timeline-dot.fail { border-color: #e11d48; color: #e11d48; }
        .timeline-dot.pending { border-color: #d97706; color: #d97706; }
        
        .timeline-card {
          padding: 0 !important;
          overflow: hidden;
          transition: transform 0.3s;
        }
        .timeline-card:hover {
          transform: translateX(5px);
          border-color: rgba(255,255,255,0.1);
        }
        
        .card-header-rd {
          padding: 16px 20px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .badge-rd {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .badge-rd.pass { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-rd.fail { background: rgba(244, 63, 94, 0.1); color: #e11d48; border: 1px solid rgba(244, 63, 94, 0.2); }
        
        .card-content-rd {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 20px;
          gap: 24px;
        }
        
        .rd-block-title {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .rd-block-text {
          font-size: 14px;
          color: #0f172a;
          line-height: 1.6;
        }
        
        .rd-mini-stat {
          font-size: 12px;
          color: #475569;
        }
        .rd-mini-stat strong { margin-left: 4px; color: #0f172a; }
        
        .rd-image-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .stat-label { font-size: 10px; font-weight: 800; color: #94a3b8; margin-bottom: 4px; }
        .stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .stat-unit { font-size: 12px; font-weight: 500; color: #94a3b8; margin-left: 4px; }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 20px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px #2563eb30; }
          100% { box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        }
      `}</style>
    </div>
  );
}
