'use client';

import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, ArrowLeft, Plus, Beaker, Clipboard, Settings, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { paintColors } from '@/lib/data/colors-data';
import { useAuthStore } from '@/lib/store/authStore';

export default function FormulasPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [formulas, setFormulas] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newFormula, setNewFormula] = useState({
    colorCode: '',
    baseType: '',
    nhietDo: '195',
    components: [{ materialId: '', percentage: 0 }]
  });

  useEffect(() => {
    // Load formulas from localStorage
    if (typeof window !== 'undefined') {
      const storedFormulas = localStorage.getItem('paintFormulas');
      if (storedFormulas) {
        setFormulas(JSON.parse(storedFormulas));
      } else {
        const defaultFormulas = [
          {
            id: 'FOR-001',
            colorCode: 'RAL-9005',
            colorName: 'Jet Black',
            baseType: 'Polyester TGIC',
            nhietDo: 200,
            components: [
              { materialId: 'MAT-001', name: 'Resin P-2400', percentage: 60 },
              { materialId: 'MAT-003', name: 'Carbon Black N330', percentage: 5 },
              { materialId: 'MAT-005', name: 'Barium Sulfate', percentage: 30 },
              { materialId: 'MAT-007', name: 'Benzoin (Degassing)', percentage: 5 },
            ],
            updatedAt: '15/05/2026',
            author: 'Nguyen Van A'
          },
          {
            id: 'FOR-002',
            colorCode: 'INT-D2525',
            colorName: 'Silver Metallic',
            baseType: 'Super Durable Polyester',
            nhietDo: 195,
            components: [
              { materialId: 'MAT-002', name: 'Resin SD-5000', percentage: 55 },
              { materialId: 'MAT-008', name: 'Flow Agent (PV88)', percentage: 8 },
              { materialId: 'MAT-004', name: 'Titanium Dioxide R-902', percentage: 5 },
              { materialId: 'MAT-006', name: 'Silica Powder', percentage: 27 },
              { materialId: 'MAT-007', name: 'Benzoin (Degassing)', percentage: 5 },
            ],
            updatedAt: '14/05/2026',
            author: 'Tran Thi B'
          }
        ];
        
        setFormulas(defaultFormulas);
        localStorage.setItem('paintFormulas', JSON.stringify(defaultFormulas));
      }

      // Load materials from localStorage
      const storedMaterials = localStorage.getItem('rdMaterials');
      if (storedMaterials) {
        setMaterials(JSON.parse(storedMaterials));
      } else {
        const defaultMaterials = [
          { id: 'MAT-001', name: 'Resin P-2400', category: 'Resin', stock: 500, unit: 'kg', cost: 120000, supplier: 'DSM' },
          { id: 'MAT-002', name: 'Resin SD-5000', category: 'Resin', stock: 300, unit: 'kg', cost: 150000, supplier: 'Allnex' },
          { id: 'MAT-003', name: 'Carbon Black N330', category: 'Pigment', stock: 50, unit: 'kg', cost: 80000, supplier: 'Orion' },
          { id: 'MAT-004', name: 'Titanium Dioxide R-902', category: 'Pigment', stock: 200, unit: 'kg', cost: 95000, supplier: 'Chemours' },
          { id: 'MAT-005', name: 'Barium Sulfate', category: 'Filler', stock: 1000, unit: 'kg', cost: 25000, supplier: 'Local' },
          { id: 'MAT-006', name: 'Silica Powder', category: 'Filler', stock: 400, unit: 'kg', cost: 35000, supplier: 'Local' },
          { id: 'MAT-007', name: 'Benzoin (Degassing)', category: 'Additive', stock: 20, unit: 'kg', cost: 200000, supplier: 'Evonik' },
          { id: 'MAT-008', name: 'Flow Agent (PV88)', category: 'Additive', stock: 30, unit: 'kg', cost: 180000, supplier: 'Estron' },
        ];
        setMaterials(defaultMaterials);
        localStorage.setItem('rdMaterials', JSON.stringify(defaultMaterials));
      }
    }
  }, []);

  const handleAddComponent = () => {
    setNewFormula(p => ({
      ...p,
      components: [...p.components, { materialId: '', percentage: 0 }]
    }));
  };

  const handleRemoveComponent = (idx: number) => {
    setNewFormula(p => ({
      ...p,
      components: p.components.filter((_, i) => i !== idx)
    }));
  };

  const handleComponentChange = (idx: number, field: string, value: any) => {
    setNewFormula(p => {
      const comps = [...p.components];
      comps[idx] = { ...comps[idx], [field]: value };
      return { ...p, components: comps };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate total percentage
    const total = newFormula.components.reduce((acc, curr) => acc + parseFloat(curr.percentage as any || 0), 0);
    if (total !== 100) {
      alert(`❌ Tổng tỷ lệ phải bằng 100%. Hiện tại là ${total}%`);
      return;
    }

    const colorInfo = paintColors.find(c => c.code === newFormula.colorCode);
    const nextId = `FOR-${String(formulas.length + 1).padStart(3, '0')}`;
    
    const resolvedComponents = newFormula.components.map(c => {
      const mat = materials.find(m => m.id === c.materialId);
      return {
        materialId: c.materialId,
        name: mat?.name || 'Unknown',
        percentage: parseFloat(c.percentage as any)
      };
    });

    const displayName =
      user?.profile?.HoTen ||
      user?.profile?.TenKhachHang ||
      user?.username ||
      'Admin';

    const formulaToSave = {
      id: nextId,
      colorCode: newFormula.colorCode,
      colorName: colorInfo?.name || 'Unknown',
      baseType: newFormula.baseType,
      nhietDo: parseInt(newFormula.nhietDo) || 195,
      components: resolvedComponents,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      author: displayName
    };

    const updatedFormulas = [...formulas, formulaToSave];
    setFormulas(updatedFormulas);
    localStorage.setItem('paintFormulas', JSON.stringify(updatedFormulas));
    
    setIsModalOpen(false);
    setNewFormula({
      colorCode: '',
      baseType: '',
      nhietDo: '195',
      components: [{ materialId: '', percentage: 0 }]
    });
    alert('✅ Đã tạo công thức mới thành công!');
  };

  const filteredFormulas = formulas.filter(f => 
    f.colorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPercentage = newFormula.components.reduce((acc, curr) => acc + parseFloat(curr.percentage as any || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/rd-tracking" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical size={24} className="text-emerald-600" />
              Quản lý Công thức Pha chế
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Lưu trữ và tối ưu hóa công thức sơn tĩnh điện</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} /> Tạo Công thức Mới
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công thức, mã màu..."
            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Tổng số:</span>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-black">{filteredFormulas.length}</span>
        </div>
      </div>

      {/* Grid of Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFormulas.map(formula => {
          const colorInfo = paintColors.find(c => c.code === formula.colorCode);
          return (
            <div key={formula.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg shadow-inner"
                    style={{ background: colorInfo?.hex || '#333' }}
                  />
                  <div>
                    <div className="text-sm font-black text-slate-900">{formula.colorCode}</div>
                    <div className="text-xs font-medium text-slate-400">{formula.colorName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-200">
                    🔥 {formula.nhietDo || 195}°C
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase">
                    {formula.baseType}
                  </span>
                </div>
              </div>

              {/* Body - Components */}
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thành phần</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ (%)</span>
                </div>
                <div className="space-y-3">
                  {formula.components.map((comp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium flex items-center gap-2">
                        <Beaker size={14} className="text-slate-400" />
                        {comp.name}
                      </span>
                      <div className="flex items-center gap-3 flex-1 ml-4 justify-end">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${comp.percentage}%` }} />
                        </div>
                        <span className="text-slate-900 font-black min-w-[30px] text-right">{comp.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-4">
                  <span>ID: {formula.id}</span>
                  <span>Người tạo: {formula.author}</span>
                </div>
                <span>Cập nhật: {formula.updatedAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFormulas.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl shadow-sm mt-6">
          <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-400 font-medium">Không tìm thấy công thức nào khớp với từ khóa.</p>
        </div>
      )}

      {/* Create Formula Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical size={20} className="text-emerald-600" />
                Tạo Công thức Mới
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500">Mã Màu Mục tiêu *</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={newFormula.colorCode}
                    onChange={e => setNewFormula(p => ({ ...p, colorCode: e.target.value }))}
                  >
                    <option value="">Chọn mã màu</option>
                    {paintColors.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500">Loại Nền (Base Type) *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    placeholder="VD: Polyester TGIC"
                    required
                    value={newFormula.baseType}
                    onChange={e => setNewFormula(p => ({ ...p, baseType: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500">Nhiệt độ sấy (°C) *</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    placeholder="VD: 195"
                    required
                    value={newFormula.nhietDo}
                    onChange={e => setNewFormula(p => ({ ...p, nhietDo: e.target.value }))}
                  />
                </div>
              </div>

              {/* Components */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-500">Thành phần Nguyên liệu *</label>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Thêm thành phần
                  </button>
                </div>

                {newFormula.components.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <select
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                      required
                      value={comp.materialId}
                      onChange={e => handleComponentChange(idx, 'materialId', e.target.value)}
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                      ))}
                    </select>

                    <div className="relative w-32">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all pr-8"
                        placeholder="0"
                        required
                        min="0"
                        max="100"
                        value={comp.percentage}
                        onChange={e => handleComponentChange(idx, 'percentage', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                    </div>

                    {newFormula.components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Total & Validation */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl mt-4">
                  <span className="text-sm font-bold text-slate-500">Tổng tỷ lệ:</span>
                  <span className={`text-sm font-black ${totalPercentage === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalPercentage}% / 100%
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all cursor-pointer shadow-lg ${
                    totalPercentage === 100 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={totalPercentage !== 100}
                >
                  Tạo Công thức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
