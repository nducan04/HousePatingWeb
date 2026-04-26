'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Ticket, Percent, Users, Coins, Plus, Edit, Trash2, Calendar, Tag, Trash } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface KhuyenMai {
  _id: string;
  MaVoucher: string;
  LoaiGiamGia: 'PHAN_TRAM' | 'GIAM_THANG' | 'TANG_KEM';
  MucGiam: number;
  GiamToiDa: number;
  DonHangToiThieu: number;
  NgayBatDau: string;
  NgayHetHan: string;
  SoLuongToiDa: number;
  SoLuongDaDung: number;
  TrangThai: 'DANG_DIEN_RA' | 'LEN_LICH' | 'DA_KET_THUC';
  GhiChu?: string;
  NhanVienTao?: { HoTen: string };
  createdAt: string;
}

export default function KhuyenMaiPage() {
  const [vouchers, setVouchers] = useState<KhuyenMai[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    MaVoucher: '',
    LoaiGiamGia: 'PHAN_TRAM',
    MucGiam: 0,
    GiamToiDa: 0,
    DonHangToiThieu: 0,
    NgayBatDau: new Date().toISOString().split('T')[0],
    NgayHetHan: '',
    SoLuongToiDa: 100,
    GhiChu: ''
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/khuyen-mai');
      if (res.data.success) {
        setVouchers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      await api.delete(`/khuyen-mai/${id}`);
      fetchVouchers();
    } catch (error) {
      alert('Lỗi khi xóa voucher');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/khuyen-mai/${formData._id}`, formData);
      } else {
        await api.post('/khuyen-mai', formData);
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi lưu voucher');
    }
  };

  const openEdit = (v: KhuyenMai) => {
    setFormData({
      ...v,
      NgayBatDau: new Date(v.NgayBatDau).toISOString().split('T')[0],
      NgayHetHan: new Date(v.NgayHetHan).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const STATS = {
    total: vouchers.length,
    active: vouchers.filter(d => d.TrangThai === 'DANG_DIEN_RA').length,
    usedVouchers: vouchers.reduce((sum, d) => sum + d.SoLuongDaDung, 0),
    ended: vouchers.filter(d => d.TrangThai === 'DA_KET_THUC').length,
  };

  const filteredData = vouchers.filter(item => {
    const matchSearch = item.MaVoucher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'active' && item.TrangThai === 'DANG_DIEN_RA') ||
      (filter === 'ended' && item.TrangThai === 'DA_KET_THUC');
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Background Mesh (Local override if needed) */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: '300px', height: '300px', background: '#0906c9ff', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none', opacity: 0.4 }}></div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Ticket size={22} /></div>
          <div className="kpi-label">Tổng Chương Trình</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Percent size={22} /></div>
          <div className="kpi-label">Đang Chạy</div>
          <div className="kpi-value">{STATS.active}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-label">Lượt Sử Dụng</div>
          <div className="kpi-value">{STATS.usedVouchers}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Coins size={22} /></div>
          <div className="kpi-label">Khép Lại</div>
          <div className="kpi-value">{STATS.ended}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Tra cứu Mã Voucher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'active', 'ended'].map(f => (
                <button
                  key={f}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                </button>
              ))}
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={() => { setFormData({ MaVoucher: '', LoaiGiamGia: 'PHAN_TRAM', MucGiam: 0, GiamToiDa: 0, DonHangToiThieu: 0, NgayBatDau: new Date().toISOString().split('T')[0], NgayHetHan: '', SoLuongToiDa: 100, GhiChu: '' }); setIsModalOpen(true); }}>
            <Plus size={16} /> Tạo Mã Khuyến Mãi
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Mã Voucher</th>
              <th>Loại Hình</th>
              <th>Mức Giảm</th>
              <th>Giới Hạn / Đã Dùng</th>
              <th>Hiệu Lực</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Đang tải khuyến mãi...</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 800, color: '#2563eb', letterSpacing: 1 }}>{item.MaVoucher}</td>
                <td>{item.LoaiGiamGia === 'PHAN_TRAM' ? 'Phần trăm' : item.LoaiGiamGia === 'GIAM_THANG' ? 'Giảm thẳng' : 'Tặng kèm'}</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                  {item.MucGiam.toLocaleString()}{item.LoaiGiamGia === 'PHAN_TRAM' ? '%' : ' ₫'}
                </td>
                <td>{item.SoLuongDaDung} / {item.SoLuongToiDa} đơn</td>
                <td>
                  <div style={{ fontSize: 16 }}>BĐ: {new Date(item.NgayBatDau).toLocaleDateString()}</div>
                  <div style={{ fontSize: 16 }}>KT: {new Date(item.NgayHetHan).toLocaleDateString()}</div>
                </td>
                <td>
                  <span className={`badge ${item.TrangThai === 'DANG_DIEN_RA' ? 'approved' : item.TrangThai === 'LEN_LICH' ? 'testing' : 'rejected'}`}>
                    {item.TrangThai === 'DANG_DIEN_RA' ? 'Đang chạy' : item.TrangThai === 'LEN_LICH' ? 'Lên lịch' : 'Đã kết thúc'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" onClick={() => openEdit(item)}><Edit size={16} /></button>
                  <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" onClick={() => handleDelete(item._id)}><Trash2 size={16} color="#e11d48" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: 20 }}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '100%', maxWidth: '500px', padding: '2.25rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, background: 'linear-gradient(to right, #0906c9ff, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formData._id ? 'Cập Nhật Voucher' : 'Thiết Lập Voucher'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ padding: 4 }}><Plus size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Mã Code (Public)</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required value={formData.MaVoucher} onChange={e => setFormData({ ...formData, MaVoucher: e.target.value })} placeholder="Vd: SUMMER2024" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Loại giảm giá</label>
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ background: '#000000ff' }} value={formData.LoaiGiamGia} onChange={e => setFormData({ ...formData, LoaiGiamGia: e.target.value })}>
                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                    <option value="GIAM_THANG">Giảm tiền mặt (₫)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Mức giảm</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required value={formData.MucGiam} onChange={e => setFormData({ ...formData, MucGiam: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Giảm tối đa (₫)</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={formData.GiamToiDa} onChange={e => setFormData({ ...formData, GiamToiDa: Number(e.target.value) })} placeholder="0 là không giới hạn" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Đơn tối thiểu (₫)</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={formData.DonHangToiThieu} onChange={e => setFormData({ ...formData, DonHangToiThieu: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Ngày bắt đầu</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={formData.NgayBatDau} onChange={e => setFormData({ ...formData, NgayBatDau: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Ngày hết hạn</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required value={formData.NgayHetHan} onChange={e => setFormData({ ...formData, NgayHetHan: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Số lượng phát hành</label>
                <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required value={formData.SoLuongToiDa} onChange={e => setFormData({ ...formData, SoLuongToiDa: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ flex: 1 }}>Lưu mã giảm giá</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
