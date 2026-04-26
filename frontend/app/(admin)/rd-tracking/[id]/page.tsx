'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, Plus, PenTool, User, 
  Calendar, Layers, MessageSquare, ImageIcon, Scale, AlertTriangle 
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { paintColors } from '@/lib/data/colors-data';

export default function RDDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuthStore();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ 
    parameters: '', 
    feedback: '', 
    inputWeight: '', 
    outputWeight: '',
    result: 'pending' as 'pass' | 'fail' | 'pending' 
  });
  
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rd-tracking/${id}`);
      if (res.data.success) {
        setRequest(res.data.data);
        setIsSigned(res.data.data.TrangThai === 'approved');
      }
    } catch (err) {
      console.error('Failed to fetch R&D details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVersion = async (result: 'pass' | 'fail' | 'pending') => {
    try {
      const res = await api.post(`/rd-tracking/${id}/versions`, {
        ...newVersion,
        result
      });
      if (res.data.success) {
        setRequest(res.data.data);
        setShowAddVersion(false);
        setNewVersion({ parameters: '', feedback: '', inputWeight: '', outputWeight: '', result: 'pending' });
        alert('✅ Đã cập nhật phiên bản test mới!');
      }
    } catch (err) {
      alert('❌ Lỗi khi thêm phiên bản mới');
    }
  };

  const handleSignKCS = async () => {
    try {
      const res = await api.patch(`/rd-tracking/${id}/sign-kcs`);
      if (res.data.success) {
        setIsSigned(true);
        alert('✅ KCS Đã xác nhận đạt chuẩn. Hợp đồng đã chuyển sang trạng thái Đang giao hàng.');
        fetchData(); // Refresh UI
      }
    } catch (err: any) {
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

  const isKCSManager = user?.role === 'Admin';

  const contract = request.ContractID || {};

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
              <span className={`badge ${request.TrangThai}`}>{request.TrangThai.toUpperCase()}</span>
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
              {(request.LichSuPhienBan.reduce((acc: number, cur: any) => acc + (cur.inputWeight > 0 ? (cur.inputWeight - cur.outputWeight)/cur.inputWeight*100 : 0), 0) / (request.LichSuPhienBan.length || 1)).toFixed(1)}<span className="stat-unit">%</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="text-sm text-slate-500 mb-1">CẬP NHẬT</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{new Date(request.updatedAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 30 }}>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hành trình Phân tích & Pha chế (R&D Timeline)</h3>
          <p className="text-sm text-slate-400 mt-1">Dữ liệu vòng lặp test được ghi nhận qua từng phiên bản</p>
        </div>
        {!isSigned && (
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs" onClick={() => setShowAddVersion(!showAddVersion)}>
            <Plus size={14} /> Log Mẻ Test Mới
          </button>
        )}
      </div>

      {/* Add Version Form - Advanced */}
      {showAddVersion && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ 
          padding: '2.25rem', marginBottom: 40, 
          border: '1px solid #2563eb', background: 'rgba(0, 212, 255, 0.02)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 10px #2563eb' }} />
            <h4 style={{ fontWeight: 800 }}>NHẬT KÝ CHI TIẾT PHIÊN BẢN V{request.LichSuPhienBan.length + 1}.0</h4>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label"><Layers size={14} style={{ marginRight: 6 }} /> Thông số Kỹ thuật (Công thức, ĐK Nhiệt...)</label>
                <textarea className="form-textarea" rows={4} placeholder="VD: Bột Interpon 15%, Nhiệt độ sấy 200°C, Thời gian 12p..."
                  value={newVersion.parameters} onChange={e => setNewVersion(p => ({ ...p, parameters: e.target.value }))} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label"><Scale size={14} style={{ marginRight: 6 }} /> Khối lượng Input (kg)</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="0.00"
                    value={newVersion.inputWeight} onChange={e => setNewVersion(p => ({ ...p, inputWeight: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Scale size={14} style={{ marginRight: 6 }} /> Khối lượng Output (kg)</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="0.00"
                    value={newVersion.outputWeight} onChange={e => setNewVersion(p => ({ ...p, outputWeight: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label"><MessageSquare size={14} style={{ marginRight: 6 }} /> Phản hồi độ lệch màu & Feedback</label>
                <textarea className="form-textarea" rows={4} placeholder="VD: Độ lệch màu Delta E = 0.5, Cần thêm 2% bột bóng..."
                  value={newVersion.feedback} onChange={e => setNewVersion(p => ({ ...p, feedback: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label"><ImageIcon size={14} style={{ marginRight: 6 }} /> Hình ảnh thực tế mẻ test</label>
                <div style={{ 
                  border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 8, padding: '16px', 
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' 
                }} className="hover:border-[#2563eb] hover:bg-[rgba(255,255,255,0.02)]">
                  <Plus size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Nhấn để tải lên ảnh so màu (.jpg, .png)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: 24, padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>HAO HỤT TỰ ĐỘNG:</span>
              <span style={{ fontWeight: 800, color: '#d97706', fontSize: 18 }}>
                {calculatedWastage(newVersion.inputWeight, newVersion.outputWeight) || '0.00'}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={() => setShowAddVersion(false)}>Hủy</button>
              <button 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs" 
                style={{ padding: '0 20px', fontWeight: 800, fontSize: 13 }} 
                onClick={() => handleAddVersion('fail')}
              >
                BÁO LỖI (RE-TEST) ❌
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs" 
                style={{ padding: '0 20px', fontWeight: 800, fontSize: 13 }} 
                onClick={() => handleAddVersion('pass')}
              >
                XÁC NHẬN HOÀN THÀNH ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Vertical Timeline */}
      <div className="timeline-container">
        {[...request.LichSuPhienBan].reverse().map((v: any, i: number) => {
          const wastage = v.inputWeight && v.outputWeight 
            ? ((v.inputWeight - v.outputWeight) / v.inputWeight * 100).toFixed(1) 
            : '0.0';
            
          return (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot ${v.result}`}>
                {v.result === 'pass' ? <CheckCircle2 size={14} /> : v.result === 'fail' ? <XCircle size={14} /> : <Clock size={14} />}
              </div>
              
              <div className="timeline-card bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden">
                <div className="card-header-rd">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>VERSION {v.version}</span>
                    <span className={`badge-rd ${v.result}`}>
                      {v.result === 'pass' ? 'ĐẠT CHUẨN KỸ THUẬT' : 'CHƯA ĐẠT - RE-TEST'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                    <span><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> {new Date(v.date).toLocaleString('vi-VN')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} style={{ display: 'inline' }} /> 
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{v.tester}</span>
                      {v.testerCode && (
                        <span style={{ 
                          fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '1px 6px', 
                          borderRadius: 4, color: '#2563eb', fontWeight: 700 
                        }}>
                          {v.testerCode}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="card-content-rd">
                  <div className="rd-block">
                    <div className="rd-block-title">⚙️ THÔNG SỐ KỸ THUẬT</div>
                    <div className="rd-block-text">{v.parameters}</div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                      <div className="rd-mini-stat">
                        <span>Input:</span> <strong>{v.inputWeight}kg</strong>
                      </div>
                      <div className="rd-mini-stat">
                        <span>Output:</span> <strong>{v.outputWeight}kg</strong>
                      </div>
                      <div className="rd-mini-stat" style={{ color: '#d97706' }}>
                        <span>Hao hụt:</span> <strong>{wastage}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rd-block feedback">
                    <div className="rd-block-title">💬 FEEDBACK LỆCH MÀU</div>
                    <div className="rd-block-text">{v.feedback}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div className="rd-image-placeholder">
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
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
            <Clock size={48} style={{ margin: '0 auto 16px' }} />
            <p>Hành trình R&D chưa bắt đầu. Hãy thêm phiên bản đầu tiên.</p>
          </div>
        )}
      </div>

      {/* Admin KCS Sign-off Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ 
        marginTop: 60, padding: '30px', border: '1px solid rgba(255,255,255,0.05)',
        background: isSigned ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <PenTool size={22} className="text-[#059669]" /> 
              XÁC NHẬN KHOÁ MẪU & CHUẨN KCS (QUYỀN QUẢN LÝ)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              Thao tác này sẽ xác nhận công thức cuối cùng cho sản xuất hàng loạt. Chỉ có MaQuyen 'Admin' mới được phép ký duyệt.
            </p>
          </div>
          
          <div>
            {!isSigned ? (
              <div style={{ textAlign: 'right' }}>
                <button 
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${isKCSManager ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-ghost'}`}
                  disabled={!isKCSManager || passCount === 0}
                  onClick={handleSignKCS}
                  style={{ minWidth: 200 }}
                >
                  <PenTool size={16} /> Ký Duyệt KCS
                </button>
                {!isKCSManager && (
                  <p style={{ fontSize: 11, color: '#e11d48', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <AlertTriangle size={12} /> Bạn không có quyền ký duyệt mục này
                  </p>
                )}
                {isKCSManager && passCount === 0 && (
                  <p style={{ fontSize: 11, color: '#d97706', marginTop: 8 }}>
                    ⚠️ Cần ít nhất 1 phiên bản Đạt (PASS) để ký duyệt
                  </p>
                )}
              </div>
            ) : (
              <div className="kcs-signature-stamp">
                <div style={{ border: '3px solid #059669', padding: '10px 20px', borderRadius: 4, transform: 'rotate(-5deg)' }}>
                  <div style={{ color: '#059669', fontWeight: 900, fontSize: 24, textAlign: 'center' }}>PASTED KCS</div>
                  <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>SIGNED BY: {request.signedBy} — {new Date(request.signedAt).toLocaleDateString()}</div>
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
