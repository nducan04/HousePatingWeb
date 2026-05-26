'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, Factory, FileText, 
  Layers, Package, Users, AlertCircle, Scale, Beaker,
  Thermometer, Zap
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/notification';
import Link from 'next/link';

export default function NewProductionOrder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ contracts: [], formulas: [], technicians: [] });
  
  const [formData, setFormData] = useState({
    ContractID: '',
    CongThucID: '',
    TargetWeight: 500,
    Assignee: '',
    ProductionLine: 'Line 01',
    GhiChu: ''
  });

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [mrpPreview, setMrpPreview] = useState<any[]>([]);

  useEffect(() => {
    fetchPreCreateData();
  }, []);

  const fetchPreCreateData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production/pre-create');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.ContractID) {
      const contract = data.contracts.find((c: any) => c._id === formData.ContractID);
      setSelectedContract(contract);
    } else {
      setSelectedContract(null);
    }
  }, [formData.ContractID, data.contracts]);

  useEffect(() => {
    if (formData.CongThucID) {
      const formula = data.formulas.find((f: any) => f._id === formData.CongThucID);
      setSelectedFormula(formula);
      
      // Calculate MRP preview
      if (formula && formula.ThanhPhan) {
        const preview = formula.ThanhPhan.map((item: any) => ({
          name: item.NguyenVatLieu?.TenNguyenVatLieu || 'Vật tư',
          ratio: item.TiLe,
          weight: (item.TiLe / 100) * formData.TargetWeight
        }));
        setMrpPreview(preview);
      }
    } else {
      setSelectedFormula(null);
      setMrpPreview([]);
    }
  }, [formData.CongThucID, formData.TargetWeight, data.formulas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/production', formData);
      if (res.data.success) {
        toast.success('✅ Khởi tạo lệnh sản xuất thành công!');
        router.push('/production');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo lệnh sản xuất');
    }
  };

  if (loading) return <div className="admin-container">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="admin-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Link href="/production" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-2 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">KHỞI TẠO LỆNH SẢN XUẤT MỚI</h1>
            <p className="page-subtitle">Hệ thống hoạch định vật tư MRP & Phân công sản xuất</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 30 }}>
        
        {/* Left: Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Step 1: Contract Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#2563eb' }}>
              <FileText size={20} />
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>THÔNG TIN ĐỐI CHIẾU HỢP ĐỒNG</h3>
            </div>
            
            <div className="form-group">
              <label className="form-label">Chọn Hợp đồng mẹ (Ref Contract)</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                required
                value={formData.ContractID}
                onChange={(e) => setFormData({...formData, ContractID: e.target.value})}
              >
                <option value="">-- Chọn Hợp đồng B2B đã ký --</option>
                {data.contracts.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.MaHopDong} - {c.title}</option>
                ))}
              </select>
            </div>

            {selectedContract && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15, padding: 15, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>DANH MỤC MÃ MÀU TRONG HỢP ĐỒNG:</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                   {selectedContract.ChiTietHopDong.map((item: any, idx: number) => (
                     <div key={idx} className="badge info" style={{ fontSize: 11 }}>
                       {item.colorCode} ({item.quantity} kg)
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>

          {/* Step 2: Formula & Target */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#d97706' }}>
              <Beaker size={20} />
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>CÔNG THỨC & KHỐI LƯỢNG MỤC TIÊU</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Công thức / Mã màu (Color Model)</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  required
                  value={formData.CongThucID}
                  onChange={(e) => setFormData({...formData, CongThucID: e.target.value})}
                >
                  <option value="">-- Chọn công thức sản xuất --</option>
                  {data.formulas.map((f: any) => (
                    <option key={f._id} value={f._id}>{f.TenCongThuc} ({f.MaMau})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Khối lượng Target (Kg)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                    required
                    style={{ paddingRight: 40 }}
                    value={formData.TargetWeight}
                    onChange={(e) => setFormData({...formData, TargetWeight: parseInt(e.target.value) || 0})}
                  />
                  <span style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: 12, color: '#94a3b8' }}>KG</span>
                </div>
              </div>
            </div>

            {selectedFormula && (
              <div style={{ marginTop: 20 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 15 }}>DỰ TOÁN VẬT TƯ (MRP CALCULATION):</div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
                    {mrpPreview.map((item, idx) => (
                      <div key={idx} style={{ padding: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                         <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>{item.weight.toLocaleString()} Kg</div>
                           <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.ratio}% TỶ LỆ</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Assignment & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
           <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 25 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#7c3aed' }}>
                <Users size={20} />
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>NGUỒN LỰC</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Phân công kỹ thuật viên</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  required
                  value={formData.Assignee}
                  onChange={(e) => setFormData({...formData, Assignee: e.target.value})}
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {data.technicians.map((t: any) => (
                    <option key={t._id} value={t._id}>{t.HoTen} ({t.MaNV})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Line sản xuất</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  value={formData.ProductionLine}
                  onChange={(e) => setFormData({...formData, ProductionLine: e.target.value})}
                >
                  <option value="Line 01">Line 01 - Tank 1000L</option>
                  <option value="Line 02">Line 02 - Tank 500L</option>
                  <option value="Line 03">Line 03 - Phun sấy</option>
                  <option value="Line 04">Line 04 - Đóng gói</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú vận hành</label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  placeholder="Yêu cầu kiểm định, nhiệt độ sấy..."
                  value={formData.GhiChu}
                  onChange={(e) => setFormData({...formData, GhiChu: e.target.value})}
                />
              </div>

              <div style={{ marginTop: 20 }}>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full" style={{ padding: '15px 0', fontSize: 15, fontWeight: 800 }}>
                   XÁC NHẬN PHÁT LỆNH 🏭
                </button>
                <p style={{ fontSize: 11, textAlign: 'center', color: '#94a3b8', marginTop: 12 }}>
                  <AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} /> 
                  Xác nhận lệnh sẽ cấp quyền truy xuất kho tương ứng cho Line sản xuất.
                </p>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 15, border: '1px dashed #2563eb', background: 'rgba(0,212,255,0.02)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', marginBottom: 10 }}>THẺ KIỂM SOÁT NHIỆT (DỰ KIẾN):</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                   <span style={{ color: '#94a3b8' }}>Nhiệt độ sấy:</span>
                   <span style={{ fontWeight: 800 }}>195°C / 15m</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                   <span style={{ color: '#94a3b8' }}>Độ dày màng:</span>
                   <span style={{ fontWeight: 800 }}>75-85 µm</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                   <span style={{ color: '#94a3b8' }}>Áp suất đẩy:</span>
                   <span style={{ fontWeight: 800 }}>4.5 Bar</span>
                 </div>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}
