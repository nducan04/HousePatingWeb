'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Search, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, Plus, Printer, Eye, Truck, BarChart3, Trash2, Layers, Filter
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';
import Link from 'next/link';

export default function PackagingPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [pendingRD, setPendingRD] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedRD, setSelectedRD] = useState<any>(null);
  
  const [packagingData, setPackagingData] = useState({
    material: 'Thùng nhựa tiêu chuẩn AkzoNobel',
    notes: '',
    specs: [
      { containerType: 'Thùng 20L', quantity: 0, unitWeight: 20 },
      { containerType: 'Lon 5L', quantity: 0, unitWeight: 5 }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slipsRes, pendingRes] = await Promise.all([
        api.get('/packaging'),
        api.get('/packaging/pending-rd')
      ]);
      setSlips(slipsRes.data.data);
      setPendingRD(pendingRes.data.data);
    } catch (err) {
      console.error('Failed to fetch packaging data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlip = async () => {
    if (!selectedRD) return;
    
    // Calculate totals
    const finalSpecs = packagingData.specs
      .filter(s => s.quantity > 0)
      .map(s => ({
        ...s,
        totalWeight: s.quantity * s.unitWeight
      }));

    if (finalSpecs.length === 0) {
      toast.warning('Vui lòng nhập ít nhất một loại quy cách đóng gói!');
      return;
    }

    try {
      const res = await api.post('/packaging', {
        RDLogID: selectedRD._id,
        ContractID: selectedRD.ContractID?._id,
        OrderID: selectedRD.OrderID?._id, // Add OrderID support
        PackagingSpecs: finalSpecs,
        PackagingMaterial: packagingData.material,
        Notes: packagingData.notes
      });

      if (res.data.success) {
        toast.success('✅ Đóng gói thành công! Tồn kho đã được cập nhật.');
        setShowModal(false);
        setSelectedRD(null);
        setPackagingData({
          material: 'Thùng nhựa tiêu chuẩn AkzoNobel',
          notes: '',
          specs: [
            { containerType: 'Thùng 20L', quantity: 0, unitWeight: 20 },
            { containerType: 'Lon 5L', quantity: 0, unitWeight: 5 }
          ]
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '❌ Lỗi khi thực hiện đóng gói');
    }
  };

  const updateSpec = (index: number, field: string, value: any) => {
    const newSpecs = [...packagingData.specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setPackagingData({ ...packagingData, specs: newSpecs });
  };

  const filteredSlips = slips.filter(s => 
    s.MaPhieuDongGoi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.RDLogID?.MaNhatKy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-bold text-slate-800">QUY TRÌNH ĐÓNG GÓI THÀNH PHẨM</h1>
          <p className="page-subtitle">Quản lý quy cách đóng đóng gói, cập nhật kho và chứng từ bàn giao</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"><Printer size={16} /> In báo cáo</button>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>CHỜ ĐÓNG GÓI</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>{pendingRD.length}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Từ mẫu KCS đã duyệt</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>ĐÃ ĐÓNG GÓI</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{slips.length}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Tổng sản lượng tháng này</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>KHỐI LƯỢNG TỊNH</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>
            {slips.reduce((acc, s) => acc + s.NetWeightTotal, 0).toLocaleString()} <span style={{ fontSize: 14 }}>Kg</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>TỶ LỆ HAO HỤT B/Q</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>2.4<span style={{ fontSize: 14 }}>%</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 30 }}>
        
        {/* Left: Main Logs Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 className="text-[#059669]" size={20} /> LỊCH SỬ ĐÓNG GÓI & XUẤT KHO
            </h3>
            <div className="relative" style={{ maxWidth: 300 }}>
              <Search size={16} />
              <input type="text" placeholder="Tìm theo mã phiếu/log R&D..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Phiếu</th>
                <th>Mẫu R&D</th>
                <th>Đối Tượng</th>
                <th>Quy Cách</th>
                <th>Khối Lượng</th>
                <th>Ngày Đóng</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlips.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 800, color: '#2563eb' }}>{s.MaPhieuDongGoi}</td>
                  <td>{s.RDLogID?.MaNhatKy}</td>
                  <td>
                    {s.ContractID ? (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>HĐ:</span> {s.ContractID.MaHopDong}
                      </div>
                    ) : s.OrderID ? (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: '#d97706', fontWeight: 700 }}>ĐH:</span> {s.OrderID.MaDonHang}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {s.PackagingSpecs?.map((spec: any, idx: number) => (
                      <div key={idx} style={{ fontSize: 11 }}>{spec.containerType} x {spec.quantity}</div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{s.NetWeightTotal} kg</td>
                  <td style={{ fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/packaging/${s._id}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-2 py-1 rounded-md text-xs"><Eye size={14} /></Link>
                      <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-2 py-1 rounded-md text-xs"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Pending Packaging Queue */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock className="text-[#d97706]" size={18} /> HÀNG CHỜ ĐÓNG GÓI
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {pendingRD.map(rd => (
              <div key={rd._id} className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden hover:border-[#2563eb]/50 transition-all" style={{ padding: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>{rd.MaNhatKy}</div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Mã màu: {rd.MaMauYeuCau}</div>
                  </div>
                  <div className="badge success">KCS PASSED</div>
                </div>
                
                {/* Progress Mini-Tracker */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 15 }}>
                  <div style={{ flex: 1, height: 4, background: '#059669', borderRadius: 2 }} />
                  <div style={{ flex: 1, height: 4, background: '#059669', borderRadius: 2 }} />
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                </div>
                
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 15 }}>
                  {rd.ContractID ? (
                    <>Hợp đồng: {rd.ContractID?.MaHopDong}</>
                  ) : rd.OrderID ? (
                    <>Đơn hàng: {rd.OrderID?.MaDonHang}</>
                  ) : 'No Reference'}
                </div>

                <button 
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs w-full"
                  onClick={() => {
                    setSelectedRD(rd);
                    setShowModal(true);
                  }}
                >
                  <Package size={14} /> Tiến hành Đóng gói
                </button>
              </div>
            ))}
            
            {pendingRD.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, border: '1px dashed #e2e8f0', borderRadius: 12, opacity: 0.5 }}>
                <p style={{ fontSize: 12 }}>Không có hàng chờ đóng gói</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Packing Slip */}
      {showModal && selectedRD && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ maxWidth: 600 }}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">KHỞI TẠO PHIẾU ĐÓNG GÓI & XUẤT KHO</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'rgba(0,212,255,0.05)', padding: 15, borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>MẪU R&D GỐC</div>
                    <div style={{ fontWeight: 800 }}>{selectedRD.MaNhatKy}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>MÃ MÀU CHUẨN</div>
                    <div style={{ fontWeight: 800, color: '#d97706' }}>{selectedRD.MaMauYeuCau}</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quy cách đóng gói chi tiết</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {packagingData.specs.map((spec, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
                      <div className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ background: '#ffffff', fontSize: 12 }}>{spec.containerType} ( {spec.unitWeight} kg )</div>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                        placeholder="Số lượng"
                        value={spec.quantity || ''}
                        onChange={e => updateSpec(idx, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                        {(spec.quantity * spec.unitWeight).toLocaleString()} <span style={{ fontSize: 10, color: '#94a3b8' }}>Kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loại vật liệu bao bì</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  value={packagingData.material}
                  onChange={e => setPackagingData({...packagingData, material: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú bổ sung</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  value={packagingData.notes}
                  onChange={e => setPackagingData({...packagingData, notes: e.target.value})}
                />
              </div>

              <div style={{ marginTop: 10, padding: 15, borderRadius: 8, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TỔNG KHỐI LƯỢNG THỰC XUẤT:</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>
                  {packagingData.specs.reduce((acc, s) => acc + (s.quantity * s.unitWeight), 0).toLocaleString()} <span style={{ fontSize: 14 }}>Kg</span>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center' }}>
                 <AlertCircle size={12} /> Hệ thống sẽ tự động trừ trừ tồn nguyên liệu và nhập kho thành phẩm ngay sau khi xác nhận.
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={() => setShowModal(false)}>Hủy bỏ</button>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={handleCreateSlip}>
                <CheckCircle2 size={16} /> Xác nhận Đóng gói & Nhập kho
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
        .badge.success { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 10px; padding: 2px 8px; }
      `}</style>
    </div>
  );
}
