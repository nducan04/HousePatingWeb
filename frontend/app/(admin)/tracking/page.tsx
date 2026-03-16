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

  return (
    <div>
      {/* Search Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 212, 255, 0.08))',
        borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-2xl)',
        marginBottom: 'var(--spacing-xl)', border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <Package size={48} style={{ color: 'var(--accent-purple)', margin: '0 auto var(--spacing-md)' }} />
        <h2 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginBottom: 8 }}>
          Tracking Kiện Hàng
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-lg)' }}>
          Nhập mã tracking hoặc quét mã QR để theo dõi hành trình giao nhận
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', maxWidth: 500, margin: '0 auto' }}>
          <div className="search-box" style={{ flex: 1, maxWidth: 'none' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="VD: VTSC-240601-001"
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ fontSize: 'var(--font-base)', padding: '14px 14px 14px 44px' }}
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleSearch}>
            Tra cứu
          </button>
        </div>
      </div>

      {/* Tracking Result */}
      {selectedTracking && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', animation: 'slideUp 300ms ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 8 }}>
                {selectedTracking.code}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                <span>Khách hàng: <strong style={{ color: 'var(--text-primary)' }}>{selectedTracking.customer}</strong></span>
                <span>Sản phẩm: <strong style={{ color: 'var(--text-primary)' }}>{selectedTracking.product}</strong></span>
                <span>Số lượng: <strong style={{ color: 'var(--accent-amber)' }}>{selectedTracking.quantity}</strong></span>
              </div>
            </div>
            <div className="qr-container">
              <QRCodeSVG
                value={`https://vtsc.vn/tracking/${selectedTracking.code}`}
                size={120}
                bgColor="#ffffff"
                fgColor="#0a0e27"
                level="H"
                includeMargin={false}
              />
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.6875rem', color: '#333' }}>
                {selectedTracking.code}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="tracking-timeline">
            {selectedTracking.steps.map((step, i) => {
              const Icon = iconMap[step.label] || Package;
              return (
                <div key={i} className={`tracking-step ${step.status}`}>
                  <div className="step-dot">
                    <Icon size={16} />
                  </div>
                  <span className="step-label">{step.label}</span>
                  {step.time && <span className="step-time">{step.time}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Demo QR Codes */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Mã QR Kiện hàng Gần đây</h3>
            <p className="section-subtitle">Click vào để xem chi tiết tracking</p>
          </div>
        </div>
        <div className="grid-2">
          {trackingData.map(t => {
            const currentStep = t.steps.find(s => s.status === 'current');
            const completedSteps = t.steps.filter(s => s.status === 'completed').length;
            const totalSteps = t.steps.length;
            return (
              <div key={t.code} className="glass-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }}
                onClick={() => { setSelectedTracking(t); setTrackingCode(t.code); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>{t.code}</div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{t.customer}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>{t.product}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--spacing-sm)' }}>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <div className="progress-fill" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{completedSteps}/{totalSteps}</span>
                    </div>
                    {currentStep && (
                      <span className="badge testing" style={{ marginTop: 8 }}>{currentStep.label}</span>
                    )}
                  </div>
                  <div className="qr-container" style={{ padding: 'var(--spacing-sm)' }}>
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
