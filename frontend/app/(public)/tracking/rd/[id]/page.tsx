'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock, Beaker, CheckCircle2, ArrowLeft, Calendar, Layers
} from 'lucide-react';
import { toast } from '@/lib/utils/notification';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

export default function RDTrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [selectedSample, setSelectedSample] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRequest(id);
    }
  }, [id, user]);

  const loadRequest = async (code: string) => {
    setLoading(true);
<<<<<<< Updated upstream
    // 1. First check local storage (mock data)
    const stored = localStorage.getItem('sampleRequests');
    if (stored) {
      const localReqs = JSON.parse(stored);
      const foundRD = localReqs.find((r: any) => r.id.toLowerCase() === code.toLowerCase());
      if (foundRD) {
        setSelectedSample(foundRD);
        setLoading(false);
        return;
=======
    
    // 1. Nếu là dạng mock từ localStorage (bắt đầu bằng REQ-)
    if (code.startsWith('REQ-')) {
      if (typeof window !== 'undefined') {
        const storedRequests = localStorage.getItem('sampleRequests');
        if (storedRequests) {
          const requests = JSON.parse(storedRequests);
          const req = requests.find((r: any) => r.id === code);
          if (req) {
            setSelectedSample({
              id: req.id,
              customer: req.customer,
              colorCode: req.colorCode,
              surface: req.surface || 'Kim loại',
              status: req.status || 'pending',
              deadline: req.deadline,
              date: req.date,
              LichSuPhienBan: req.LichSuPhienBan || [],
              signedBy: req.signedBy,
              signedAt: req.signedAt,
              imageUrl: req.imageUrl
            });
            setLoading(false);
            return;
          }
        }
>>>>>>> Stashed changes
      }
    }

    // 2. Fetch from DB
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
            toast.error('Bạn không có quyền truy cập dữ liệu pha chế này.');
            router.push('/tracking?tab=samples');
            return;
          }
        }
        
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
      } else {
        toast.error('Không tìm thấy dữ liệu yêu cầu.');
      }
    } catch (e) {
      console.error('Failed to load R&D from DB:', e);
      toast.error('Không tìm thấy mã nhật ký R&D.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1300px] mx-auto px-4 py-20 text-center text-slate-500 font-medium">
        Đang tải dữ liệu lộ trình...
      </div>
    );
  }

  if (!selectedSample) {
    return (
      <div className="max-w-[1300px] mx-auto px-4 py-20 text-center">
        <h3 className="text-xl font-bold text-slate-900">Không tìm thấy yêu cầu</h3>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 relative">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 mb-8 rounded-2xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <div className="space-y-6">
        {/* Header Detail Card */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                  ID Yêu cầu: {selectedSample.id}
                </span>
                <span className={`status-badge text-xs font-black px-2.5 py-1 rounded-lg ${selectedSample.status === 'approved'
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
            {selectedSample.imageUrl && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh mẫu y/c</span>
                <img 
                  src={selectedSample.imageUrl} 
                  alt="Ảnh mẫu khách gửi" 
                  className="w-16 h-16 object-cover rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(selectedSample.imageUrl, '_blank')}
                />
              </div>
            )}
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
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${v.result === 'pass'
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
                            {v.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={v.imageUrl} 
                                  alt={`Ảnh mẻ test ${v.version}`} 
                                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => window.open(v.imageUrl, '_blank')}
                                />
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
                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-all ${isComp
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
      </div>
    </div>
  );
}
