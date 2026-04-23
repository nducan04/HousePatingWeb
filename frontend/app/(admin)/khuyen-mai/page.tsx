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
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Tra cứu Mã Voucher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'active', 'ended'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setFormData({ MaVoucher: '', LoaiGiamGia: 'PHAN_TRAM', MucGiam: 0, GiamToiDa: 0, DonHangToiThieu: 0, NgayBatDau: new Date().toISOString().split('T')[0], NgayHetHan: '', SoLuongToiDa: 100, GhiChu: '' }); setIsModalOpen(true); }}>
            <Plus size={16} /> Tạo Mã Khuyến Mãi
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
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
                <td style={{ fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: 1 }}>{item.MaVoucher}</td>
                <td>{item.LoaiGiamGia === 'PHAN_TRAM' ? 'Phần trăm' : item.LoaiGiamGia === 'GIAM_THANG' ? 'Giảm thẳng' : 'Tặng kèm'}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
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
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Edit size={16} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item._id)}><Trash2 size={16} color="var(--accent-rose)" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: 'var(--spacing-xl)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, background: 'linear-gradient(to right, #0906c9ff, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formData._id ? 'Cập Nhật Voucher' : 'Thiết Lập Voucher'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}><Plus size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Mã Code (Public)</label>
                <input type="text" className="form-input" required value={formData.MaVoucher} onChange={e => setFormData({ ...formData, MaVoucher: e.target.value })} placeholder="Vd: SUMMER2024" />
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Loại giảm giá</label>
                  <select className="form-input" style={{ background: '#000000ff' }} value={formData.LoaiGiamGia} onChange={e => setFormData({ ...formData, LoaiGiamGia: e.target.value })}>
                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                    <option value="GIAM_THANG">Giảm tiền mặt (₫)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Mức giảm</label>
                  <input type="number" className="form-input" required value={formData.MucGiam} onChange={e => setFormData({ ...formData, MucGiam: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Giảm tối đa (₫)</label>
                  <input type="number" className="form-input" value={formData.GiamToiDa} onChange={e => setFormData({ ...formData, GiamToiDa: Number(e.target.value) })} placeholder="0 là không giới hạn" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Đơn tối thiểu (₫)</label>
                  <input type="number" className="form-input" value={formData.DonHangToiThieu} onChange={e => setFormData({ ...formData, DonHangToiThieu: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Ngày bắt đầu</label>
                  <input type="date" className="form-input" value={formData.NgayBatDau} onChange={e => setFormData({ ...formData, NgayBatDau: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Ngày hết hạn</label>
                  <input type="date" className="form-input" required value={formData.NgayHetHan} onChange={e => setFormData({ ...formData, NgayHetHan: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 5 }}>Số lượng phát hành</label>
                <input type="number" className="form-input" required value={formData.SoLuongToiDa} onChange={e => setFormData({ ...formData, SoLuongToiDa: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu mã giảm giá</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
