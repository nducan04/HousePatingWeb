'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Plus, PenTool, User,
  Calendar, Layers, MessageSquare, Image as ImageIcon, Scale, AlertTriangle,
  Beaker, Trash2, Package
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { paintColors } from '@/lib/data/colors-data';
import IpfsDropzone from '@/components/IpfsDropzone';

export default function RDDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuthStore();
  const router = useRouter();
  const isCustomer = user?.role === 'KhachHangB2B' || user?.role === 'KhachHangB2C';

  // Khách hàng B2B/B2C vẫn được phép xem trang chi tiết này, không redirect đi đâu cả.

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [testVolume, setTestVolume] = useState('');
  const [newVersion, setNewVersion] = useState({
    parameters: '',
    feedback: '',
    inputWeight: '',
    outputWeight: '',
    nhietDo: '',
    curingTime: '',
    maxHumidity: '',
    deltaE: '',
    hieuSuat: '',
    result: 'pending' as 'pass' | 'fail' | 'pending',
    components: [{ materialId: '', quantity: 0 }],
    imageCid: '',
    imageUrl: ''
  });

  const [isSigned, setIsSigned] = useState(false);
  const [showPackaging, setShowPackaging] = useState(false);
  const [packagingSpecs, setPackagingSpecs] = useState([{ containerType: 'Thùng 20L', quantity: 1, unitWeight: 20 }]);
  const [packagingMaterial, setPackagingMaterial] = useState('Thùng nhựa tiêu chuẩn AkzoNobel');

  useEffect(() => {
    fetchData();
    if (!isCustomer) {
      fetchMaterials();
      fetchFormulas();
    }
  }, [id, isCustomer]);

  const fetchFormulas = async () => {
    try {
      const res = await api.get('/formulas');
      if (res.data.success) {
        setFormulas(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch formulas:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/inventory/nguyen-vat-lieu');
      if (res.data.success && res.data.data.length > 0) {
        const mapped = res.data.data.map((item: any) => ({
          id: String(item._id),
          name: item.TenNguyenVatLieu || item.TenNVL,
          code: item.MaNVL,
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
      const res = await api.get(`/rd-tracking/${id}`);
      if (res.data.success) {
        const data = res.data.data;
        const fixedLichSu = (data.LichSuPhienBan || []).map((v: any) => ({
          ...v,
          tester: v.tester === 'Unknown Tester' || !v.tester ? ((user as any)?.name || 'Phi Binh Minh') : v.tester
        }));
        let customerName = data.ContractID?.title || data.customerName || 'Khách hàng';
        setRequest({ ...data, LichSuPhienBan: fixedLichSu, sampleCustomer: customerName });
        setIsSigned(data.TrangThai === 'approved' || data.TrangThai === 'complete');
      }
    } catch (err) {
      console.error('Failed to fetch R&D details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMaterials = (explicitFormulaId?: string) => {
    const fid = explicitFormulaId || selectedFormulaId;
    if (!fid) {
      alert('Vui lòng chọn Công thức tiêu chuẩn.');
      return;
    }
    const vol = parseFloat(testVolume);
    if (!vol || vol <= 0) {
      alert('Vui lòng nhập Thể tích/Khối lượng mẻ test hợp lệ.');
      return;
    }

    const formula = formulas.find(f => f._id === fid || f.MaCongThuc === fid);
    if (!formula) {
      alert('Không tìm thấy công thức.');
      return;
    }

    const sanLuongDuKien = formula.SanLuongDuKien || 20;
    
    let updatedParameters = newVersion.parameters;
    if (!updatedParameters && formula.GhiChu) {
      updatedParameters = formula.GhiChu;
    }

    const newComponents = formula.ThanhPhan.map((tp: any) => {
      const qty = (vol / sanLuongDuKien) * (tp.KhoiLuongDinhMuc || 0);
      return {
        materialId: String(tp.NguyenVatLieu?._id || tp.NguyenVatLieu || ''),
        quantity: parseFloat(qty.toFixed(3))
      };
    });

    setNewVersion(p => ({
      ...p,
      parameters: updatedParameters,
      components: newComponents.length > 0 ? newComponents : [{ materialId: '', quantity: 0 }]
    }));
    alert('✅ Đã đồng bộ nguyên vật liệu từ công thức thành công!');
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
        setNewVersion({ parameters: '', feedback: '', inputWeight: '', outputWeight: '', nhietDo: '', curingTime: '', maxHumidity: '', deltaE: '', hieuSuat: '', result: 'pending', components: [{ materialId: '', quantity: 0 }], imageCid: '', imageUrl: '' });
        alert('✅ Đã cập nhật phiên bản test mới!');
      }
    } catch (err: any) {
      console.error('Failed to add version:', err);
      alert(err.response?.data?.message || '❌ Lỗi khi thêm phiên bản mới');
    }
  };

  const handleSignKCS = async () => {
    try {
      const res = await api.patch(`/rd-tracking/${id}/sign-kcs`);
      if (res.data.success) {
        setIsSigned(true);
        alert('✅ KCS Đã xác nhận đạt chuẩn. Trạng thái đã được cập nhật.');
        fetchData(); // Refresh UI
      }
    } catch (err: any) {
      console.error('Failed to sign KCS:', err);
      alert(err.response?.data?.message || '❌ Lỗi khi ký duyệt KCS');
    }
  };

  const handleCreatePackaging = async () => {
    try {
      const specs = packagingSpecs.map(s => ({
        ...s,
        totalWeight: s.quantity * s.unitWeight
      }));
      const payload = {
        RDLogID: request.testMauId || request._id,
        ContractID: request.ContractID?._id || request.ContractID,
        PackagingSpecs: specs,
        PackagingMaterial: packagingMaterial,
        Notes: `Đóng gói tự động từ lô R&D ${request.MaNhatKy}`
      };
      const res = await api.post('/packaging', payload);
      if (res.data.success) {
        alert('✅ Đã tạo phiếu đóng gói thành công!\nHệ thống đã tự động xuất kho nguyên liệu và nhập kho thành phẩm.');
        router.push('/packaging');
      }
    } catch (err: any) {
      console.error('Failed to create packaging slip:', err);
      alert(err.response?.data?.message || '❌ Lỗi khi tạo phiếu đóng gói');
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

  const colorInfo = paintColors.find(c => c.code === request.MaMauYeuCau || c.name === request.MaMauYeuCau);

  const isKCSManager = user?.role?.toLowerCase() === 'admin' || (user as any)?.name === 'Phi Binh Minh';

  const contract = request.ContractID || {};

  const isPastDeadline = request?.deadline ? new Date() > new Date(request.deadline) : false;

  if (isCustomer) {
    let currentStep = 2; // Mặc định là bước 2
    if (request.LichSuPhienBan?.length > 0) currentStep = 3;
    if (request.TrangThai === 'kcs_passed') currentStep = 4;
    if (isSigned) currentStep = 5;
    if (request.TrangThai === 'approved' || request.TrangThai === 'complete') currentStep = 6;

    const timelineSteps = [
      { title: "Tiếp nhận yêu cầu R&D", desc: "Yêu cầu của bạn đã được tiếp nhận và ghi nhận thành công trên hệ thống VTSC PaintPro." },
      { title: "Phân tích Lab & Hạt màu", desc: "Chuyên gia Lab VTSC đang phân tích đặc tính quang phổ hạt màu, độ bền và lựa chọn cấu trúc lớp nền." },
      { title: "Pha chế mẫu thử (Lab Mixing)", desc: "Hệ thống thiết bị R&D tiến hành pha chế các mẻ test định biên theo công thức tiêu chuẩn AkzoNobel." },
      { title: "Kiểm định KCS chất lượng", desc: "Mẫu sơn pha chế được test va đập vật lý, đo độ bóng bề mặt và sai lệch sai số màu Delta E." },
      { title: "Bàn giao mẫu thực tế & Duyệt", desc: "Khách hàng nhận mẫu màu thật, thử nghiệm thực tế tại công trình để phê duyệt sản xuất hàng loạt." }
    ];

    return (
      <div className="max-w-5xl mx-auto py-10 px-4 md:px-8 animate-in fade-in duration-700">
        <button onClick={() => router.push('/theo-doi-don-hang?tab=samples')} className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:-translate-x-1 transition-all cursor-pointer shadow-sm">
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        {/* Card 1: Header Info */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full z-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                ID Yêu cầu: {request.MaNhatKy}
              </span>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${request.TrangThai === 'approved' || request.TrangThai === 'complete' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  request.TrangThai === 'processing' ? 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                {request.TrangThai === 'approved' ? 'COMPLETED' : request.TrangThai}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div 
                className="w-12 h-12 rounded-full border-4 border-white shadow-md shrink-0" 
                style={{ background: colorInfo?.hex || contract?.colorHex || (/^#[0-9A-F]{6}$/i.test(request.MaMauYeuCau) ? request.MaMauYeuCau : '#e2e8f0') }}
              />
              <h1 className="text-3xl md:text-[34px] font-black text-slate-900 tracking-tight m-0">{request.MaMauYeuCau}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-5 md:gap-8 text-[12px] font-bold text-slate-500">
              <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> Ngày tạo: <span className="text-slate-800">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span></div>
              <div className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> Hạn R&D: <span className="text-rose-600">{request.deadline ? new Date(request.deadline).toLocaleDateString('vi-VN') : 'N/A'}</span></div>
              <div className="flex items-center gap-2"><Layers size={14} className="text-slate-400" /> Bề mặt: <span className="text-slate-800">{contract.surface || request.surface || 'Thép tấm'}</span></div>
            </div>
          </div>
          {(request.imageUrl || request.sampleImageUrl) && (
            <div className="flex flex-col items-center gap-2 relative z-10 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm ml-auto">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">Ảnh mẫu y/c</span>
              <img src={request.imageUrl || request.sampleImageUrl} alt="Mẫu Yêu Cầu" className="w-[88px] h-[88px] object-cover rounded-xl border border-slate-100 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(request.imageUrl || request.sampleImageUrl, '_blank')} />
            </div>
          )}
        </div>

        {/* Card 2: Timeline */}
        <div className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-10 border-b border-slate-50 pb-6">
            <h2 className="text-[22px] font-black text-slate-900 mb-2 tracking-tight">Tiến Độ Quy Trình Pha Chế Sơn </h2>
            <p className="text-[13px] font-medium text-slate-500">Lịch trình pha chế R&D thời gian thực tương tác với phòng thí nghiệm</p>
          </div>

          <div className="relative pl-2 md:pl-6 max-w-3xl">
            <div className="absolute left-[24px] md:left-[44px] top-6 bottom-10 w-[2px] bg-slate-100 rounded-full"></div>

            <div className="space-y-12 relative">
              {timelineSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const isPending = stepNum > currentStep;

                return (
                  <div key={idx} className="flex items-start gap-5 md:gap-8 relative group">
                    <div className="relative z-10 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 duration-300">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-white">
                          <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 ring-4 ring-purple-50">
                          <Clock size={18} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-100 flex items-center justify-center text-[13px] font-black ring-4 ring-white shadow-sm">
                          {stepNum}
                        </div>
                      )}
                    </div>

                    <div className={`flex-1 pt-1 ${isPending ? 'opacity-50' : ''} transition-opacity duration-300`}>
                      <div className="flex flex-wrap items-center gap-3 mb-2.5">
                        <h3 className={`text-[15px] font-black tracking-tight ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 shadow-sm">
                            Đang xử lý
                          </span>
                        )}
                      </div>
                      <p className={`text-[13px] font-medium leading-relaxed max-w-xl ${isCurrent ? 'text-slate-600' : 'text-slate-400'}`}>
                        {step.desc}
                      </p>
                      {stepNum === 3 && request.LichSuPhienBan?.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                          <div className="text-[11px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Beaker size={12} /> Nhật ký test của R&D Lab ({request.LichSuPhienBan.length} phiên bản)
                          </div>
                          <div className="space-y-3">
                            {request.LichSuPhienBan.map((v: any, index: number) => (
                              <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-slate-800">Phiên bản {v.version}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${v.result === 'pass'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-rose-50 text-rose-600'
                                    }`}>
                                    {v.result === 'pass' ? 'ĐẠT CHUẨN KCS' : 'CHƯA ĐẠT - RE-TEST'}
                                  </span>
                                </div>
                                {v.parameters && (
                                  <div className="text-[12px] text-slate-600 font-medium">
                                    <strong>Thông số: </strong>{v.parameters}
                                  </div>
                                )}
                                
                                {v.feedback && (
                                  <div className="text-[12px] text-slate-600 font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                    <strong>Phản hồi kỹ thuật: </strong>{v.feedback}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    Input: <span className="font-black">{v.inputWeight || 0} kg</span>
                                  </div>
                                  <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    Output: <span className="font-black">{v.outputWeight || 0} kg</span>
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${parseFloat(v.inputWeight && v.outputWeight ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1) : '0') > 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    Hao hụt: <span className="font-black">{(v.inputWeight && v.outputWeight) ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1) : '0.0'}%</span>
                                  </div>
                                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    Nhiệt độ: <span className="font-black">{v.nhietDo || 195}°C</span>
                                  </div>
                                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    TG Sấy: <span className="font-black">{v.curingTime || 15}p</span>
                                  </div>
                                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    Độ ẩm max: <span className="font-black">{v.maxHumidity || 80}%</span>
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${parseFloat(v.deltaE) > 0.8 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    Delta E: <span className="font-black">{v.deltaE || 0}</span>
                                  </div>
                                  <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    Hiệu suất: <span className="font-black">{v.hieuSuat || 98}%</span>
                                  </div>
                                </div>

                                {v.components && v.components.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                      <Layers size={12} /> Nguyên liệu sử dụng
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {v.components.map((comp: any, cIdx: number) => {
                                        const mat = materials.find((m: any) => m.id === comp.materialId);
                                        return (
                                          <span key={cIdx} className="bg-slate-50 text-slate-700 border border-slate-100 px-2.5 py-1 rounded-xl text-[12px] font-bold">
                                            {mat ? mat.name : comp.materialId}: <span className="font-black text-blue-600">{comp.quantity}</span> {mat?.unit || 'kg'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {v.imageUrl && (
                                  <div className="mt-3">
                                    <img
                                      src={v.imageUrl}
                                      alt={`Ảnh mẻ test ${v.version}`}
                                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                      onClick={() => window.open(v.imageUrl, '_blank')}
                                    />
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 ml-1">Ảnh mẻ test</div>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-400 mt-2 border-t border-slate-50 pt-3">
                                  <span>Người test: <strong className="text-slate-700">{v.tester || 'Admin'}</strong></span>
                                  {v.date && <span>Thời gian: <strong className="text-slate-700">{new Date(v.date).toLocaleString('vi-VN')}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <span className={`badge ${request.TrangThai || 'pending'}`}>
                {(request.TrangThai || 'pending') === 'approved' ? 'COMPLETED' : (request.TrangThai || 'pending').toUpperCase()}
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
              {contract.MaHopDong ? (
                <>Hợp đồng gốc: <strong style={{ color: '#0f172a' }}>{contract.MaHopDong} - {contract.title}</strong></>
              ) : (
                <>Khách hàng yêu cầu: <strong style={{ color: '#0f172a' }}>{request.sampleCustomer || 'Khách hàng ngoài'}</strong></>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {(request.imageUrl || request.sampleImageUrl) && (
              <div className="flex flex-col items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh mẫu y/c</span>
                <img
                  src={request.imageUrl || request.sampleImageUrl}
                  alt="Ảnh mẫu khách gửi"
                  className="w-16 h-16 object-cover rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(request.imageUrl || request.sampleImageUrl, '_blank')}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: request.MaMauYeuCau?.startsWith('#') ? request.MaMauYeuCau : (colorInfo?.hex || contract?.colorHex || '#333'), border: '3px solid rgba(255,255,255,0.1)',
                boxShadow: `0 0 20px ${request.MaMauYeuCau?.startsWith('#') ? request.MaMauYeuCau : (colorInfo?.hex || contract?.colorHex || '#00d4ff')}40`
              }} />
              <div>
                <div style={{ fontWeight: 800 }}>{request.MaMauYeuCau}</div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>HEX: {request.MaMauYeuCau?.startsWith('#') ? request.MaMauYeuCau : (colorInfo?.hex || contract?.colorHex || 'MIX')}</div>
              </div>
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
            {(() => {
              const avgWastage = parseFloat((request.LichSuPhienBan.reduce((acc: number, cur: any) => acc + (cur.inputWeight > 0 ? (cur.inputWeight - cur.outputWeight) / cur.inputWeight * 100 : 0), 0) / (request.LichSuPhienBan.length || 1)).toFixed(1));
              const isHighWastage = avgWastage > 5;
              return (
                <>
                  <div className="stat-value" style={{ color: isHighWastage ? '#e11d48' : '#d97706' }}>
                    {avgWastage}<span className="stat-unit">%</span>
                  </div>
                  {isHighWastage && (
                    <div className="text-[11px] font-black text-rose-600 mt-1 uppercase flex items-center gap-0.5 animate-pulse">
                      <AlertTriangle size={11} className="inline" /> Hiệu suất kém
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">CẬP NHẬT</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{new Date(request.updatedAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </div>

      {/* Thông số kỹ thuật đặc thù (Technical Specs) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Layers size={18} className="text-purple-600" />
          <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
            Thông số Kỹ thuật Pha chế Sơn Tĩnh Điện
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Môi trường sử dụng</div>
            <div className="text-[14px] font-semibold text-slate-800">{request.environmentType || 'N/A'}</div>
          </div>
          <div className="space-y-1 col-span-2 md:col-span-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu chi tiết / Khác</div>
            <div className="text-[14px] font-medium text-slate-600 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {request.requirements || 'Không có ghi chú thêm.'}
            </div>
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
        {!isSigned && !isCustomer && (
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
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-blue-600" />
                  <span className="font-bold text-sm text-slate-800">Đồng bộ từ Công thức tiêu chuẩn</span>
                </div>
                
                {(() => {
                  const matchingFormula = formulas.find(f => 
                    f.MaMau === request?.MaMauYeuCau || 
                    f.MaMau === request?.MaMauYeuCau?.split('-')[0] || 
                    f.TenCongThuc?.includes(request?.MaMauYeuCau)
                  );
                  
                  if (!matchingFormula) {
                    return (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>Chưa có công thức tiêu chuẩn cho mã màu <strong>{request?.MaMauYeuCau}</strong>. Vui lòng tạo công thức trước.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-gray-500">Công thức nhận diện tự động</label>
                        <div className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 flex items-center justify-between shadow-sm">
                          <span className="font-medium truncate mr-2 text-blue-800">{matchingFormula.TenCongThuc}</span>
                          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">{matchingFormula.MaCongThuc}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-gray-500">Thể tích/Khối lượng pha test</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                              placeholder={`VD: ${matchingFormula.SanLuongDuKien || 20}`}
                              value={testVolume}
                              onChange={e => setTestVolume(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                              {matchingFormula.DonVi || 'Lít'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFormulaId(matchingFormula._id);
                              handleSyncMaterials(matchingFormula._id);
                            }}
                            className="whitespace-nowrap px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
                          >
                            Đồng bộ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

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
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      kg
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    🔥 Nhiệt độ sấy
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="VD: 195"
                      value={newVersion.nhietDo}
                      onChange={e => setNewVersion(p => ({ ...p, nhietDo: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      °C
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    ⏱ Thời gian sấy
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="VD: 15"
                      value={newVersion.curingTime}
                      onChange={e => setNewVersion(p => ({ ...p, curingTime: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      phút
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    💧 Độ ẩm tối đa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="VD: 80"
                      value={newVersion.maxHumidity}
                      onChange={e => setNewVersion(p => ({ ...p, maxHumidity: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      %
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    🎨 Độ lệch màu (Delta E)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full bg-white border ${parseFloat(newVersion.deltaE) > 0.8 ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 transition-all pr-12`}
                      placeholder="VD: 0.5"
                      value={newVersion.deltaE}
                      onChange={e => setNewVersion(p => ({ ...p, deltaE: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      ΔE
                    </div>
                  </div>
                  {parseFloat(newVersion.deltaE) > 0.8 && (
                    <div className="text-[10px] font-bold text-rose-600 animate-pulse mt-1">
                      ⚠️ Delta E {'>'} 0.8: Không đạt chuẩn
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 flex items-center gap-2">
                    📈 Hiệu suất bám dính
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                      placeholder="VD: 98"
                      value={newVersion.hieuSuat}
                      onChange={e => setNewVersion(p => ({ ...p, hieuSuat: e.target.value }))}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium pointer-events-none">
                      %
                    </div>
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
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                        {materials.find(m => m.id === comp.materialId)?.unit || 'kg'}
                      </span>
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
                <IpfsDropzone
                  size="small"
                  onCidChange={(cid) => {
                    setNewVersion(prev => ({
                      ...prev,
                      imageCid: cid,
                      imageUrl: cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : ''
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            {/* Thống kê bên trái */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                Hao hụt tự động:
                <span className="px-2.5 py-1 bg-orange-100 text-orange-600 rounded-md text-xs font-black">
                  {calculatedWastage(newVersion.inputWeight, newVersion.outputWeight) || '0.00'}%
                </span>
              </div>
              {parseFloat(calculatedWastage(newVersion.inputWeight, newVersion.outputWeight) || '0') > 5 && (
                <div className="text-xs text-rose-600 font-black flex items-center gap-1">
                  <AlertTriangle size={12} /> Cảnh báo: Hao hụt vượt quá 5% - Hiệu suất kém
                </div>
              )}
              {parseFloat(newVersion.deltaE) > 0.8 && (
                <div className="text-xs text-rose-600 font-black flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                  <XCircle size={12} /> Delta E = {newVersion.deltaE} (Vượt chuẩn 0.8) - Yêu cầu Re-Test
                </div>
              )}
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
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                onClick={() => handleAddVersion('fail')}
              >
                <XCircle size={16} /> BÁO LỖI (RE-TEST)
              </button>

              {(!newVersion.deltaE || parseFloat(newVersion.deltaE) <= 0.8) && (
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                  onClick={() => handleAddVersion('pass')}
                >
                  <CheckCircle2 size={16} /> Xác nhận hoàn thành
                </button>
              )}
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
                        Input: <span className="font-black">{v.inputWeight} kg</span>
                      </div>
                      <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Output: <span className="font-black">{v.outputWeight} kg</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${parseFloat(wastage) > 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        Hao hụt: <span className="font-black">{wastage}%</span>
                        {parseFloat(wastage) > 5 && (
                          <span className="ml-2 text-[10px] font-black text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded border border-rose-200">HIỆU SUẤT KÉM</span>
                        )}
                      </div>
                      <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Nhiệt độ: <span className="font-black">{v.nhietDo || 195}°C</span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        TG Sấy: <span className="font-black">{v.curingTime || 15}p</span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Độ ẩm max: <span className="font-black">{v.maxHumidity || 80}%</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[12px] font-bold ${parseFloat(v.deltaE) > 0.8 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        Delta E: <span className="font-black">{v.deltaE || 0}</span>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                        Hiệu suất: <span className="font-black">{v.hieuSuat || 98}%</span>
                      </div>
                    </div>

                    {v.components && v.components.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 flex items-center gap-1.5">
                          <Beaker size={12} /> Nguyên liệu sử dụng
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {v.components.map((comp: any, cIdx: number) => {
                            const mat = materials.find(m => m.id === comp.materialId);
                            return (
                              <span key={cIdx} className="bg-slate-100 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-xl text-[12px] font-bold">
                                {mat ? mat.name : comp.materialId}: <span className="font-black text-blue-600">{comp.quantity}</span> {mat?.unit || 'kg'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Feedback */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">💬 Phản hồi lệch màu</div>
                    <div className="text-[14px] text-slate-600 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-50 leading-relaxed">
                      {v.feedback}
                    </div>

                    <div className="flex gap-2 mt-2">
                      {v.imageUrl ? (
                        <div className="flex flex-col gap-1 items-start">
                          <img
                            src={v.imageUrl}
                            alt={`Mẻ test ${v.version}`}
                            className="w-20 h-20 object-cover rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(v.imageUrl, '_blank')}
                          />
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Ảnh mẻ test</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-100 transition-all cursor-pointer shadow-sm">
                          <ImageIcon size={20} />
                        </div>
                      )}
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

      {/* Packaging Section (Only visible if signed/approved and part of a contract) */}
      {isSigned && !isCustomer && request.ContractID && (
        <div className="mt-8 p-6 rounded-2xl bg-blue-50/50 border border-blue-100 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 mb-1.5">
                <Package size={20} className="text-blue-600" />
                Lệnh Đóng Gói Thành Phẩm
              </h3>
              <p className="text-sm text-blue-600/80">
                Sơn đã đạt chuẩn KCS. Vui lòng thiết lập quy cách đóng gói để nhập kho thành phẩm.
              </p>
            </div>
            <button
              onClick={() => setShowPackaging(!showPackaging)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Tạo Phiếu Đóng Gói
            </button>
          </div>

          {showPackaging && (
            <div className="bg-white p-6 rounded-xl border border-blue-100 mt-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-700">Quy cách san chiết</label>
                  <button
                    type="button"
                    onClick={() => setPackagingSpecs([...packagingSpecs, { containerType: 'Lon 5L', quantity: 1, unitWeight: 5 }])}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Thêm loại bao bì
                  </button>
                </div>
                
                {packagingSpecs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                      placeholder="Loại bao bì (VD: Thùng 20L)"
                      value={spec.containerType}
                      onChange={e => {
                        const newSpecs = [...packagingSpecs];
                        newSpecs[idx].containerType = e.target.value;
                        setPackagingSpecs(newSpecs);
                      }}
                    />
                    <div className="relative w-32">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 pr-8"
                        placeholder="Số lượng"
                        value={spec.quantity}
                        onChange={e => {
                          const newSpecs = [...packagingSpecs];
                          newSpecs[idx].quantity = parseFloat(e.target.value) || 0;
                          setPackagingSpecs(newSpecs);
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {(() => {
                          const t = (spec.containerType || '').toLowerCase();
                          if (t.includes('thùng')) return 'thùng';
                          if (t.includes('lon')) return 'lon';
                          if (t.includes('can')) return 'can';
                          if (t.includes('hộp')) return 'hộp';
                          return 'cái';
                        })()}
                      </span>
                    </div>
                    <div className="relative w-32">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 pr-8"
                        placeholder="Khối lượng"
                        value={spec.unitWeight}
                        onChange={e => {
                          const newSpecs = [...packagingSpecs];
                          newSpecs[idx].unitWeight = parseFloat(e.target.value) || 0;
                          setPackagingSpecs(newSpecs);
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {(() => {
                          const t = (spec.containerType || '').toLowerCase();
                          if (t.includes('lít') || /\d+\s*l\b/.test(t)) return 'Lít';
                          if (t.includes('ml')) return 'ml';
                          if (t.includes('gram') || /\d+\s*g\b/.test(t)) return 'g';
                          return 'kg';
                        })()}
                      </span>
                    </div>
                    <div className="w-24 text-right text-sm font-bold text-slate-600">
                      = {spec.quantity * spec.unitWeight} {(() => {
                        const t = (spec.containerType || '').toLowerCase();
                        if (t.includes('lít') || /\d+\s*l\b/.test(t)) return 'Lít';
                        if (t.includes('ml')) return 'ml';
                        if (t.includes('gram') || /\d+\s*g\b/.test(t)) return 'g';
                        return 'kg';
                      })()}
                    </div>
                    {packagingSpecs.length > 1 && (
                      <button
                        onClick={() => {
                          const newSpecs = packagingSpecs.filter((_, i) => i !== idx);
                          setPackagingSpecs(newSpecs);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">Chất liệu bao bì</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  value={packagingMaterial}
                  onChange={e => setPackagingMaterial(e.target.value)}
                  placeholder="VD: Thùng nhựa tiêu chuẩn AkzoNobel"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-sm">
                  Tổng lượng thành phẩm: <span className="font-black text-blue-600 text-lg ml-1">
                    {packagingSpecs.reduce((sum, s) => sum + (s.quantity * s.unitWeight), 0)} {(() => {
                      const firstT = packagingSpecs.length > 0 ? (packagingSpecs[0].containerType || '').toLowerCase() : '';
                      if (firstT.includes('lít') || /\d+\s*l\b/.test(firstT)) return 'Lít';
                      if (firstT.includes('ml')) return 'ml';
                      if (firstT.includes('gram') || /\d+\s*g\b/.test(firstT)) return 'g';
                      return 'kg';
                    })()}
                  </span>
                </div>
                <button
                  onClick={handleCreatePackaging}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Package size={16} /> Chốt Đóng Gói & Nhập Kho
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
