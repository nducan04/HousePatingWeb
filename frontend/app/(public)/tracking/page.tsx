'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Package, CheckCircle2, Clock, Truck, MapPin } from 'lucide-react';
import { trackingData } from '@/lib/data/colors-data';

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<typeof trackingData[0] | null>(null);

  const handleSearch = () => {
    const found = trackingData.find(t => t.code.toLowerCase() === trackingCode.toLowerCase());
    if (found) {
      setSelectedTracking(found);
    } else if (trackingCode) {
      alert('Không tìm thấy mã tracking. Thử: VTSC-240601-001');
    }
  };

  const iconMap: Record<string, React.ElementType> = {
    'Đặt hàng': Package,
    'Sản xuất': Clock,
    'QC Pass': CheckCircle2,
    'Đang giao': Truck,
    'Đã nhận': MapPin,
  };

  const statusColors = {
    completed: 'bg-emerald-500 text-white',
    current: 'bg-amber-400 text-white animate-pulse',
    upcoming: 'bg-slate-200 text-slate-400',
  };

  return (
    <div>
      {/* Search Banner */}
      <div className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-2xl p-10 mb-8 border border-slate-200 text-center">
        <Package size={48} className="text-purple-600 mx-auto mb-4" />
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Tracking Kiện Hàng
        </h2>
        <p className="text-slate-500 text-lg mb-6">
          Nhập mã tracking hoặc quét mã QR để theo dõi hành trình giao nhận
        </p>
        <div className="flex gap-2.5 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              placeholder="VD: VTSC-240601-001"
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer border-none shadow-sm"
            onClick={handleSearch}
          >
            Tra cứu
          </button>
        </div>
      </div>

      {/* Tracking Result */}
      {selectedTracking && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-8 mb-8">
          <div className="flex justify-between items-start flex-wrap gap-6 mb-8">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
                {selectedTracking.code}
              </h3>
              <div className="flex flex-col gap-1 text-sm text-slate-500">
                <span>Khách hàng: <strong className="text-slate-800">{selectedTracking.customer}</strong></span>
                <span>Sản phẩm: <strong className="text-slate-800">{selectedTracking.product}</strong></span>
                <span>Số lượng: <strong className="text-amber-600">{selectedTracking.quantity}</strong></span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <QRCodeSVG
                value={`https://vtsc.vn/tracking/${selectedTracking.code}`}
                size={120}
                bgColor="#ffffff"
                fgColor="#0a0e27"
                level="H"
                includeMargin={false}
              />
              <div className="text-center mt-2 text-[11px] text-slate-500 font-mono">
                {selectedTracking.code}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between gap-2">
            {selectedTracking.steps.map((step, i) => {
              const Icon = iconMap[step.label] || Package;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
                  {/* Connector line */}
                  {i < selectedTracking.steps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 ${step.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                  {/* Dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${statusColors[step.status]}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{step.label}</span>
                  {step.time && <span className="text-[10px] text-slate-400">{step.time}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Demo QR Codes */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">Mã QR Kiện hàng Gần đây</h3>
          <p className="text-sm text-slate-400 mt-1">Click vào để xem chi tiết tracking</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackingData.map(t => {
            const currentStep = t.steps.find(s => s.status === 'current');
            const completedSteps = t.steps.filter(s => s.status === 'completed').length;
            const totalSteps = t.steps.length;
            return (
              <div
                key={t.code}
                className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 hover:border-blue-300"
                onClick={() => { setSelectedTracking(t); setTrackingCode(t.code); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-blue-600 mb-1">{t.code}</div>
                    <div className="text-sm text-slate-500">{t.customer}</div>
                    <div className="text-xs text-slate-400 mt-1">{t.product}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{completedSteps}/{totalSteps}</span>
                    </div>
                    {currentStep && (
                      <span className="inline-block mt-2 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">{currentStep.label}</span>
                    )}
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <QRCodeSVG value={`https://vtsc.vn/tracking/${t.code}`} size={80} bgColor="#ffffff" fgColor="#0a0e27" level="M" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
