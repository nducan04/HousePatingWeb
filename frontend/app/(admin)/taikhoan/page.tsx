'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Lock, Unlock, Users, UserCheck, ShieldCheck, UserX } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast, confirm } from '@/lib/utils/notification';

const API_URL = '/tai-khoan';

interface TaiKhoan {
  _id: string;
  TenDangNhap: string;
  Email: string;
  MatKhau?: string;
  VaiTro: string;
  TrangThai: boolean;
  NgayTao: string;
  HoTen?: string;
}

export default function QuanLyTaiKhoanPage() {
  const [taiKhoans, setTaiKhoans] = useState<TaiKhoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TaiKhoan>>({
    TenDangNhap: '',
    Email: '',
    VaiTro: 'NhanVien',
    TrangThai: true,
    HoTen: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [isEmployeeDetailsLoading, setIsEmployeeDetailsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) {
        setTaiKhoans(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tài khoản:', error);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: taiKhoans.length,
    active: taiKhoans.filter(t => t.TrangThai).length,
    admin: taiKhoans.filter(t => t.VaiTro === 'Admin').length,
    locked: taiKhoans.filter(t => !t.TrangThai).length,
  };

  const filteredData = taiKhoans.filter(tk => {
    const matchSearch = tk.TenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tk.Email && tk.Email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = filterRole === 'all' ||
      (filterRole === 'admin' && tk.VaiTro === 'Admin') ||
      (filterRole === 'nhanvien' && tk.VaiTro === 'NhanVien') ||
      (filterRole === 'khachhang' && tk.VaiTro.includes('KhachHang'));
    return matchSearch && matchRole;
  });

  const handleToggleLock = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`${API_URL}/${id}`, { TrangThai: !currentStatus });
      fetchData(); // reload data
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        console.error('Lỗi xóa:', error);
        toast.error('Không thể xóa tài khoản');
      }
    }
  };

  const openForm = (tk?: TaiKhoan) => {
    if (tk) setFormData({ ...tk, MatKhau: '', HoTen: '' });
    else setFormData({ TenDangNhap: '', Email: '', MatKhau: '', VaiTro: 'NhanVien', TrangThai: true, HoTen: '' });
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
      console.error('Lỗi lưu tài khoản:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi lưu tài khoản');
    }
  };

  const handleViewDetails = async (accountId: string) => {
    setIsEmployeeDetailsOpen(true);
    setIsEmployeeDetailsLoading(true);
    setEmployeeDetails(null);
    try {
      const res = await api.get(`/staff/account/${accountId}`);
      if (res.data.success) {
        setEmployeeDetails(res.data.data);
      }
    } catch (error: any) {
      console.error('Lỗi lấy thông tin nhân viên:', error);
      if (error.response?.status === 404) {
        setEmployeeDetails({ notFound: true });
      }
    } finally {
      setIsEmployeeDetailsLoading(false);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tài Khoản</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Cấp mới, phân quyền và giám sát trạng thái tài khoản của nhân sự, khách hàng và đối tác.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng tài khoản */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
            style={{ backgroundColor: '#2563eb12' }}
          ></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Tài Khoản</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.total} <span className="text-xs font-bold text-slate-400 ml-1">user</span>
              </h3>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: '#2563eb15', color: '#2563eb' }}
            >
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
            style={{ backgroundColor: '#05966912' }}
          ></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đang hoạt động</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.active} <span className="text-xs font-bold text-slate-400 ml-1">user</span>
              </h3>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: '#05966915', color: '#059669' }}
            >
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Quản trị viên */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
            style={{ backgroundColor: '#7c3aed12' }}
          ></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quản trị Admin</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.admin} <span className="text-xs font-bold text-slate-400 ml-1">user</span>
              </h3>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}
            >
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Bị khóa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
            style={{ backgroundColor: '#e11d4812' }}
          ></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bị khóa</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.locked} <span className="text-xs font-bold text-slate-400 ml-1">user</span>
              </h3>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: '#e11d4815', color: '#e11d48' }}
            >
              <UserX size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tìm user, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl overflow-x-auto max-w-full">
              {['all', 'admin', 'nhanvien', 'khachhang'].map(f => (
                <button
                  key={f}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer border-none ${
                    filterRole === f
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50 bg-transparent"
                  }`}
                  onClick={() => setFilterRole(f)}
                >
                  {f === 'all' ? 'Tất cả' : f === 'admin' ? 'Admin' : f === 'nhanvien' ? 'Nhân viên' : 'Khách hàng'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => openForm()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-none"
            >
              <Plus size={18} /> Cấp mới Tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tên Đăng Nhập</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Email</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Vai trò</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Ngày Tạo</th>
                <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-blue-600 font-bold">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                filteredData.map(tk => (
                  <tr key={tk._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span
                        className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline text-[14px]"
                        onClick={() => handleViewDetails(tk._id)}
                        title="Xem chi tiết hồ sơ nhân sự"
                      >
                        {tk.TenDangNhap}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-[14px]">{tk.Email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium text-[14px]">
                      {tk.VaiTro === 'KhachHangB2B' ? 'Doanh nghiệp B2B' : tk.VaiTro === 'KhachHangB2C' ? 'Cá nhân B2C' : tk.VaiTro}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${
                          tk.TrangThai
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        {tk.TrangThai ? 'Hoạt động' : 'Đang khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[13px] font-semibold">
                      {new Date(tk.NgayTao).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleToggleLock(tk._id, tk.TrangThai)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer border-none"
                          title={tk.TrangThai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {tk.TrangThai ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                        <button
                          onClick={() => openForm(tk)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border-none"
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(tk._id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer border-none"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={15} className="text-rose-500" />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                {formData._id ? <Edit size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                {formData._id ? 'Chỉnh Sửa Tài Khoản' : 'Cấp Mới Tài Khoản'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Tên Đăng Nhập</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                  value={formData.TenDangNhap || ''}
                  onChange={(e) => setFormData({ ...formData, TenDangNhap: e.target.value })}
                />
              </div>

              {!formData._id && (
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Họ và tên đầy đủ / Tên doanh nghiệp</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                    placeholder="Nhập họ tên đầy đủ hoặc tên doanh nghiệp"
                    value={formData.HoTen || ''}
                    onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Email</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                  value={formData.Email || ''}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                  Mật khẩu {formData._id ? '(Bỏ trống nếu không đổi)' : '(Mặc định: VTSC@123)'}
                </label>
                <input
                  type="password"
                  placeholder={formData._id ? "Nhập mật khẩu mới" : "VTSC@123"}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                  value={formData.MatKhau || ''}
                  onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Vai trò</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                  value={formData.VaiTro || 'NhanVien'}
                  onChange={(e) => setFormData({ ...formData, VaiTro: e.target.value })}
                >
                  <option value="Admin">Admin</option>
                  <option value="NhanVien">Nhân viên</option>
                  <option value="KhachHangB2B">Khách hàng B2B</option>
                  <option value="KhachHangB2C">Khách hàng B2C</option>
                  <option value="NhaCungCap">Nhà cung cấp</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Employee Details */}
      {isEmployeeDetailsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                <ShieldCheck size={20} className="text-blue-600" /> Hồ Sơ Nhân Sự Tài Khoản
              </h3>
              <button
                onClick={() => setIsEmployeeDetailsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {isEmployeeDetailsLoading ? (
                <div className="text-center py-10 text-blue-600 font-bold">Đang tải thông tin...</div>
              ) : employeeDetails?.notFound ? (
                <div className="text-center py-10 text-rose-500 font-bold">
                  Tài khoản này chưa được liên kết với hồ sơ nhân sự nào.
                </div>
              ) : employeeDetails ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-1/3">Họ và tên:</td>
                        <td className="py-3.5 font-bold text-slate-800">{employeeDetails.HoTen}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Giới tính:</td>
                        <td className="py-3.5 font-semibold text-slate-700">{employeeDetails.GioiTinh || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Số điện thoại:</td>
                        <td className="py-3.5 font-semibold text-slate-700">{employeeDetails.SDT || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Email liên hệ:</td>
                        <td className="py-3.5 font-semibold text-slate-700">{employeeDetails.Email || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Địa chỉ thường trú:</td>
                        <td className="py-3.5 font-semibold text-slate-700">{employeeDetails.DiaChi || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Phòng ban - Bộ phận:</td>
                        <td className="py-3.5 font-bold text-blue-600">{employeeDetails.BoPhan}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider">Chức vụ:</td>
                        <td className="py-3.5 font-bold text-slate-800">{employeeDetails.ChucVu}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-bold text-slate-400 text-[11px] uppercase tracking-wider vertical-align-top">Mô tả công việc:</td>
                        <td className="py-3.5 text-slate-600 font-medium leading-relaxed">{employeeDetails.MoTaCongViec || 'Chưa cập nhật'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex justify-center flex-shrink-0">
              <button
                onClick={() => setIsEmployeeDetailsOpen(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
