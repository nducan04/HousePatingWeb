'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Beaker, Layers, Scale, 
  AlertCircle, ChevronRight, Save, Trash2, Calculator 
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [targetKg, setTargetKg] = useState<number>(100);
  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/formulas');
      if (res.data.success) {
        setFormulas(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch formulas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (id: string) => {
    try {
      const res = await api.post(`/formulas/${id}/calculate`, { targetKg });
      if (res.data.success) {
        setCalculation(res.data.data);
      }
    } catch (err) {
      alert('Lỗi khi tính toán định mức vật tư');
    }
  };

  const filteredFormulas = formulas.filter(f => 
    f.TenCongThuc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.MaCongThuc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Beaker className="text-[var(--accent-cyan)]" /> Quản lý Công thức & Vật tư
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">Thiết lập tỷ lệ thành phần và tính toán định mức xuất kho</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm Công thức Mới
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: List */}
        <div className="col-span-4 space-y-4">
          <div className="glass-card p-4">
            <div className="search-box mb-4">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Tìm mã hoặc tên công thức..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 opacity-50">Đang tải...</div>
              ) : filteredFormulas.map(f => (
                <div 
                  key={f._id}
                  onClick={() => {
                    setSelectedFormula(f);
                    setCalculation(null);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFormula?._id === f._id 
                    ? 'border-[var(--accent-cyan)] bg-[rgba(0,212,255,0.05)]' 
                    : 'border-transparent hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm">{f.MaCongThuc}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{f.TenCongThuc}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${f.TrangThai === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {f.TrangThai}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--text-tertiary)] flex justify-between">
                    <span>{f.SanPham?.TenDongSon || 'Sản phẩm chung'}</span>
                    <span>v{f.Version}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Details & Calculator */}
        <div className="col-span-8">
          {selectedFormula ? (
            <div className="space-y-6">
              {/* Formula Details */}
              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{selectedFormula.TenCongThuc}</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">Mã: {selectedFormula.MaCongThuc} | Sản phẩm: {selectedFormula.SanPham?.TenDongSon}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm"><Trash2 size={16} /></button>
                    <button className="btn btn-primary btn-sm"><Save size={16} /> Lưu Thay Đổi</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={16} className="text-[var(--accent-cyan)]" />
                    <span className="font-bold text-sm uppercase tracking-wider">Thành phần nguyên liệu</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[var(--text-tertiary)] border-b border-white/5">
                        <th className="text-left pb-2">Nguyên vật liệu</th>
                        <th className="text-center pb-2">Tỷ lệ (%)</th>
                        <th className="text-right pb-2">Định mức (kg/đơn vị)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFormula.ThanhPhan.map((tp: any, i: number) => (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                          <td className="py-3">
                            <div className="font-medium">{tp.NguyenVatLieu.TenNguyenVatLieu}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)]">{tp.NguyenVatLieu.MaNVL}</div>
                          </td>
                          <td className="text-center font-mono py-3">{tp.TiLe}%</td>
                          <td className="text-right font-bold py-3">{tp.KhoiLuongDinhMuc} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Material Calculator */}
              <div className="glass-card p-6 border-l-4 border-[var(--accent-cyan)] bg-[rgba(0,212,255,0.02)]">
                <div className="flex items-center gap-3 mb-6">
                  <Calculator size={22} className="text-[var(--accent-cyan)]" />
                  <h4 className="text-lg font-bold">Máy tính dự toán vật tư xuất kho</h4>
                </div>

                <div className="flex items-end gap-6 mb-8">
                  <div className="form-group flex-1 max-w-[200px]">
                    <label className="form-label">Sản lượng cần pha (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
                      <input 
                        type="number" 
                        className="form-input !pl-10" 
                        value={targetKg}
                        onChange={e => setTargetKg(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCalculate(selectedFormula._id)}
                    className="btn btn-primary h-[42px] px-8"
                  >
                    Tính toán định mức
                  </button>
                </div>

                {calculation && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-bold uppercase">Kết quả dự tính cho {calculation.targetKg}kg sơn phẩm</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Dựa trên Công thức v{selectedFormula.Version}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {calculation.requirements.map((req: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                          <div>
                            <div className="text-sm font-bold">{req.material}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)]">Kho hiện có: {req.inStock} {req.unit}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold text-[var(--accent-cyan)]">{req.required.toFixed(2)} {req.unit}</div>
                            {req.shortage > 0 && (
                              <div className="text-[10px] text-[var(--accent-rose)] flex items-center justify-end gap-1">
                                <AlertCircle size={10} /> Thiếu hụt: {req.shortage.toFixed(2)} {req.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-4">
                      <button className="btn btn-ghost btn-sm">In phiếu dự toán</button>
                      <button className="btn btn-primary btn-sm" disabled={calculation.requirements.some((r: any) => r.shortage > 0)}>
                        Xác nhận & Xuất lệnh pha chế
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-12">
              <Beaker size={64} className="mb-6 opacity-10" />
              <p className="text-lg text-center font-medium">Chọn một công thức từ danh sách bên trái để xem chi tiết và tính toán định mức vật tư.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.2); }
      `}</style>
    </div>
  );
}
