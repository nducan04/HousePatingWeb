'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Wallet, Mail, Phone, MapPin } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface KhachHang {
  _id: string;
  MaKH: string;
  PhanLoai: string;
  TenKhachHang: string;
  Email: string;
  SDT: string;
  DiaChi: string;
  WalletAddress: string;
  AccountID?: { TenDangNhap: string; VaiTro: string; TrangThai: boolean };
}

export default function DoiTacPage() {
  const [khachHangs, setKhachHangs] = useState<KhachHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    MaKH: '',
    PhanLoai: 'B2C',
    TenKhachHang: '',
    Email: '',
    SDT: '',
    DiaChi: '',
    WalletAddress: '',
  });

  const fetchKhachHang = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('phanLoai', filterType);
      
      const res = await api.get(`/khach-hang?${params.toString()}`);
      if (res.data.success) {
        setKhachHangs(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching khach hang:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhachHang();
  }, [searchTerm, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate wallet address for B2B if provided
      if (formData.PhanLoai === 'B2B' && formData.WalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(formData.WalletAddress)) {
        alert('Địa chỉ ví MetaMask không hợp lệ (Phải bắt đầu bằng 0x và dài 42 ký tự)');
        return;
      }

      if (formData._id) {
        await api.put(`/khach-hang/${formData._id}`, formData);
      } else {
        await api.post('/khach-hang', formData);
      }
      setIsModalOpen(false);
      fetchKhachHang();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Có lỗi xảy ra khi lưu';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đối tác này?')) return;
    try {
      await api.delete(`/khach-hang/${id}`);
      fetchKhachHang();
    } catch (error) {
      alert('Không thể xóa dữ liệu!');
    }
  };

  const openForm = (item?: KhachHang) => {
    if (item) {
      setFormData({
        _id: item._id,
        MaKH: item.MaKH || '',
        PhanLoai: item.PhanLoai || 'B2C',
        TenKhachHang: item.TenKhachHang || '',
        Email: item.Email || '',
        SDT: item.SDT || '',
        DiaChi: item.DiaChi || '',
        WalletAddress: item.WalletAddress || '',
      });
    } else {
      setFormData({
        _id: '',
        MaKH: '',
        PhanLoai: 'B2C',
        TenKhachHang: '',
        Email: '',
        SDT: '',
        DiaChi: '',
        WalletAddress: '',
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
              placeholder="Tìm kiếm mã, tên, email..." 
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
            <option value="B2B">Khách hàng B2B</option>
            <option value="B2C">Khách hàng B2C</option>
          </select>
        </div>
        <button 
          onClick={() => openForm()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng</span>
        </button>
      </div>

      {/* DATAGRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Đang tải dữ liệu...</div>
        ) : khachHangs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white/5 rounded-xl border border-white/5">
            Không tìm thấy đối tác nào
          </div>
        ) : (
          khachHangs.map(kh => (
            <div key={kh._id} className="card p-5 group hover:border-blue-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                    kh.PhanLoai === 'B2B' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-blue-500/30 text-blue-500 bg-blue-500/5'
                  }`}>
                    {kh.PhanLoai}
                  </span>
                  <div className="text-xs text-slate-500 mt-2 font-mono">{kh.MaKH}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(kh)} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(kh._id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              
              <h3 className="font-semibold text-lg line-clamp-1 mb-4" title={kh.TenKhachHang}>{kh.TenKhachHang}</h3>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate" title={kh.Email}>{kh.Email || '---'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{kh.SDT || '---'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate" title={kh.DiaChi}>{kh.DiaChi || '---'}</span>
                </div>
                {kh.PhanLoai === 'B2B' && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-3 pt-3 border-t border-white/5">
                    <Wallet className="w-4 h-4 text-amber-500/70 shrink-0" />
                    <span className="truncate font-mono text-xs text-amber-400/80" title={kh.WalletAddress}>
                      {kh.WalletAddress ? `${kh.WalletAddress.substring(0, 6)}...${kh.WalletAddress.substring(38)}` : 'Chưa liên kết ví'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold">{formData._id ? 'Chỉnh sửa Đối tác' : 'Thêm Đầu mối Khách hàng'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Mã KH *</label>
                  <input required type="text" value={formData.MaKH} onChange={e => setFormData({...formData, MaKH: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 uppercase" placeholder="VD: KH-B2B-001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Phân loại *</label>
                  <select value={formData.PhanLoai} onChange={e => setFormData({...formData, PhanLoai: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="B2B">Doanh nghiệp (B2B)</option>
                    <option value="B2C">Cá nhân (B2C)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Tên Đối tác / Khách hàng *</label>
                <input required type="text" value={formData.TenKhachHang} onChange={e => setFormData({...formData, TenKhachHang: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Công ty TNHH..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Số ĐT</label>
                  <input type="text" value={formData.SDT} onChange={e => setFormData({...formData, SDT: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Email</label>
                  <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Địa chỉ</label>
                <input type="text" value={formData.DiaChi} onChange={e => setFormData({...formData, DiaChi: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {formData.PhanLoai === 'B2B' && (
                <div className="space-y-1.5 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mt-4">
                  <label className="text-sm text-amber-200/80 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Định danh Blockchain (Ví MetaMask)
                  </label>
                  <p className="text-xs text-amber-200/50 mb-2">Bắt buộc để ký Hợp đồng thông minh trên mạng lưới</p>
                  <input type="text" value={formData.WalletAddress} onChange={e => setFormData({...formData, WalletAddress: e.target.value})} className="w-full bg-slate-900/50 border border-amber-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono text-amber-100" placeholder="0x..." />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
