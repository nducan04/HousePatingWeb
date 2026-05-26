'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Shield, Wrench, Clock, FileWarning, Plus, X, User, Calendar, FileText, CheckCircle, AlertCircle, Bookmark } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

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
        return toast.error('Vui lòng điền đủ thông tin bắt buộc (Khách hàng, Lỗi, Hạn BH)');
      }
      const res = await api.post('/bao-hanh', formData);
      if (res.data?.success) {
        toast.success('Tạo log bảo hành thành công!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi lưu log bảo hành');
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <Shield size={22} />
             </div>
             Bảo Hành & Hậu Mãi
          </h1>
          <p className="text-slate-400 font-medium mt-1">Quản lý hỗ trợ kỹ thuật B2B và khiếu nại khách hàng</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Lệnh Hỗ Trợ B2B</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.total} <span className="text-sm font-bold text-slate-400">Tickets</span></h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đang Khảo Sát Tận Nhà Máy</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.active} <span className="text-sm font-bold text-slate-400">Tickets</span></h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sửa Lỗi Lớp Sơn Thành Công</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.resolved} <span className="text-sm font-bold text-slate-400">Tickets</span></h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hết Thời Gian Bảo Hành</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.expired} <span className="text-sm font-bold text-slate-400">Tickets</span></h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileWarning size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tra cứu Report ID, Tên KH..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: 'all', label: 'Tất cả Tickets' },
                { id: 'active', label: 'Đang mở Open' },
                { id: 'resolved', label: 'Đã hoàn tất Closed' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                    filter === f.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Tạo Log BH Khách Hàng Gọi Gấp
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Khách Hàng</th>
                <th>Mã Sơn Áp Dụng</th>
                <th>Lỗi Tóm Tắt Tình Hình</th>
                <th>Kỹ Thuật Phụ Trách</th>
                <th className="text-center">Ngày Hết Hạn</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-20 text-blue-600 font-bold">Đang tải dữ liệu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">Không có log bảo hành nào.</td></tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-blue-50/30 group">
                  <td>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[13px]">{item.MaBaoHanh}</span>
                  </td>
                  <td>
                    <div className="font-bold text-slate-900 text-[14px]">{item.KhachHang?.TenKhachHang || 'N/A'}</div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5">{item.KhachHang?.MaKH || '---'}</div>
                  </td>
                  <td>
                    <span className="font-medium text-slate-600">{item.SanPham}</span>
                  </td>
                  <td className="max-w-[200px]">
                    <div className="truncate font-medium text-slate-600" title={item.NoiDungLoi}>
                      {item.NoiDungLoi}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-blue-600 text-[13px]">
                      {item.KyThuatKCS ? item.KyThuatKCS.HoTen : <span className="text-slate-400 font-medium italic">Chưa gán</span>}
                    </div>
                    {item.KyThuatKCS && <div className="text-[11px] text-slate-400 font-medium">{item.KyThuatKCS.MaNV}</div>}
                  </td>
                  <td className="text-center">
                    <span className="font-medium text-slate-500 text-[13px]">
                      {item.HanBaoHanh ? new Date(item.HanBaoHanh).toLocaleDateString() : '---'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`status-badge ${
                      item.TrangThai === 'Đã khắc phục' ? 'status-active' : 
                      item.TrangThai === 'Hết hạn BH' ? 'status-error' : 'status-warning'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.TrangThai === 'Đã khắc phục' ? 'bg-emerald-500' : 
                        item.TrangThai === 'Hết hạn BH' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></div>
                      {item.TrangThai}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end">
                      <button onClick={() => openDetail(item._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Plus size={18} />
                 </div>
                 Tạo Log Bảo Hành Mới
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Chọn Khách Hàng <span className="text-rose-500">*</span></label>
                <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" value={formData.KhachHang} onChange={e => setFormData({ ...formData, KhachHang: e.target.value })}>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.MaKH} - {c.TenKhachHang}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã Sơn / Loại Sản Phẩm</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" placeholder="Vd: Sơn Tĩnh Điện PE Ngoài..." value={formData.SanPham} onChange={e => setFormData({ ...formData, SanPham: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Nội Dung Lỗi / Khiếu Nại <span className="text-rose-500">*</span></label>
                <textarea rows={4} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all resize-none" placeholder="Mô tả chi tiết sự cố..." value={formData.NoiDungLoi} onChange={e => setFormData({ ...formData, NoiDungLoi: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Kỹ Thuật Viên Phụ Trách</label>
                <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" value={formData.KyThuatKCS} onChange={e => setFormData({ ...formData, KyThuatKCS: e.target.value })}>
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.MaNV} - {t.HoTen}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Thời Hạn Bảo Hành <span className="text-rose-500">*</span></label>
                  <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" value={formData.HanBaoHanh} onChange={e => setFormData({ ...formData, HanBaoHanh: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Ngày Mua Hàng</label>
                  <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" value={formData.NgayMua} onChange={e => setFormData({ ...formData, NgayMua: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer">Hủy</button>
              <button onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">Lưu Lệnh Bảo Hành</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-black text-slate-900">{selectedTicket.MaBaoHanh}</h2>
                  <span className={`status-badge ${selectedTicket.TrangThai === 'Đã khắc phục' ? 'status-active' : 'status-warning'}`}>
                    {selectedTicket.TrangThai}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
                  <Clock size={14} /> Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '---'}
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                  <h4 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
                    <Bookmark size={18} className="text-blue-600" /> Thông tin bảo hành
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã Sản Phẩm / Hệ Sơn</label>
                      <div className="text-[15px] font-bold text-slate-900">{selectedTicket.SanPham}</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày Mua</label>
                      <div className="text-[14px] font-bold text-slate-700">{selectedTicket.NgayMua ? new Date(selectedTicket.NgayMua).toLocaleDateString() : '---'}</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hết Hạn Bảo Hành</label>
                      <div className="text-[15px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg inline-block">{selectedTicket.HanBaoHanh ? new Date(selectedTicket.HanBaoHanh).toLocaleDateString() : '---'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                  <h4 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
                    <User size={18} className="text-purple-600" /> Khách hàng & Kỹ thuật
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Khách Hàng</label>
                      <div className="text-[15px] font-bold text-slate-900">{selectedTicket.KhachHang?.TenKhachHang || 'N/A'}</div>
                      <div className="text-[12px] font-bold text-slate-400">{selectedTicket.KhachHang?.MaKH || '---'}</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa chỉ khách hàng</label>
                      <div className="text-[14px] font-medium text-slate-600">{(selectedTicket.KhachHang as any)?.DiaChi || '---'}</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kỹ thuật viên KCS</label>
                      <div className="text-[15px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                        {selectedTicket.KyThuatKCS ? `${selectedTicket.KyThuatKCS.HoTen} (${selectedTicket.KyThuatKCS.MaNV})` : 'Chưa gán'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-[24px] p-6 border border-amber-100">
                <h4 className="text-[15px] font-black text-amber-900 flex items-center gap-2 mb-3">
                  <FileText size={18} /> Log Sự Cố Lỗi Tóm Tắt
                </h4>
                <p className="text-[15px] font-medium text-amber-800 italic leading-relaxed">
                  "{selectedTicket.NoiDungLoi}"
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsDetailOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer shadow-sm border border-slate-200">Đóng chi tiết</button>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all cursor-pointer" onClick={() => toast.info('Chức năng In Ticket đang được phát triển')}>In Biên Bản Kỹ Thuật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
