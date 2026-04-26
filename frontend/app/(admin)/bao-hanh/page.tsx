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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Plus size={16} /> Tạo Log BH Khách Hàng Gọi Gấp
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
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
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaBaoHanh}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.KhachHang?.TenKhachHang || 'N/A'}</td>
                <td style={{ color: '#475569' }}>{item.SanPham}</td>
                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.NoiDungLoi}>{item.NoiDungLoi}</td>
                <td style={{ fontWeight: 600, color: '#94a3b8' }}>{item.KyThuatKCS ? `${item.KyThuatKCS.MaNV} - ${item.KyThuatKCS.HoTen}` : 'Chưa gán'}</td>
                <td>{item.HanBaoHanh ? new Date(item.HanBaoHanh).toLocaleDateString() : '---'}</td>
                <td>
                  <span className={`badge ${item.TrangThai === 'Đã khắc phục' ? 'approved' : item.TrangThai === 'Hết hạn BH' ? 'rejected' : 'testing'}`}>
                    {item.TrangThai}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openDetail(item._id)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', position: 'relative', color: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Tạo Log Bảo Hành Mới</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chọn Khách Hàng *</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.KhachHang} onChange={e => setFormData({ ...formData, KhachHang: e.target.value })}>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.MaKH} - {c.TenKhachHang}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mã Sơn / Loại Sản Phẩm</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} placeholder="Vd: Sơn Tĩnh Điện PE Ngoài..." value={formData.SanPham} onChange={e => setFormData({ ...formData, SanPham: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Nội Dung Lỗi / Khiếu Nại *</label>
                <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} value={formData.NoiDungLoi} onChange={e => setFormData({ ...formData, NoiDungLoi: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Kỹ Thuật Viên Phụ Trách</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.KyThuatKCS} onChange={e => setFormData({ ...formData, KyThuatKCS: e.target.value })}>
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.MaNV} - {t.HoTen}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Thời Hạn Bảo Hành *</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.HanBaoHanh} onChange={e => setFormData({ ...formData, HanBaoHanh: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ngày Mua Hàng</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.NgayMua} onChange={e => setFormData({ ...formData, NgayMua: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button onClick={handleSubmit} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ width: '100%', padding: '12px', fontSize: '16px' }}>Lưu Lệnh Bảo Hành</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '750px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', position: 'relative', color: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#2563eb' }}>{selectedTicket.MaBaoHanh}</h2>
                  <span className={`badge ${selectedTicket.TrangThai === 'Đã khắc phục' ? 'approved' : 'testing'}`}>{selectedTicket.TrangThai}</span>
                </div>
                <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '---'}</span>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Bookmark size={18} /> Thông tin bảo hành</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Mã Sản Phẩm / Hệ Sơn</label><div style={{ fontWeight: 600 }}>{selectedTicket.SanPham}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Ngày Mua</label><div style={{ fontWeight: 600 }}>{selectedTicket.NgayMua ? new Date(selectedTicket.NgayMua).toLocaleDateString() : '---'}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Hết Hạn Bảo Hành</label><div style={{ fontWeight: 600, color: '#e11d48' }}>{selectedTicket.HanBaoHanh ? new Date(selectedTicket.HanBaoHanh).toLocaleDateString() : '---'}</div></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Khách hàng & Kỹ thuật</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Khách Hàng</label><div style={{ fontWeight: 600 }}>{selectedTicket.KhachHang?.TenKhachHang || 'N/A'} ({selectedTicket.KhachHang?.MaKH || '---'})</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Địa chỉ khách hàng</label><div style={{ fontSize: 13 }}>{(selectedTicket.KhachHang as any)?.DiaChi || '---'}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Kỹ thuật viên KCS</label><div style={{ fontWeight: 600, color: '#2563eb' }}>{selectedTicket.KyThuatKCS ? `${selectedTicket.KyThuatKCS.HoTen} (${selectedTicket.KyThuatKCS.MaNV})` : 'Chưa gán'}</div></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24, marginBottom: 24, borderLeft: '4px solid #d97706' }}>
              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Log Sự Cố Lỗi Tóm Tắt</h4>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#0f172a' }}>{selectedTicket.NoiDungLoi}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsDetailOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700">Đóng chi tiết</button>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={() => alert('Chức năng In Ticket đang được phát triển')}>In Biên Bản Kỹ Thuật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

