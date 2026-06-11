'use client';

import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, ArrowLeft, Plus, Beaker, Clipboard, Settings, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { paintColors } from '@/lib/data/colors-data';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from '@/lib/utils/notification';
import api from '@/lib/utils/axiosAuth';

export default function FormulasPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [formulas, setFormulas] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newFormula, setNewFormula] = useState({
    MaCongThuc: '',
    TenCongThuc: '',
    MaMau: '',
    SanPham: '',
    nhietDo: '195', 
    baseType: '',   
    components: [{ materialId: '', percentage: 0, requiredAmount: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formulasRes, materialsRes, productsRes] = await Promise.all([
        api.get('/formulas'),
        api.get('/kho/nguyen-vat-lieu'),
        api.get('/san-pham-son')
      ]);

      if (formulasRes.data?.success) {
        setFormulas(formulasRes.data.data);
      }
      if (materialsRes.data?.success) {
        setMaterials(materialsRes.data.data);
      }
      if (productsRes.data?.success) {
        setProducts(productsRes.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu', error);
      toast.error('Không thể tải dữ liệu công thức');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = () => {
    setNewFormula(p => ({
      ...p,
      components: [...p.components, { materialId: '', percentage: 0, requiredAmount: 0 }]
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

  const handleColorChange = (colorCode: string) => {
    const colorInfo = paintColors.find(c => c.code === colorCode);
    setNewFormula(p => ({
      ...p,
      MaMau: colorCode,
      MaCongThuc: `CT-${colorCode}`,
      TenCongThuc: `Công thức màu ${colorInfo?.name || colorCode}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = newFormula.components.reduce((acc, curr) => acc + parseFloat(curr.percentage as any || 0), 0);
    if (total !== 100) {
      toast.error(`❌ Tổng tỷ lệ phải bằng 100%. Hiện tại là ${total}%`);
      return;
    }

    if (!newFormula.SanPham) {
      toast.error(`❌ Vui lòng chọn Sản phẩm Sơn`);
      return;
    }

    try {
      const payload = {
        MaCongThuc: newFormula.MaCongThuc,
        TenCongThuc: newFormula.TenCongThuc,
        MaMau: newFormula.MaMau,
        SanPham: newFormula.SanPham,
        TrangThai: 'Active',
        ThanhPhan: newFormula.components.map(c => ({
          NguyenVatLieu: c.materialId,
          TiLe: parseFloat(c.percentage as any),
          KhoiLuongDinhMuc: parseFloat(c.requiredAmount as any)
        })),
        GhiChu: `Base Type: ${newFormula.baseType}, Nhiệt độ: ${newFormula.nhietDo}`
      };

      const res = await api.post('/formulas', payload);
      if (res.data.success) {
        toast.success('✅ Đã tạo công thức mới thành công!');
        setIsModalOpen(false);
        setNewFormula({
          MaCongThuc: '',
          TenCongThuc: '',
          MaMau: '',
          SanPham: '',
          nhietDo: '195',
          baseType: '',
          components: [{ materialId: '', percentage: 0, requiredAmount: 0 }]
        });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo công thức');
    }
  };

  const filteredFormulas = formulas.filter(f => {
    const search = searchTerm.toLowerCase();
    return (
      (f.MaCongThuc || '').toLowerCase().includes(search) ||
      (f.TenCongThuc || '').toLowerCase().includes(search) ||
      (f.MaMau || '').toLowerCase().includes(search)
    );
  });

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
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFormulas.map(formula => {
            const colorInfo = paintColors.find(c => c.code === formula.MaMau);
            return (
              <div key={formula._id || formula.MaCongThuc} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg shadow-inner"
                      style={{ background: colorInfo?.hex || (/^#[0-9A-F]{6}$/i.test(formula.MaMau) ? formula.MaMau : '#333') }}
                    />
                    <div>
                      <div className="text-sm font-black text-slate-900">{formula.MaMau}</div>
                      <div className="text-xs font-medium text-slate-400">{formula.TenCongThuc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-200">
                      {formula.SanPham?.MaSanPham || 'N/A'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${formula.TrangThai === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {formula.TrangThai || 'Draft'}
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
                    {(formula.ThanhPhan || []).map((comp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium flex items-center gap-2">
                          <Beaker size={14} className="text-slate-400" />
                          {comp.NguyenVatLieu?.TenNguyenVatLieu || 'Unknown'}
                        </span>
                        <div className="flex items-center gap-3 flex-1 ml-4 justify-end">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full" style={{ width: `${comp.TiLe}%` }} />
                          </div>
                          <span className="text-slate-900 font-black min-w-[30px] text-right">{comp.TiLe}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-4">
                    <span>ID: {formula.MaCongThuc}</span>
                    <span>Version: {formula.Version || '1.0'}</span>
                  </div>
                  <span>Cập nhật: {new Date(formula.updatedAt || new Date()).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredFormulas.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl shadow-sm mt-6">
          <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-400 font-medium">Không tìm thấy công thức nào khớp với từ khóa.</p>
        </div>
      )}

      {/* Create Formula Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500">Sản phẩm Sơn *</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={newFormula.SanPham}
                    onChange={e => setNewFormula(p => ({ ...p, SanPham: e.target.value }))}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.MaSanPham} - {p.TenDongSon}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500">Mã Màu Mục tiêu *</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={newFormula.MaMau}
                    onChange={e => handleColorChange(e.target.value)}
                  >
                    <option value="">Chọn mã màu</option>
                    {paintColors.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500">Mã Công Thức</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={newFormula.MaCongThuc}
                    onChange={e => setNewFormula(p => ({ ...p, MaCongThuc: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500">Tên Công Thức</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={newFormula.TenCongThuc}
                    onChange={e => setNewFormula(p => ({ ...p, TenCongThuc: e.target.value }))}
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
                        <option key={m._id} value={m._id}>{m.TenNguyenVatLieu} ({m.PhanLoai})</option>
                      ))}
                    </select>

                    <div className="relative w-28">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all pr-8"
                        placeholder="Tỷ lệ"
                        required
                        min="0"
                        max="100"
                        value={comp.percentage}
                        onChange={e => handleComponentChange(idx, 'percentage', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                    </div>

                    <div className="relative w-32">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all pr-8"
                        placeholder="Khối lượng"
                        required
                        min="0"
                        value={comp.requiredAmount}
                        onChange={e => handleComponentChange(idx, 'requiredAmount', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Kg</span>
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
