'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Camera, X } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface MaMau {
  _id: string;
  MaMau: string;
  TenMau: string;
  HexCode: string;
  TrangThai: boolean;
}

interface SanPham {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  ThuongHieu: string;
  PhanLoai: string;
  DonGiaCoSo: number;
  DanhSachMaMau: MaMau[];
}

export default function SanPhamPage() {
  const [sanPhams, setSanPhams] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    MaSanPham: '',
    TenDongSon: '',
    ThuongHieu: 'AkzoNobel',
    PhanLoai: 'Sơn tĩnh điện',
    DonGiaCoSo: 0,
    MoTa: '',
  });

  const fetchSanPhams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('phanLoai', filterType);
      
      const res = await api.get(`/san-pham-son?${params.toString()}`);
      if (res.data.success) {
        setSanPhams(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching san pham:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSanPhams();
  }, [searchTerm, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/san-pham-son/${formData._id}`, formData);
      } else {
        await api.post('/san-pham-son', formData);
      }
      setIsModalOpen(false);
      fetchSanPhams();
    } catch (error) {
      console.error('Lỗi lưu sản phẩm:', error);
      alert('Có lỗi xảy ra khi lưu!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dòng sơn này?')) return;
    try {
      await api.delete(`/san-pham-son/${id}`);
      fetchSanPhams();
    } catch (error) {
      alert('Không thể xóa sản phẩm!');
    }
  };

  const openForm = (item?: SanPham) => {
    if (item) {
      setFormData({
        _id: item._id,
        MaSanPham: item.MaSanPham,
        TenDongSon: item.TenDongSon,
        ThuongHieu: item.ThuongHieu,
        PhanLoai: item.PhanLoai,
        DonGiaCoSo: item.DonGiaCoSo,
        MoTa: '',
      });
    } else {
      setFormData({
        _id: '',
        MaSanPham: '',
        TenDongSon: '',
        ThuongHieu: 'AkzoNobel',
        PhanLoai: 'Sơn tĩnh điện',
        DonGiaCoSo: 0,
        MoTa: '',
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm dòng sơn, mã màu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm appearance-none outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả phân loại</option>
            <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
            <option value="Sơn tàu biển">Sơn tàu biển</option>
            <option value="Sơn công nghiệp">Sơn công nghiệp</option>
          </select>
        </div>
        <button 
          onClick={() => openForm()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Dòng Sơn</span>
        </button>
      </div>

      {/* DATAGRID */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-sm font-medium text-slate-400">
                <th className="p-4">Mã SP</th>
                <th className="p-4">Tên Dòng Sơn</th>
                <th className="p-4">Phân Loại</th>
                <th className="p-4">Đơn Giá (đ/kg)</th>
                <th className="p-4">Số Mã Màu</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : sanPhams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy sản phẩm nào</td>
                </tr>
              ) : (
                sanPhams.map((sp) => (
                  <tr key={sp._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 font-semibold text-blue-400">{sp.MaSanPham}</td>
                    <td className="p-4">
                      <div>{sp.TenDongSon}</div>
                      <div className="text-xs text-slate-500">{sp.ThuongHieu}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">
                        {sp.PhanLoai}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-400">{sp.DonGiaCoSo.toLocaleString()} ₫</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sp.DanhSachMaMau?.length || 0}</span> màu
                        <button className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Quản lý
                        </button>
                      </div>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => openForm(sp)} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sp._id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-white/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold">{formData._id ? 'Chỉnh sửa Dòng Sơn' : 'Thêm Dòng Sơn Mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Mã sản phẩm *</label>
                  <input required type="text" value={formData.MaSanPham} onChange={e => setFormData({...formData, MaSanPham: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Thương hiệu</label>
                  <input type="text" value={formData.ThuongHieu} onChange={e => setFormData({...formData, ThuongHieu: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Tên dòng sơn *</label>
                <input required type="text" value={formData.TenDongSon} onChange={e => setFormData({...formData, TenDongSon: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Phân loại</label>
                  <select value={formData.PhanLoai} onChange={e => setFormData({...formData, PhanLoai: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                    <option value="Sơn tàu biển">Sơn tàu biển</option>
                    <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Đơn giá cơ sở (VNĐ)</label>
                  <input required type="number" min="0" value={formData.DonGiaCoSo} onChange={e => setFormData({...formData, DonGiaCoSo: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
