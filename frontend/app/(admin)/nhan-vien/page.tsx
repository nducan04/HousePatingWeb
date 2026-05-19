'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Briefcase, Award, CheckCircle2, Download } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_URL = '/nhan-vien';

interface NhanVien {
  _id?: string;
  MaNV: string;
  HoTen: string;
  NgaySinh?: string;
  GioiTinh?: string;
  Email?: string;
  SDT?: string;
  DiaChi?: string;
  BoPhan: string;
  MoTaCongViec?: string;
  Avatar?: string;
  ChucVu?: string;
  TrangThai?: string;
  revenue?: number;
  deliveries?: number;
  tests?: number;
  orders?: number;
  customers?: number;
}

export default function NhanVienPage() {
  const [data, setData] = useState<NhanVien[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const getAvatarUrl = (path: string) => {
    if (!path || path === 'undefined' || path === 'null') return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const origin = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000';
    return `${origin}${cleanPath}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<NhanVien>({
    MaNV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: 'Nam',
    Email: '',
    SDT: '',
    DiaChi: '',
    BoPhan: 'Sale / MKT',
    ChucVu: '',
    MoTaCongViec: '',
    Avatar: '',
    TrangThai: 'Đang làm'
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) {
        let staffList = res.data.data;

        // Fetch performance stats
        try {
          const statsRes = await api.get('/hieu-suat/stats');
          if (statsRes.data.success) {
            const performanceData = statsRes.data.staff || [];
            staffList = staffList.map((nv: any) => {
              const perf = performanceData.find((p: any) => p.id === nv._id);
              return {
                ...nv,
                revenue: perf ? perf.revenue : 0,
                deliveries: perf ? perf.deliveries : 0,
                tests: perf ? perf.tests : 0,
                orders: perf ? perf.orders : 0,
                customers: perf ? perf.customers : 0
              };
            });
          }
        } catch (err) {
          console.error('Lỗi tải chỉ số hiệu suất:', err);
        }

        setData(staffList);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: data.length,
    active: data.filter(d => d.TrangThai === 'Đang làm' || !d.TrangThai).length,
    sale: data.filter(d => d.BoPhan === 'Sale / MKT' || d.BoPhan === 'CSKH Bảo Hành').length,
    tech: data.filter(d => d.BoPhan === 'R&D Kỹ Thuật Máy' || d.BoPhan === 'Kho / Logistics').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaNV?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchFilter = true;
    if (filter !== 'all') {
      if (filter === 'sale_mkt') matchFilter = item.BoPhan === 'Sale / MKT';
      if (filter === 'ketoan') matchFilter = item.BoPhan === 'Kế Toán';
      if (filter === 'cskh') matchFilter = item.BoPhan === 'CSKH Bảo Hành';
      if (filter === 'logistics') matchFilter = item.BoPhan === 'Kho / Logistics';
      if (filter === 'tech_sx') matchFilter = item.BoPhan === 'R&D Kỹ Thuật Máy';
    }

    return matchSearch && matchFilter;
  });

  const exportToExcel = () => {
    const dataToExport = filteredData.map(nv => ({
      'Mã NV': nv.MaNV,
      'Họ Tên': nv.HoTen,
      'Bộ Phận': nv.BoPhan,
      'Chức Vụ': nv.ChucVu,
      'Email': nv.Email || '',
      'SĐT': nv.SDT || '',
      'Trạng Thái': nv.TrangThai || 'Đang làm',
      'Hiệu suất Công tác': 
        nv.BoPhan === 'Kho / Logistics' ? `${nv.deliveries || 0} Chuyến` : 
        (nv.BoPhan === 'R&D Kỹ Thuật Máy' ? `${nv.tests || 0} Lô hàng` : 
        (nv.BoPhan === 'CSKH Bảo Hành' ? `${nv.customers || 0} Khách hàng` : 
        `${nv.orders || 0} Đơn hàng`))
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nhan-Vien");
    XLSX.writeFile(workbook, `VTSC_Danh_Sach_Nhan_Vien_${new Date().toLocaleDateString()}.xlsx`);
  };

  const openForm = (nv?: NhanVien) => {
    if (nv) {
      setFormData({
        ...nv,
        NgaySinh: nv.NgaySinh ? new Date(nv.NgaySinh).toISOString().split('T')[0] : '',
        GioiTinh: nv.GioiTinh || 'Nam',
        MoTaCongViec: nv.MoTaCongViec || '',
        TrangThai: nv.TrangThai || 'Đang làm'
      });
    } else {
      setFormData({
        MaNV: 'NV' + Date.now().toString().slice(-4),
        HoTen: '',
        NgaySinh: '',
        GioiTinh: 'Nam',
        Email: '',
        SDT: '',
        DiaChi: '',
        BoPhan: 'Sale / MKT',
        ChucVu: '',
        MoTaCongViec: '',
        Avatar: '',
        TrangThai: 'Đang làm'
      });
    }
    setIsModalOpen(true);
  };

  const openView = (nv: NhanVien) => {
    setFormData({
      ...nv,
      NgaySinh: nv.NgaySinh ? new Date(nv.NgaySinh).toISOString().split('T')[0] : ''
    });
    setIsViewModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append('image', file);

    try {
      setIsUploading(true);
      const res = await api.post('/files/upload-image', fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData({ ...formData, Avatar: res.data.url });
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      alert('Không thể upload ảnh, vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
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
      console.error('Lỗi lưu nhân viên:', error);
      alert(error.response?.data?.error || 'Lỗi lưu nhân viên');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Chắc chắn muốn xóa nhân viên này?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi xóa nhân viên');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-blue-950/10 border border-blue-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_45%)]"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
              <Users size={24} />
            </div>
            Quản lý Đội ngũ Nhân sự
          </h1>
          <p className="text-slate-350 font-medium mt-2 max-w-xl">
            Hệ thống phân quyền, theo dõi chỉ số hoạt động và tối ưu hóa hiệu suất làm việc của toàn bộ nhân viên.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Tổng nhân sự</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {STATS.total} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">Biên chế</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-50/50 w-fit px-3 py-1 rounded-xl">
            <span className="bg-emerald-100 px-1.5 py-0.5 rounded-lg">+2.5%</span>
            <span>Tăng trưởng quy mô</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Đang làm việc</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {STATS.active} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">Nhân sự</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>Tỷ lệ hoạt động</span>
              <span className="text-emerald-600">{STATS.total > 0 ? Math.round((STATS.active / STATS.total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${STATS.total > 0 ? (STATS.active / STATS.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Kinh doanh & CSKH</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {STATS.sale} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">Nhân sự</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Briefcase size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1">
            <div className="flex -space-x-2 mr-2">
              {[...Array(Math.min(4, STATS.sale))].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-black text-white shadow-sm uppercase">
                  {`S${i+1}`}
                </div>
              ))}
              {STATS.sale > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm">
                  +{STATS.sale - 4}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-400">Lực lượng cốt lõi</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Sản xuất & Kỹ thuật</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {STATS.tech} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block sm:inline ml-0.5">Nhân sự</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-inner">
              <Award size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-amber-600 text-xs font-extrabold">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Award key={i} size={13} className={i <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
              ))}
            </div>
            <span className="text-slate-400 font-bold">R&D & Vận hành kho</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Search and Quick Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1">
            <div className="relative w-full lg:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                placeholder="Tìm mã NV, họ tên, điện thoại..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl border border-slate-100">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'sale_mkt', label: 'Sale & MKT' },
                { id: 'ketoan', label: 'Kế Toán' },
                { id: 'cskh', label: 'CSKH / Bảo Hành' },
                { id: 'logistics', label: 'Kho / Logistics' },
                { id: 'tech_sx', label: 'R&D Kỹ Thuật' },
              ].map(f => (
                <button
                  key={f.id}
                  className={`px-4.5 py-2.5 rounded-xl text-[12px] font-black tracking-tight transition-all duration-200 ${
                    filter === f.id 
                      ? 'bg-white text-blue-600 shadow-md shadow-slate-100 border border-slate-100/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToExcel} 
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-[13px] border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-100"
            >
              <Download size={16} /> Xuất Báo Cáo
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
              onClick={() => openForm()}
            >
              <Plus size={16} /> Khai báo Nhân Sự
            </button>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Ảnh</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32">Mã Nhân Sự</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Họ & Tên</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Bộ Phận / Chức Danh</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right w-44">Chỉ số Hiệu Suất</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-36">Trạng thái</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-bold text-slate-400">Đang tải hồ sơ nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Users size={28} />
                      </div>
                      <h4 className="text-[15px] font-black text-slate-700 mt-2">Không tìm thấy dữ liệu</h4>
                      <p className="text-xs text-slate-400 font-bold">Thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item._id} className="hover:bg-blue-50/20 transition-all duration-200 group">
                    {/* Avatar */}
                    <td className="px-6 py-4.5 text-center">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md mx-auto group-hover:scale-110 group-hover:rotate-1 transition-all duration-300 ring-2 ring-slate-100">
                        {item.Avatar ? (
                          <img
                            src={getAvatarUrl(item.Avatar)}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.HoTen) + '&background=random';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-[15px] uppercase">
                            {item.HoTen.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-blue-600 border border-blue-100 shadow-sm uppercase tracking-wide">
                        {item.MaNV}
                      </span>
                    </td>

                    {/* Name & Birthday */}
                    <td className="px-6 py-4.5">
                      <div 
                        className="font-bold text-slate-900 text-[15px] cursor-pointer hover:text-blue-600 transition-colors inline-block"
                        onClick={() => openView(item)}
                      >
                        {item.HoTen}
                      </div>
                      <div className="text-[11px] text-slate-400 font-extrabold mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>{item.GioiTinh}</span>
                        <span>•</span>
                        <span>{item.NgaySinh ? new Date(item.NgaySinh).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      </div>
                    </td>

                    {/* Department / Role */}
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-slate-800 text-[14px]">{item.ChucVu || 'Nhân viên'}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight bg-slate-100 border border-slate-200/50 text-slate-500 mt-1.5">
                        {item.BoPhan}
                      </span>
                    </td>

                    {/* Email / SDT */}
                    <td className="px-6 py-4.5">
                      <div className="text-[13px] font-bold text-slate-600">{item.Email || '—'}</div>
                      <div className="text-[12px] font-black text-slate-400 mt-1">{item.SDT || '—'}</div>
                    </td>

                    {/* Performance Metrics */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="font-black text-slate-800 text-[14.5px]">
                          {item.BoPhan === 'Kho / Logistics' && (
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl text-xs">{item.deliveries || 0} Chuyến hàng</span>
                          )}
                          {item.BoPhan === 'R&D Kỹ Thuật Máy' && (
                            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-xl text-xs">{item.tests || 0} Lô nghiên cứu</span>
                          )}
                          {item.BoPhan === 'CSKH Bảo Hành' && (
                            <span className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-xl text-xs">{item.customers || 0} Khách hỗ trợ</span>
                          )}
                          {(!['Kho / Logistics', 'R&D Kỹ Thuật Máy', 'CSKH Bảo Hành'].includes(item.BoPhan)) && (
                            <div className="space-y-1">
                              <div className="text-slate-800 font-black">{item.orders || 0} Đơn đặt</div>
                              <div className="text-[11.5px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-lg inline-block">
                                {(item.revenue || 0).toLocaleString("vi-VN")} ₫
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-tight shadow-sm border ${
                        item.TrangThai === 'Đang làm' || !item.TrangThai 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : item.TrangThai === 'Đang nghỉ phép'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          item.TrangThai === 'Đang làm' || !item.TrangThai ? 'bg-emerald-500' : 
                          item.TrangThai === 'Đang nghỉ phép' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                        {item.TrangThai || 'Đang làm'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => openForm(item)} 
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id!)} 
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Xóa nhân sự"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - HỒ SƠ CHI TIẾT */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            {/* Dossier Header */}
            <div className="h-28 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 flex justify-between items-start relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_40%)]"></div>
              <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest relative z-10">Dossier / Hồ sơ</h2>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold flex items-center justify-center transition-colors relative z-10 border-none outline-none"
              >
                ×
              </button>
            </div>
            
            {/* Dossier Body */}
            <div className="px-8 pb-8 pt-0 relative space-y-6">
              <div className="flex justify-center -mt-16">
                <div className="w-28 h-28 rounded-[24px] overflow-hidden border-4 border-white shadow-xl bg-slate-50 ring-4 ring-slate-100">
                  <img 
                    src={getAvatarUrl(formData.Avatar || '')} 
                    alt={formData.HoTen} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.HoTen) + '&background=random';
                    }}
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{formData.HoTen}</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-100/50 mt-1.5 uppercase tracking-wide">
                  {formData.MaNV}
                </span>
              </div>

              <div className="space-y-0.5 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                {[
                  { label: 'Bộ phận', value: formData.BoPhan, highlight: true },
                  { label: 'Chức danh', value: formData.ChucVu || 'Nhân viên' },
                  { label: 'Giới tính', value: formData.GioiTinh },
                  { label: 'Ngày sinh', value: formData.NgaySinh ? new Date(formData.NgaySinh).toLocaleDateString('vi-VN') : '—' },
                  { label: 'Email liên hệ', value: formData.Email },
                  { label: 'Số điện thoại', value: formData.SDT },
                  { label: 'Trạng thái', value: formData.TrangThai || 'Đang làm' },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <span className={`text-[13px] font-black ${row.highlight ? 'text-blue-600' : 'text-slate-800'}`}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="px-8 py-3 bg-slate-955 text-white rounded-2xl font-black text-[13px] hover:bg-slate-800 transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer border-none"
              >
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - THÊM / CẬP NHẬT NHÂN SỰ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-blue-600 rounded-full"></div>
                  {formData._id ? 'Cập nhật thông tin nhân viên' : 'Khai báo nhân sự mới'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold flex items-center justify-center transition-colors border-none outline-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Form Scroll Area */}
              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Upload Avatar Group */}
                  <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 transition-all duration-300 cursor-pointer relative overflow-hidden group">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                    {formData.Avatar ? (
                      <div className="relative group/avatar">
                        <img 
                          src={getAvatarUrl(formData.Avatar)} 
                          alt="Avatar" 
                          className="w-28 h-28 rounded-[24px] object-cover shadow-lg border-4 border-white" 
                        />
                        <div className="absolute inset-0 bg-slate-955/40 rounded-[24px] flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                          <Plus className="text-white" size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-105 shadow-sm border border-slate-100 transition-all mb-3">
                          <Plus size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-500">Tải lên ảnh chân dung của nhân sự</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Định dạng JPG, PNG dung lượng dưới 5MB</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-2">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-blue-600">Đang lưu hình ảnh...</p>
                      </div>
                    )}
                  </div>

                  {/* HoTen */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="Nhập họ và tên đầy đủ"
                      value={formData.HoTen} 
                      onChange={e => setFormData({...formData, HoTen: e.target.value})} 
                    />
                  </div>

                  {/* MaNV */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã nhân sự</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase" 
                      placeholder="Mã định danh"
                      value={formData.MaNV} 
                      onChange={e => setFormData({...formData, MaNV: e.target.value})} 
                    />
                  </div>

                  {/* BoPhan */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bộ phận công tác</label>
                    <select 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      value={formData.BoPhan} 
                      onChange={e => setFormData({...formData, BoPhan: e.target.value})}
                    >
                      <option value="Sale / MKT">Sale / MKT</option>
                      <option value="Kế Toán">Kế Toán</option>
                      <option value="CSKH Bảo Hành">CSKH Bảo Hành</option>
                      <option value="Kho / Logistics">Kho / Logistics</option>
                      <option value="R&D Kỹ Thuật Máy">R&D Kỹ Thuật Máy</option>
                    </select>
                  </div>

                  {/* ChucVu */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Chức danh / Vị trí</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="Trưởng phòng, Chuyên viên..."
                      value={formData.ChucVu} 
                      onChange={e => setFormData({...formData, ChucVu: e.target.value})} 
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="tuyen.nv@vtsc.com"
                      value={formData.Email} 
                      onChange={e => setFormData({...formData, Email: e.target.value})} 
                    />
                  </div>

                  {/* SDT */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="09xx xxx xxx"
                      value={formData.SDT} 
                      onChange={e => setFormData({...formData, SDT: e.target.value})} 
                    />
                  </div>

                  {/* NgaySinh */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày sinh nhật</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      value={formData.NgaySinh} 
                      onChange={e => setFormData({...formData, NgaySinh: e.target.value})} 
                    />
                  </div>

                  {/* TrangThai */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái công tác</label>
                    <select 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      value={formData.TrangThai} 
                      onChange={e => setFormData({...formData, TrangThai: e.target.value})}
                    >
                      <option value="Đang làm">Đang làm</option>
                      <option value="Đang nghỉ phép">Đang nghỉ phép</option>
                      <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                    </select>
                  </div>

                  {/* MoTaCongViec */}
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả công việc / Nhiệm vụ phụ trách</label>
                    <textarea 
                      rows={3} 
                      className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none" 
                      placeholder="Mô tả tóm tắt nhiệm vụ được phân công..."
                      value={formData.MoTaCongViec} 
                      onChange={e => setFormData({...formData, MoTaCongViec: e.target.value})}
                    ></textarea>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[13px] hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
                >
                  Lưu hồ sơ
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
