'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Building2,
  Ribbon,
  Handshake,
  Download,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  X,
  UserCheck,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_URL = '/khach-hang';

interface DoiTac {
  _id?: string;
  MaKH: string;
  TenKhachHang: string;
  PhanLoai: 'B2B' | 'B2C' | 'Đại lý';
  NgaySinh?: string;
  SDT: string;
  DiaChi?: string;
  Email: string;
  MaSoThueCaNhan?: string;
  SoDonHang?: number;
}

export default function DoiTacPage() {
  const [data, setData] = useState<DoiTac[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DoiTac>({
    MaKH: '',
    TenKhachHang: '',
    PhanLoai: 'B2C',
    NgaySinh: '',
    SDT: '',
    DiaChi: '',
    Email: '',
    MaSoThueCaNhan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách khách hàng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: data.length,
    b2b: data.filter(d => d.PhanLoai === 'B2B').length,
    daily: data.filter(d => d.PhanLoai === 'Đại lý').length,
    b2c: data.filter(d => d.PhanLoai === 'B2C').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch =
      item.TenKhachHang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.SDT?.includes(searchTerm);
    const matchFilter = filter === 'all' || item.PhanLoai === filter;
    return matchSearch && matchFilter;
  });

  const openForm = (dt?: DoiTac) => {
    if (dt) {
      setFormData({
        ...dt,
        NgaySinh: dt.NgaySinh ? new Date(dt.NgaySinh).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        MaKH: '',
        TenKhachHang: '',
        PhanLoai: 'B2C',
        NgaySinh: '',
        SDT: '',
        DiaChi: '',
        Email: '',
        MaSoThueCaNhan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (formData._id) {
        await api.put(`${API_URL}/${formData._id}`, formData);
      } else {
        await api.post(API_URL, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Lỗi lưu đối tác:', error);
      alert(error.response?.data?.error || 'Lỗi lưu đối tác');
    }
  };

  const exportToExcel = async () => {
    try {
      const res = await api.get(`/export/customers/excel?search=${encodeURIComponent(searchTerm)}&filter=${encodeURIComponent(filter)}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `VTSC_Danh_Sach_Khach_Hang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Lỗi tải file', err);
      alert('Có lỗi xảy ra khi tải file Excel');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Chắc chắn muốn xóa khách hàng này?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi xóa khách hàng');
      }
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý Đối tác & Khách hàng</h1>
          <p className="text-slate-500 font-medium text-sm">Quản lý danh sách, phân loại và thông tin liên hệ đối tác của VTSC.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <Download size={18} className="text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus size={18} />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng Đối Tác', value: STATS.total, icon: Handshake, color: 'indigo', sub: 'Tất cả phân loại' },
          { label: 'Doanh Nghiệp (B2B)', value: STATS.b2b, icon: Building2, color: 'blue', sub: 'Hợp đồng dài hạn' },
          { label: 'Đại Lý Phân Phối', value: STATS.daily, icon: Ribbon, color: 'purple', sub: 'Kênh trung gian' },
          { label: 'Khách Lẻ (B2C)', value: STATS.b2c, icon: UserCheck, color: 'amber', sub: 'Mua hàng trực tiếp' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {kpi.value} <span className="text-sm font-bold text-slate-400">Đơn vị</span>
                </h3>
                <p className="text-[12px] font-medium text-slate-400 mt-1">{kpi.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                ${kpi.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    kpi.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}
              >
                <kpi.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filter Section */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Tìm tên, mã đối tác..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'B2B', label: 'Doanh nghiệp (B2B)' },
                { id: 'Đại lý', label: 'Đại lý' },
                { id: 'B2C', label: 'Khách lẻ (B2C)' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border ${filter === f.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'border-transparent bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Grid/Table View */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Đang tải dữ liệu khách hàng...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Search size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900">Không tìm thấy kết quả</h3>
            <p className="text-slate-400 font-medium max-w-sm mt-1">Chúng tôi không tìm thấy khách hàng nào khớp với tìm kiếm của bạn. Thử từ khóa khác xem sao?</p>
            <button
              onClick={() => { setSearchTerm(''); setFilter('all'); }}
              className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thông tin khách hàng</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân loại</th>
                  <th className="px-6 py-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sức mua</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Liên hệ</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(item => (
                  <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                          {item.TenKhachHang.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-[15px]">{item.TenKhachHang}</div>
                          <div className="text-[12px] font-bold text-indigo-600/70 mt-0.5 tracking-wide">{item.MaKH}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-tight
                        ${item.PhanLoai === 'B2B' ? 'bg-blue-50 text-blue-600' :
                          item.PhanLoai === 'Đại lý' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}
                      >
                        {item.PhanLoai}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="font-black text-indigo-600 text-[14px] bg-indigo-50/50 inline-block px-3 py-1 rounded-lg">
                        {item.SoDonHang || 0} <span className="text-[10px] text-indigo-400 uppercase ml-0.5">Đơn</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-[13px]">
                          <Phone size={14} className="text-slate-400" /> {item.SDT}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-medium text-[12px]">
                          <Mail size={14} /> {item.Email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2 max-w-[240px]">
                        <MapPin size={14} className="text-slate-400 mt-1 shrink-0" />
                        <span className="text-slate-500 font-medium text-[13px] leading-relaxed line-clamp-2">
                          {item.DiaChi || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openForm(item)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id!)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern Responsive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {formData._id ? 'Cập nhật Đối tác' : 'Thông tin Khách hàng Mới'}
                  </h2>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hồ sơ CRM định danh khách hàng</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Thông tin nhận diện</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Họ và Tên / Tên Pháp Nhân *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      placeholder="VD: Cty TNHH VTSC Aluminium"
                      value={formData.TenKhachHang}
                      onChange={e => setFormData({ ...formData, TenKhachHang: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nhóm Khách Hàng *</label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all cursor-pointer"
                      value={formData.PhanLoai}
                      onChange={e => setFormData({ ...formData, PhanLoai: e.target.value as 'B2B' | 'B2C' | 'Đại lý' })}
                    >
                      <option value="B2C">Khách Lẻ (B2C)</option>
                      <option value="B2B">Doanh Nghiệp (B2B)</option>
                      <option value="Đại lý">Đại lý Phân Phối</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mã Khách Hàng (Tự động)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed outline-none"
                      placeholder="VTSC-KH-XXX"
                      value={formData.MaKH}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ngày sinh / Ngày cấp phép</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      value={formData.NgaySinh}
                      onChange={e => setFormData({ ...formData, NgaySinh: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Thông tin liên hệ */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Kết nối & Liên hệ</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Số điện thoại *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      placeholder="098..."
                      value={formData.SDT}
                      onChange={e => setFormData({ ...formData, SDT: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                      placeholder="example@gmail.com"
                      value={formData.Email}
                      onChange={e => setFormData({ ...formData, Email: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Địa chỉ Giao hàng / Trụ sở</label>
                    <textarea
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all min-h-[100px] resize-none"
                      placeholder="Nhập địa chỉ chi tiết..."
                      value={formData.DiaChi}
                      onChange={e => setFormData({ ...formData, DiaChi: e.target.value })}
                    />
                  </div>
                </div>
              </div>



              {formData.PhanLoai === 'Đại lý' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mã số thuế / Giấy phép KD</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                    placeholder="Nhập MST đối tác..."
                    value={formData.MaSoThueCaNhan || ''}
                    onChange={e => setFormData({ ...formData, MaSoThueCaNhan: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer shadow-sm border border-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
