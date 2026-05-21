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
    
    // IPFS support
    if (path.startsWith("ipfs://")) {
      return path.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    if (path.startsWith("Qm") || path.startsWith("bafy")) {
      return `https://gateway.pinata.cloud/ipfs/${path}`;
    }

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <Users size={22} />
             </div>
             Quản lý Nhân sự
          </h1>
          <p className="text-slate-400 font-medium mt-1">Theo dõi, quản lý và tối ưu hiệu suất đội ngũ nhân sự</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng nhân sự</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.total} <span className="text-sm font-bold text-slate-400">Biên chế</span></h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[13px] font-bold">
            <span className="bg-emerald-50 px-2 py-0.5 rounded-lg">+2.5%</span>
            <span>So với tháng trước</span>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đang công tác</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.active} <span className="text-sm font-bold text-slate-400">Nhân sự</span></h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-slate-400 text-[13px] font-bold">
            <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${STATS.total > 0 ? (STATS.active / STATS.total) * 100 : 0}%` }}></div>
            </div>
            <span>{STATS.total > 0 ? Math.round((STATS.active / STATS.total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kinh doanh & Dịch vụ</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.sale} <span className="text-sm font-bold text-slate-400">Nhân sự</span></h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="mt-4 flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U{i}</div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">+{Math.max(0, STATS.sale - 4)}</div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sản xuất & Cung ứng</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.tech} <span className="text-sm font-bold text-slate-400">Nhân sự</span></h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-[13px] font-bold">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(i => <Award key={i} size={14} className={i <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
            </div>
            <span className="text-slate-400">Hiệu suất cao</span>
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
                placeholder="Tìm mã NV, tên, bộ phận..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'sale_mkt', label: 'Sale / MKT' },
                { id: 'ketoan', label: 'Kế Toán' },
                { id: 'cskh', label: 'Bảo Hành' },
                { id: 'logistics', label: 'Kho / Logistics' },
                { id: 'tech_sx', label: 'Kỹ Thuật' },
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

          <div className="flex items-center gap-3">
            <button 
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
            >
              <Download size={18} /> Xuất Excel
            </button>
            <button 
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              onClick={() => openForm()}
            >
              <Plus size={18} /> Cấp mới Tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="w-20 text-center">Ảnh</th>
                <th>Mã NV</th>
                <th>Thông tin nhân sự</th>
                <th>Chức danh / Bộ phận</th>
                <th>Email / SĐT</th>
                <th className="text-right">Hiệu suất</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-20 text-blue-600 font-bold">Đang tải dữ liệu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">Không tìm thấy nhân viên.</td></tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-blue-50/30 group">
                  <td className="text-center">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm mx-auto group-hover:scale-105 transition-transform">
                      {item.Avatar ? (
                        <img
                          src={getAvatarUrl(item.Avatar)}
                          alt="Ava"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.HoTen) + '&background=random';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold">
                          {item.HoTen.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[13px]">{item.MaNV}</span>
                  </td>
                  <td className="min-w-[200px]">
                    <div className="font-bold text-slate-900 text-[15px] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => openView(item)}>
                      {item.HoTen}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{item.GioiTinh} • {item.NgaySinh ? new Date(item.NgaySinh).toLocaleDateString('vi-VN') : 'N/A'}</div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800 text-[14px]">{item.ChucVu || 'Nhân viên'}</div>
                    <div className="text-[12px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">{item.BoPhan}</div>
                  </td>
                  <td>
                    <div className="text-[14px] font-medium text-slate-600">{item.Email}</div>
                    <div className="text-[13px] font-bold text-slate-400 mt-0.5">{item.SDT}</div>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="font-black text-slate-900 text-[16px]">
                        {item.BoPhan === 'Kho / Logistics' && `${item.deliveries || 0} Chuyến`}
                        {item.BoPhan === 'R&D Kỹ Thuật Máy' && `${item.tests || 0} Lô hàng`}
                        {item.BoPhan === 'CSKH Bảo Hành' && `${item.customers || 0} Khách hàng`}
                        {(item.BoPhan === 'Sale / MKT' || item.BoPhan === 'Kinh doanh' || !['Kho / Logistics', 'R&D Kỹ Thuật Máy', 'CSKH Bảo Hành'].includes(item.BoPhan)) && (
                          <div className="flex flex-col items-end">
                            <span>{item.orders || 0} Đơn hàng</span>
                            <span className="text-[12px] text-emerald-600 font-extrabold mt-0.5">
                              {item.revenue ? item.revenue.toLocaleString() : 0} ₫
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`status-badge ${
                      item.TrangThai === 'Đang làm' || !item.TrangThai ? 'status-active' : 
                      item.TrangThai === 'Đang nghỉ phép' ? 'status-warning' : 'status-error'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.TrangThai === 'Đang làm' || !item.TrangThai ? 'bg-emerald-500' : 
                        item.TrangThai === 'Đang nghỉ phép' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></div>
                      {item.TrangThai || 'Đang làm'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openForm(item)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item._id!)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Xem Chi Tiết Thông Tin Nhân Viên */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">HỒ SƠ NHÂN SỰ</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">×</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-[24px] overflow-hidden border-4 border-white shadow-xl">
                   <img src={getAvatarUrl(formData.Avatar || '')} alt={formData.HoTen} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Họ và tên', value: formData.HoTen },
                  { label: 'Mã nhân viên', value: formData.MaNV },
                  { label: 'Bộ phận', value: formData.BoPhan },
                  { label: 'Chức vụ', value: formData.ChucVu },
                  { label: 'Email', value: formData.Email },
                  { label: 'Số điện thoại', value: formData.SDT },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                    <span className="text-[15px] font-bold text-slate-800">{row.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 flex justify-center">
              <button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Cập nhật thông tin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-black text-slate-900">{formData._id ? 'Cập nhật Nhân viên' : 'Thêm Nhân viên mới'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">×</button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avatar Upload */}
                  <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-colors cursor-pointer relative overflow-hidden">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                    {formData.Avatar ? (
                      <div className="relative group/avatar">
                        <img src={getAvatarUrl(formData.Avatar)} alt="Avatar" className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white" />
                        <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                          <Plus className="text-white" size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors mb-3">
                          <Plus size={28} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Tải ảnh đại diện</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-2">
                           <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                           <p className="text-xs font-bold text-blue-600">Đang tải lên...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Họ và tên</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.HoTen} onChange={e => setFormData({...formData, HoTen: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã nhân viên</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.MaNV} onChange={e => setFormData({...formData, MaNV: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Bộ phận</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.BoPhan} onChange={e => setFormData({...formData, BoPhan: e.target.value})}>
                      <option value="Sale / MKT">Sale / MKT</option>
                      <option value="Kế Toán">Kế Toán</option>
                      <option value="CSKH Bảo Hành">CSKH Bảo Hành</option>
                      <option value="Kho / Logistics">Kho / Logistics</option>
                      <option value="R&D Kỹ Thuật Máy">R&D Kỹ Thuật Máy</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Chức vụ</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.ChucVu} onChange={e => setFormData({...formData, ChucVu: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Email</label>
                    <input type="email" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Số điện thoại</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.SDT} onChange={e => setFormData({...formData, SDT: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Ngày sinh</label>
                    <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.NgaySinh} onChange={e => setFormData({...formData, NgaySinh: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Trạng thái</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.TrangThai} onChange={e => setFormData({...formData, TrangThai: e.target.value})}>
                      <option value="Đang làm">Đang làm</option>
                      <option value="Đang nghỉ phép">Đang nghỉ phép</option>
                      <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mô tả công việc</label>
                    <textarea rows={3} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 resize-none" value={formData.MoTaCongViec} onChange={e => setFormData({...formData, MoTaCongViec: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer">Hủy</button>
                <button onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">Lưu thông tin</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
