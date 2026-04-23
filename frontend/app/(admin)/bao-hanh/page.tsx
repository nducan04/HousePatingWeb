'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Shield, Wrench, Clock, FileWarning, Plus, X, User, Calendar, FileText, CheckCircle, AlertCircle, Bookmark } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface BaoHanh {
  _id: string;
  MaBaoHanh: string;
  KhachHang?: { _id: string, MaKH: string, TenKhachHang: string, DiaChi?: string };
  SanPham: string;
  NoiDungLoi: string;
  KyThuatKCS?: { _id: string, MaNV: string, HoTen: string };
  HanBaoHanh: string;
  NgayMua?: string;
  TrangThai: string;
  createdAt: string;
}

export default function BaoHanhPage() {
  const [data, setData] = useState<BaoHanh[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<BaoHanh | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    KhachHang: '',
    SanPham: '',
    NoiDungLoi: '',
    KyThuatKCS: '',
    HanBaoHanh: '',
    NgayMua: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bao-hanh');
      if (res.data?.success) {
        setData(res.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải ticket bảo hành:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [resKH, resNV] = await Promise.all([
        api.get('/khach-hang'),
        api.get('/nhan-vien')
      ]);
      if (resKH.data?.success) setCustomers(resKH.data.data || []);
      if (resNV.data?.success) setTechnicians(resNV.data.data || []);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({ KhachHang: '', SanPham: '', NoiDungLoi: '', KyThuatKCS: '', HanBaoHanh: '', NgayMua: '' });
    fetchDependencies();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.KhachHang || !formData.NoiDungLoi || !formData.HanBaoHanh) {
        return alert('Vui lòng điền đủ thông tin bắt buộc (Khách hàng, Lỗi, Hạn BH)');
      }
      const res = await api.post('/bao-hanh', formData);
      if (res.data?.success) {
        alert('Tạo log bảo hành thành công!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Lỗi lưu log bảo hành');
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/bao-hanh/${id}`);
      if (res.data?.success) {
        setSelectedTicket(res.data.data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết:', error);
    }
  };

  const STATS = {
    total: data.length,
    active: data.filter(d => d.TrangThai === 'Mở' || d.TrangThai === 'Đang khảo sát').length,
    resolved: data.filter(d => d.TrangThai === 'Đã khắc phục').length,
    expired: data.filter(d => d.TrangThai === 'Hết hạn BH').length,
  };

  const filteredData = data.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const matchSearch =
      (item.MaBaoHanh || '').toLowerCase().includes(searchLow) ||
      (item.KhachHang?.TenKhachHang || '').toLowerCase().includes(searchLow) ||
      (item.SanPham || '').toLowerCase().includes(searchLow);

    const matchFilter = filter === 'all' ||
      (filter === 'active' && (item.TrangThai === 'Mở' || item.TrangThai === 'Đang khảo sát')) ||
      (filter === 'resolved' && item.TrangThai === 'Đã khắc phục') ||
      (filter === 'expired' && item.TrangThai === 'Hết hạn BH');
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Shield size={22} /></div>
          <div className="kpi-label">Tổng Lệnh Hỗ Trợ Kỹ Thuật B2B (BH)</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Wrench size={22} /></div>
          <div className="kpi-label">KTV Đang Khảo Sát Tận Nhà Máy Khách</div>
          <div className="kpi-value">{STATS.active}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle size={22} /></div>
          <div className="kpi-label">Sửa Lỗi Lớp Sơn Thành Công Bàn Giao Thêm</div>
          <div className="kpi-value">{STATS.resolved}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><FileWarning size={22} /></div>
          <div className="kpi-label">Yêu Cầu Ngoài Thời Gian BH Hệ Thống Đóng</div>
          <div className="kpi-value">{STATS.expired}</div>
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
                placeholder="Tra cứu Report ID, Name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả Tickets' },
                { id: 'active', label: 'Đang mở Open' },
                { id: 'resolved', label: 'Đã hoàn tất Closed' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Tạo Log BH Khách Hàng Gọi Gấp
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID </th>
              <th>Khách Hàng</th>
              <th>Mã Sơn Áp Dụng</th>
              <th>Lỗi Tóm Tắt Tình Hình</th>
              <th>Kỹ Thuật Phụ Trách</th>
              <th>Ngày Hết Hạn Bảo Hành</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Debug Link</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không có log bảo hành nào.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaBaoHanh}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.KhachHang?.TenKhachHang || 'N/A'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.SanPham}</td>
                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.NoiDungLoi}>{item.NoiDungLoi}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>{item.KyThuatKCS ? `${item.KyThuatKCS.MaNV} - ${item.KyThuatKCS.HoTen}` : 'Chưa gán'}</td>
                <td>{item.HanBaoHanh ? new Date(item.HanBaoHanh).toLocaleDateString() : '---'}</td>
                <td>
                  <span className={`badge ${item.TrangThai === 'Đã khắc phục' ? 'approved' : item.TrangThai === 'Hết hạn BH' ? 'rejected' : 'testing'}`}>
                    {item.TrangThai}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openDetail(item._id)} className="btn btn-ghost btn-sm"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', position: 'relative', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Tạo Log Bảo Hành Mới</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chọn Khách Hàng *</label>
                <select className="form-input" style={{ width: '100%' }} value={formData.KhachHang} onChange={e => setFormData({ ...formData, KhachHang: e.target.value })}>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.MaKH} - {c.TenKhachHang}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mã Sơn / Loại Sản Phẩm</label>
                <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Vd: Sơn Tĩnh Điện PE Ngoài..." value={formData.SanPham} onChange={e => setFormData({ ...formData, SanPham: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Nội Dung Lỗi / Khiếu Nại *</label>
                <textarea className="form-input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} value={formData.NoiDungLoi} onChange={e => setFormData({ ...formData, NoiDungLoi: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Kỹ Thuật Viên Phụ Trách</label>
                <select className="form-input" style={{ width: '100%' }} value={formData.KyThuatKCS} onChange={e => setFormData({ ...formData, KyThuatKCS: e.target.value })}>
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.MaNV} - {t.HoTen}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Thời Hạn Bảo Hành *</label>
                  <input type="date" className="form-input" style={{ width: '100%' }} value={formData.HanBaoHanh} onChange={e => setFormData({ ...formData, HanBaoHanh: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ngày Mua Hàng</label>
                  <input type="date" className="form-input" style={{ width: '100%' }} value={formData.NgayMua} onChange={e => setFormData({ ...formData, NgayMua: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px' }}>Lưu Lệnh Bảo Hành</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '750px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', position: 'relative', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--accent-cyan)' }}>{selectedTicket.MaBaoHanh}</h2>
                  <span className={`badge ${selectedTicket.TrangThai === 'Đã khắc phục' ? 'approved' : 'testing'}`}>{selectedTicket.TrangThai}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '---'}</span>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Bookmark size={18} /> Thông tin bảo hành</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mã Sản Phẩm / Hệ Sơn</label><div style={{ fontWeight: 600 }}>{selectedTicket.SanPham}</div></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ngày Mua</label><div style={{ fontWeight: 600 }}>{selectedTicket.NgayMua ? new Date(selectedTicket.NgayMua).toLocaleDateString() : '---'}</div></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Hết Hạn Bảo Hành</label><div style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>{selectedTicket.HanBaoHanh ? new Date(selectedTicket.HanBaoHanh).toLocaleDateString() : '---'}</div></div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Khách hàng & Kỹ thuật</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Khách Hàng</label><div style={{ fontWeight: 600 }}>{selectedTicket.KhachHang?.TenKhachHang || 'N/A'} ({selectedTicket.KhachHang?.MaKH || '---'})</div></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Địa chỉ khách hàng</label><div style={{ fontSize: 13 }}>{(selectedTicket.KhachHang as any)?.DiaChi || '---'}</div></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Kỹ thuật viên KCS</label><div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{selectedTicket.KyThuatKCS ? `${selectedTicket.KyThuatKCS.HoTen} (${selectedTicket.KyThuatKCS.MaNV})` : 'Chưa gán'}</div></div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderLeft: '4px solid var(--accent-amber)' }}>
              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Log Sự Cố Lỗi Tóm Tắt</h4>
              <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>{selectedTicket.NoiDungLoi}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-ghost">Đóng chi tiết</button>
              <button className="btn btn-primary" onClick={() => alert('Chức năng In Ticket đang được phát triển')}>In Biên Bản Kỹ Thuật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

