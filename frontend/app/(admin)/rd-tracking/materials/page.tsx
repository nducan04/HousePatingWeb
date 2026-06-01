'use client';

import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, ArrowLeft, Plus, Beaker, Clipboard, Settings, Package, Droplet, X, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/utils/axiosAuth';
import { toast, confirm } from '@/lib/utils/notification';

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'Resin',
    stock: 0,
    unit: 'thùng',
    cost: 0,
    supplier: ''
  });

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/nguyen-vat-lieu');
      if (res.data.success && res.data.data.length > 0) {
        const mapped = res.data.data.map((item: any) => ({
          id: item.MaNVL || `MAT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          name: item.TenNguyenVatLieu,
          category: item.PhanLoai || 'Resin',
          stock: item.TonKho || 0,
          unit: item.DonViTinh || 'thùng',
          cost: item.DonGia || 0,
          supplier: item.NhaCungCap?.TenNCC || 'Local'
        }));
        setMaterials(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rdMaterials', JSON.stringify(mapped));
        }
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to sync raw materials from DB:', error);
    }

    if (typeof window !== 'undefined') {
      const storedMaterials = localStorage.getItem('rdMaterials');
      if (storedMaterials) {
        setMaterials(JSON.parse(storedMaterials));
        setLoading(false);
      } else {
        // Try to fetch from inventory API
        try {
          const res = await api.get('/inventory/nguyen-vat-lieu');
          if (res.data.success && res.data.data.length > 0) {
            const mapped = res.data.data.map((item: any) => ({
              id: item.MaNVL || `MAT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              name: item.TenNguyenVatLieu,
              category: item.PhanLoai || 'Resin',
              stock: item.TonKho || 0,
              unit: item.DonViTinh || 'thùng',
              cost: item.DonGia || 0,
              supplier: item.NhaCungCap?.TenNCC || 'Local'
            }));
            setMaterials(mapped);
            localStorage.setItem('rdMaterials', JSON.stringify(mapped));
          } else {
            // Fallback to default mock data
            const defaultMaterials = [
              { id: 'MAT-001', name: 'Resin P-2400', category: 'Resin', stock: 500, unit: 'thùng', cost: 120000, supplier: 'DSM' },
              { id: 'MAT-002', name: 'Resin SD-5000', category: 'Resin', stock: 300, unit: 'thùng', cost: 150000, supplier: 'Allnex' },
              { id: 'MAT-003', name: 'Carbon Black N330', category: 'Pigment', stock: 50, unit: 'thùng', cost: 80000, supplier: 'Orion' },
              { id: 'MAT-004', name: 'Titanium Dioxide R-902', category: 'Pigment', stock: 200, unit: 'thùng', cost: 95000, supplier: 'Chemours' },
              { id: 'MAT-005', name: 'Barium Sulfate', category: 'Filler', stock: 1000, unit: 'thùng', cost: 25000, supplier: 'Local' },
              { id: 'MAT-006', name: 'Silica Powder', category: 'Filler', stock: 400, unit: 'thùng', cost: 35000, supplier: 'Local' },
              { id: 'MAT-007', name: 'Benzoin (Degassing)', category: 'Additive', stock: 20, unit: 'thùng', cost: 200000, supplier: 'Evonik' },
              { id: 'MAT-008', name: 'Flow Agent (PV88)', category: 'Additive', stock: 30, unit: 'thùng', cost: 180000, supplier: 'Estron' },
            ];
            setMaterials(defaultMaterials);
            localStorage.setItem('rdMaterials', JSON.stringify(defaultMaterials));
          }
        } catch (error) {
          console.error('Failed to fetch from API, using fallback:', error);
          const defaultMaterials = [
            { id: 'MAT-001', name: 'Resin P-2400', category: 'Resin', stock: 500, unit: 'thùng', cost: 120000, supplier: 'DSM' },
            { id: 'MAT-002', name: 'Resin SD-5000', category: 'Resin', stock: 300, unit: 'thùng', cost: 150000, supplier: 'Allnex' },
            { id: 'MAT-003', name: 'Carbon Black N330', category: 'Pigment', stock: 50, unit: 'thùng', cost: 80000, supplier: 'Orion' },
            { id: 'MAT-004', name: 'Titanium Dioxide R-902', category: 'Pigment', stock: 200, unit: 'thùng', cost: 95000, supplier: 'Chemours' },
            { id: 'MAT-005', name: 'Barium Sulfate', category: 'Filler', stock: 1000, unit: 'thùng', cost: 25000, supplier: 'Local' },
            { id: 'MAT-006', name: 'Silica Powder', category: 'Filler', stock: 400, unit: 'thùng', cost: 35000, supplier: 'Local' },
            { id: 'MAT-007', name: 'Benzoin (Degassing)', category: 'Additive', stock: 20, unit: 'thùng', cost: 200000, supplier: 'Evonik' },
            { id: 'MAT-008', name: 'Flow Agent (PV88)', category: 'Additive', stock: 30, unit: 'thùng', cost: 180000, supplier: 'Estron' },
          ];
          setMaterials(defaultMaterials);
          localStorage.setItem('rdMaterials', JSON.stringify(defaultMaterials));
        }
        setLoading(false);
      }
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm(item);
    } else {
      setEditingId(null);
      setForm({
        id: `MAT-${String(materials.length + 1).padStart(3, '0')}`,
        name: '',
        category: 'Resin',
        stock: 0,
        unit: 'thùng',
        cost: 0,
        supplier: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated = [];
    if (editingId) {
      updated = materials.map(m => m.id === editingId ? form : m);
    } else {
      updated = [...materials, form];
    }
    setMaterials(updated);
    localStorage.setItem('rdMaterials', JSON.stringify(updated));
    setIsModalOpen(false);
    toast.success('✅ Đã lưu nguyên vật liệu!');
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Bạn có chắc muốn xóa nguyên liệu này?')) return;
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    localStorage.setItem('rdMaterials', JSON.stringify(updated));
    toast.success('✅ Đã xóa nguyên liệu!');
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Package size={24} className="text-amber-600" />
              Nguyên vật liệu Pha chế
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Quản lý kho nguyên liệu dành riêng cho R&D</p>
          </div>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} /> Thêm Nguyên liệu
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nguyên liệu, danh mục..."
            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" /> Resin: {materials.filter(m => m.category === 'Resin').length}
          </div>
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600" /> Pigment: {materials.filter(m => m.category === 'Pigment').length}
          </div>
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600" /> Additive: {materials.filter(m => m.category === 'Additive').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã NVL</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Nguyên Liệu</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Danh Mục</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tồn Kho</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Giá Đơn Vị</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nhà Cung Cấp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMaterials.map(material => (
              <tr key={material.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-black text-slate-900">{material.id}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Droplet size={14} className={
                    material.category === 'Resin' ? 'text-blue-500' :
                      material.category === 'Pigment' ? 'text-emerald-500' :
                        material.category === 'Filler' ? 'text-slate-500' : 'text-amber-500'
                  } />
                  {material.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${material.category === 'Resin' ? 'bg-blue-50 text-blue-600' :
                    material.category === 'Pigment' ? 'bg-emerald-50 text-emerald-600' :
                      material.category === 'Filler' ? 'bg-slate-50 text-slate-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {material.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                  {material.stock} <span className="text-slate-400 text-xs">{material.unit}</span>
                </td>
                <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                  {material.cost.toLocaleString('vi-VN')} <span className="text-slate-400 text-xs">đ</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-500">{material.supplier}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openModal(material)} className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(material.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-medium">Không tìm thấy nguyên liệu nào.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package size={20} className="text-amber-600" />
                {editingId ? 'Sửa Nguyên liệu' : 'Thêm Nguyên liệu'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">Mã Nguyên liệu *</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  required
                  disabled={editingId !== null}
                  value={form.id}
                  onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">Tên Nguyên liệu *</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">Danh mục *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  required
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="Resin">Resin</option>
                  <option value="Pigment">Pigment</option>
                  <option value="Filler">Filler</option>
                  <option value="Additive">Additive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500">Tồn kho *</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    min="0"
                    value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500">Đơn vị *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    required
                    value={form.unit}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">Giá đơn vị (đ) *</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  required
                  min="0"
                  value={form.cost}
                  onChange={e => setForm(p => ({ ...p, cost: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">Nhà cung cấp</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                  value={form.supplier}
                  onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((s: any) => (
                    <option key={s._id} value={s.TenNCC}>{s.TenNCC}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}