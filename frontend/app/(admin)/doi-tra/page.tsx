'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCcw, Handshake, CheckSquare, XSquare, Plus, X, Package, User, Calendar, FileText, DollarSign, Clock } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface DoiTra {
  _id: string;
  MaDoiTra: string;
  DonHang?: { _id: string, MaDonHang: string, Items?: any[] };
  KhachHang?: { _id: string, MaKH: string, TenKhachHang: string };
  LyDo: string;
  DuKienDenHang?: string;
  GiaTriTru: number;
  NhanVienPhuTrach?: { MaNV: string, HoTen: string };
  TrangThai: string;
  createdAt: string;
}

export default function DoiTraPage() {
  const [data, setData] = useState<DoiTra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<DoiTra | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    DonHang: '',
    KhachHang: '', // Display only or auto-assigned
    TenKhachHang: '', // Display label
    LyDo: '',
    DuKienDenHang: '',
    GiaTriTru: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/doi-tra');
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu đổi trả:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/don-hang');
      if (res.data.success) setOrders(res.data.data);
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({ DonHang: '', KhachHang: '', TenKhachHang: '', LyDo: '', DuKienDenHang: '', GiaTriTru: 0 });
    fetchOrders();
    setIsModalOpen(true);
  };

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    if (order) {
      setFormData({
        ...formData,
        DonHang: orderId,
        KhachHang: order.KhachHang?._id || '',
        TenKhachHang: order.KhachHang?.TenKhachHang || 'N/A'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.DonHang || !formData.LyDo) return alert('Vui lòng điền đủ thông tin bắt buộc');
      const res = await api.post('/doi-tra', formData);
      if (res.data.success) {
        alert('Lập lệnh đổi trả thành công!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Lỗi lưu lệnh đổi trả');
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/doi-tra/${id}`);
      if (res.data.success) {
        setSelectedReturn(res.data.data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết:', error);
    }
  };

  const STATS = {
    total: data.length,
    processing: data.filter(d => d.TrangThai === 'Đang xử lý' || d.TrangThai === 'Yêu cầu mới').length,
    resolved: data.filter(d => d.TrangThai === 'Đã hoàn tiền').length,
    lostValue: data.filter(d => d.TrangThai === 'Đã hoàn tiền').reduce((sum, d) => sum + (d.GiaTriTru || 0), 0),
  };

  const filteredData = data.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const matchSearch = item.MaDoiTra.toLowerCase().includes(searchLow) ||
      item.DonHang?.MaDonHang.toLowerCase().includes(searchLow) ||
      item.KhachHang?.TenKhachHang.toLowerCase().includes(searchLow);

    const matchFilter = filter === 'all' ||
      (filter === 'processing' && (item.TrangThai === 'Đang xử lý' || item.TrangThai === 'Yêu cầu mới')) ||
      (filter === 'resolved' && item.TrangThai === 'Đã hoàn tiền') ||
      (filter === 'rejected' && item.TrangThai === 'Bị từ chối');
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><RefreshCcw size={22} /></div>
          <div className="kpi-label">Tổng Yêu Cầu Đổi Trả</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Handshake size={22} /></div>
          <div className="kpi-label">Đang Xử Lý</div>
          <div className="kpi-value">{STATS.processing}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckSquare size={22} /></div>
          <div className="kpi-label">Đã Chấp Thuận / Bồi thường</div>
          <div className="kpi-value">{STATS.resolved}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><XSquare size={22} /></div>
          <div className="kpi-label">Tổng Tổn Thất Hoàn Trả (VND)</div>
          <div className="kpi-value">{STATS.lostValue.toLocaleString()}</div>
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
                placeholder="Tra cứu Mã Đổi Trả, Đơn Hàng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'processing', label: 'Chờ duyệt' },
                { id: 'resolved', label: 'Đã hoàn tất' },
                { id: 'rejected', label: 'Từ chối (Hủy)' }
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
            <Plus size={16} /> Submit Lệnh Đổi Trả Thủ Công
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>ID Report Đổi Trả</th>
              <th>Mã Đơn Hàng</th>
              <th>Khách Hàng</th>
              <th>Lý Do Đổi Trả</th>
              <th>Dự Kiến Đền</th>
              <th>Nhân Viên Phụ Trách</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy yêu cầu đổi trả nào.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaDoiTra}</td>
                <td style={{ fontWeight: 600, color: '#475569' }}>{item.DonHang?.MaDonHang}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.KhachHang?.TenKhachHang}</td>
                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.LyDo}>{item.LyDo}</td>
                <td style={{ fontWeight: 700, color: item.GiaTriTru > 0 ? '#d97706' : '#94a3b8' }}>{item.GiaTriTru?.toLocaleString() || 0} ₫</td>
                <td style={{ fontWeight: 600, color: '#94a3b8' }}>{item.NhanVienPhuTrach ? `${item.NhanVienPhuTrach.MaNV}` : '---'}</td>
                <td>
                  <span className={`badge ${item.TrangThai === 'Đã hoàn tiền' ? 'approved' : item.TrangThai === 'Bị từ chối' ? 'rejected' : 'testing'}`}>
                    {item.TrangThai}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openDetail(item._id)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Return Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', margin: '2rem auto', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Lập Lệnh Đổi Trả Thủ Công</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chọn Đơn Hàng Gốc</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ width: '100%', background: 'black' }}
                  value={formData.DonHang}
                  onChange={e => handleOrderChange(e.target.value)}
                >
                  <option value="">-- Chọn đơn hàng --</option>
                  {orders.map(o => <option key={o._id} value={o._id}>{o.MaDonHang} - {o.KhachHang?.TenKhachHang}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Khách Hàng</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%', opacity: 0.7 }} value={formData.TenKhachHang} readOnly disabled />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Lý Do Đổi Trả / Khiếu Nại</label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Ghi rõ lỗi sản phẩm hoặc yêu cầu của khách..."
                  value={formData.LyDo}
                  onChange={e => setFormData({ ...formData, LyDo: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Dự Kiến Đền Hàng (Mô tả)</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ width: '100%' }}
                  placeholder="Vd: Đổi 2 thùng sơn mịn xanh, bồi thường 500k..."
                  value={formData.DuKienDenHang}
                  onChange={e => setFormData({ ...formData, DuKienDenHang: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Giá Trị Phải Đền / Cấn Trừ (₫)</label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ width: '100%' }}
                  value={formData.GiaTriTru}
                  onChange={e => setFormData({ ...formData, GiaTriTru: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
                Xác Nhận Xuất Lệnh Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedReturn && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '750px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', margin: '2rem auto', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#2563eb' }}>{selectedReturn.MaDoiTra}</h2>
                  <span className={`badge ${selectedReturn.TrangThai === 'Đã hoàn tiền' ? 'approved' : 'testing'}`}>{selectedReturn.TrangThai}</span>
                </div>
                <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Created: {new Date(selectedReturn.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} /> Thông tin đơn hàng gốc</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Mã Đơn Hàng</label><div style={{ fontWeight: 600 }}>{selectedReturn.DonHang?.MaDonHang}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Danh sách sản phẩm trong đơn</label>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedReturn.DonHang?.Items?.map((p: any, idx: number) => (
                        <div key={idx} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                          <span>{p.SanPham?.TenDongSon}</span>
                          <span style={{ fontWeight: 600 }}>x{p.SoLuong}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Khách hàng & Phụ trách</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Tên Khách Hàng</label><div style={{ fontWeight: 600 }}>{selectedReturn.KhachHang?.TenKhachHang}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Mã Khách Hàng</label><div style={{ fontWeight: 600 }}>{selectedReturn.KhachHang?.MaKH}</div></div>
                  <div><label style={{ fontSize: 12, color: '#475569' }}>Nhân viên phụ trách</label><div style={{ fontWeight: 600, color: '#2563eb' }}>{selectedReturn.NhanVienPhuTrach?.HoTen} ({selectedReturn.NhanVienPhuTrach?.MaNV})</div></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 24, marginBottom: 24, borderLeft: '4px solid #d97706' }}>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Lý Do & Yêu Cầu</h4>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#0f172a' }}>{selectedReturn.LyDo}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Dự Kiến Đền</h4>
                  <div style={{ color: '#059669', fontWeight: 600 }}>{selectedReturn.DuKienDenHang || 'Đang chờ xác nhận hàng đền...'}</div>
                </div>

              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Giá Trị Cấn Trừ</h4>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}><DollarSign size={24} inline-block /> {selectedReturn.GiaTriTru?.toLocaleString()} ₫</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setIsDetailOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700">Đóng chi tiết</button>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={() => alert('Chức năng In Ticket đang được phát triển')}>In Ticket Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

