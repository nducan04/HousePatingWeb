'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Plus, PenTool, User, Calendar } from 'lucide-react';
import { rdRequests, type TestVersion } from '@/lib/data/rd-data';

export default function RDDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const request = rdRequests.find(r => r.id === id);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ parameters: '', feedback: '', result: 'pending' as const });
  const [isSigned, setIsSigned] = useState(!!request?.signedBy);

  if (!request) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
        <h2>Không tìm thấy yêu cầu R&D "{id}"</h2>
        <Link href="/rd-tracking" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const passCount = request.versions.filter(v => v.result === 'pass').length;
  const failCount = request.versions.filter(v => v.result === 'fail').length;
  const passRate = request.versions.length > 0 
    ? Math.round((passCount / request.versions.length) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link href="/rd-tracking" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <ArrowLeft size={16} /> Quay lại R&D Tracking
      </Link>

      {/* Header Card */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{request.id}</h2>
              <span className={`badge ${request.status}`}>{request.status}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Khách hàng: <strong style={{ color: 'var(--text-primary)' }}>{request.customer}</strong> — 
              Bề mặt: <strong style={{ color: 'var(--text-primary)' }}>{request.surface}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 'var(--radius-md)', 
              background: request.colorHex, border: '2px solid var(--border-color)',
              boxShadow: `0 0 20px ${request.colorHex}40`
            }} />
            <div>
              <div style={{ fontWeight: 700 }}>{request.colorName}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{request.colorCode}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{request.colorHex}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>TỔNG TEST</div>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{request.versions.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>PASS / FAIL</div>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent-emerald)' }}>{passCount}</span>
              <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>/</span>
              <span style={{ color: 'var(--accent-rose)' }}>{failCount}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>TỶ LỆ ĐẠT</div>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: passRate >= 50 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {passRate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>NGÀY TẠO</div>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>{request.createdAt}</div>
          </div>
        </div>
      </div>

      {/* Version Timeline */}
      <div className="section-header">
        <div>
          <h3 className="section-title">Lịch sử Version Test</h3>
          <p className="section-subtitle">Mỗi version ghi nhận kết quả test và feedback chi tiết</p>
        </div>
        {request.status !== 'approved' && request.status !== 'rejected' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddVersion(!showAddVersion)}>
            <Plus size={14} /> Thêm Version
          </button>
        )}
      </div>

      {/* Add Version Form */}
      {showAddVersion && (
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', borderColor: 'var(--accent-cyan)', borderStyle: 'dashed' }}>
          <h4 style={{ marginBottom: 'var(--spacing-md)', fontWeight: 700 }}>
            📝 Thêm Version {(request.versions.length + 1).toFixed(0)}.{request.versions.length > 0 ? '0' : '0'}
          </h4>
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Thông số Kỹ thuật</label>
              <input className="form-input" placeholder="Nhiệt độ, thời gian, độ dày..."
                value={newVersion.parameters} onChange={e => setNewVersion(p => ({ ...p, parameters: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Kết quả & Feedback</label>
              <textarea className="form-textarea" rows={3} placeholder="Mô tả kết quả test, ΔE, nhận xét..."
                value={newVersion.feedback} onChange={e => setNewVersion(p => ({ ...p, feedback: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button className="btn btn-success btn-sm" onClick={() => { setShowAddVersion(false); alert('Version đã được thêm!'); }}>
                <CheckCircle2 size={14} /> PASS
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => { setShowAddVersion(false); alert('Version đã được thêm!'); }}>
                <XCircle size={14} /> FAIL
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddVersion(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="version-timeline">
        {request.versions.map((v, i) => (
          <div key={i} className={`version-item ${v.result}`}>
            <div className="version-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="version-title">Version {v.version}</span>
                <span className={`badge ${v.result}`}>{v.result === 'pass' ? 'ĐẠT' : v.result === 'fail' ? 'KHÔNG ĐẠT' : 'ĐANG CHỜ'}</span>
              </div>
              <span className="version-date">
                <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {v.date}
              </span>
            </div>
            <div className="version-body">
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Thông số:</strong> {v.parameters}
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Feedback:</strong> {v.feedback}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} /> Tester: {v.tester}
              </div>
            </div>
          </div>
        ))}

        {request.versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-tertiary)' }}>
            <Clock size={40} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.4 }} />
            <p>Chưa có version nào. Nhấn "Thêm Version" để bắt đầu test.</p>
          </div>
        )}
      </div>

      {/* Tech Sign-off */}
      <div className="signoff-section">
        <h3 className="signoff-title">
          <PenTool size={20} /> Ký Duyệt Kỹ Thuật
        </h3>
        {isSigned ? (
          <div>
            <div className="signature-stamp">
              ✅ Đã ký duyệt bởi: <strong>{request.signedBy}</strong> — {request.signedAt}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Chỉ ký duyệt khi tất cả test đã hoàn tất và có ít nhất 1 version PASS.
            </p>
            <button 
              className="btn btn-success"
              disabled={passCount === 0}
              onClick={() => {
                setIsSigned(true);
                alert('✅ Đã ký duyệt kỹ thuật thành công!');
              }}
            >
              <PenTool size={16} /> Ký Duyệt (Trưởng phòng KD)
            </button>
            {passCount === 0 && (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-amber)', marginTop: 8 }}>
                ⚠️ Cần ít nhất 1 version Pass để có thể ký duyệt.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
