'use client';

import React, { useState, useEffect } from 'react';
import {
  User as UserIcon, Phone, Mail, MapPin, Calendar, Lock, Save, Loader2, Camera, Wallet
} from 'lucide-react';
import { useAuthStore, type User } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';

export default function ThongTinCaNhanPage() {
  const { user, loginState } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    wallet: '',
    jobTitle: '',
    department: '',
  });

  useEffect(() => {
    if (user && user.profile) {
      const p = user.profile;
      const isEmployee = user.role === 'Admin' || user.role === 'NhanVien';

      setFormData({
        displayName: isEmployee ? p.HoTen : p.TenKhachHang,
        email: p.Email || '',
        phone: p.SDT || '',
        address: p.DiaChi || '',
        dob: p.NgaySinh ? new Date(p.NgaySinh).toISOString().split('T')[0] : '',
        wallet: p.WalletAddress || '',
        jobTitle: p.ChucVu || '',
        department: p.BoPhan || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isEmployee = user?.role === 'Admin' || user?.role === 'NhanVien';
      const endpoint = isEmployee ? `/nhan-vien/${user?.profile?._id}` : `/khach-hang/${user?.profile?._id}`;

      const payload: any = {
        SDT: formData.phone,
        DiaChi: formData.address,
        NgaySinh: formData.dob,
        Email: formData.email,
      };

      if (isEmployee) {
        payload.HoTen = formData.displayName;
      } else {
        payload.TenKhachHang = formData.displayName;
        payload.WalletAddress = formData.wallet;
      }

      const res = await api.put(endpoint, payload);

      if (res.data.success) {
        // Update local store with new profile data
        const updatedUser: User = { ...user!, profile: res.data.data };
        // We use loginState to sync store, but we need the token too. 
        // Assuming we can get it from storage or just keep existing one.
        const token = localStorage.getItem('accessToken') || '';
        loginState(updatedUser, token);

        setSuccess('Cập nhật thông tin thành công!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Đang tải thông tin...</div>;

  const isEmployee = user.role === 'Admin' || user.role === 'NhanVien';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="glass-card overflow-hidden">
        {/* Header/Cover Profile Style */}
        <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white overflow-hidden shadow-2xl flex items-center justify-center text-4xl font-bold text-blue-600 uppercase" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0e7ff)' }}>
              {formData.displayName[0] || '?'}
            </div>
            <button className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-lg text-white shadow-lg hover:bg-blue-500 transition-colors">
              <Camera size={16} />
            </button>
          </div>
        </div>

        <div className="pt-20 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{formData.displayName}</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <span className="badge testing uppercase">{user.role}</span>
                {isEmployee && <span>• {formData.department}</span>}
                {!isEmployee && <span>• {user.profile?.MaKH}</span>}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary px-6 flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <UserIcon size={18} className="text-blue-600" /> Thông tin cơ bản
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Họ tên / Tên khách hàng</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="displayName"
                      className="form-input pl-10"
                      value={formData.displayName}
                      onChange={handleChange}
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Ngày sinh</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dob"
                      className="form-input pl-10"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  </div>
                </div>

                {isEmployee && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Phòng ban</label>
                      <input
                        type="text"
                        className="form-input opacity-70"
                        value={formData.department}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Chức vụ</label>
                      <input
                        type="text"
                        className="form-input opacity-70"
                        value={formData.jobTitle}
                        readOnly
                      />
                    </div>
                  </>
                )}

                {!isEmployee && user.role === 'KhachHangB2B' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Địa chỉ Ví Web3 (Blockchain)</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="wallet"
                        className="form-input pl-10 font-mono text-xs"
                        value={formData.wallet}
                        onChange={handleChange}
                        placeholder="0x..."
                      />
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Phone size={18} className="text-blue-600" /> Liên hệ & Địa chỉ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="phone"
                      className="form-input pl-10"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      className="form-input pl-10"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Địa chỉ hiện tại</label>
                  <div className="relative">
                    <textarea
                      name="address"
                      className="form-input pl-10 py-3 min-h-[100px]"
                      value={formData.address}
                      onChange={handleChange}
                    ></textarea>
                    <MapPin className="absolute left-3 top-4 text-slate-600" size={16} />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button type="button" className="text-blue-600 hover:text-blue-500 flex items-center gap-2 text-sm font-semibold transition-colors">
                  <Lock size={14} /> Đổi mật khẩu đăng nhập
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-8 text-center text-slate-500 text-sm">
        VTSC PaintPro System — Thông tin này được bảo mật và chỉ dùng cho mục đích quản lý nội bộ/đối tác.
      </p>
    </div>
  );
}