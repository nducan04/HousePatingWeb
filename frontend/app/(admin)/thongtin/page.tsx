'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Building, Briefcase, Camera, Shield, Key, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

export default function ThongTinCaNhanPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const profile = {
    HoTen: user?.profile?.HoTen || user?.profile?.TenKhachHang || 'Nguyễn Văn Admin',
    Email: user?.profile?.Email || 'admin@vtsc.vn',
    SDT: user?.profile?.SDT || '0987.654.321',
    DiaChi: user?.profile?.DiaChi || '123 Đường Hải Phòng, Lê Chân, Hải Phòng',
    ChucVu: user?.profile?.ChucVu || (user?.role === 'Admin' ? 'Quản trị viên Hệ thống' : 'Người dùng'),
    BoPhan: 'Ban Giám Đốc',
  };

  return (
    <div className="max-w-none mx-auto px-6 py-8 space-y-10">
      {/* Header Profile */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border border-white/10 shadow-2xl">
        <div className="h-64 relative flex items-end px-8 pb-8">
          <div className="flex items-end gap-6 w-full">
            {/* Avatar bên trái */}
            <div className="relative group">
              <div className="w-36 h-36 rounded-3xl border-4 border-white bg-slate-800 flex items-center justify-center text-6xl font-bold text-white shadow-2xl overflow-hidden">
                {profile.HoTen.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase()}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white tracking-tight">{profile.HoTen}</h1>
              <p className="text-blue-300 flex items-center gap-2 font-medium mt-1">
                <Shield className="w-5 h-5" /> {user?.role || 'Admin'}
              </p>
            </div>


          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Menu */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-3 sticky top-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-6 py-5 rounded-2xl text-base font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <User className="w-5 h-5" />
              Hồ sơ cá nhân
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-6 py-5 rounded-2xl text-base font-medium transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <Key className="w-5 h-5" />
              Bảo mật & Mật khẩu
            </button>
          </div>
        </div>

        {/* Content - 2 Card Full Width */}
        <div className="flex-1 space-y-8">
          {activeTab === 'profile' ? (
            <>
              {/* Card 1: Thông tin liên hệ - FULL RỘNG */}
              <div className="bg-[#1e2937] border border-slate-700 rounded-3xl p-8 shadow-2xl w-full">
                <h3 className="text-2xl font-bold text-white mb-6">Thông tin liên hệ</h3>
                <p className="text-slate-400 mb-8">Cập nhật thông tin để hệ thống và đồng nghiệp dễ dàng liên hệ với bạn.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Họ và tên</label>
                    <input type="text" defaultValue={profile.HoTen} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Địa chỉ Email</label>
                    <input type="email" defaultValue={profile.Email} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Số điện thoại</label>
                    <input type="text" defaultValue={profile.SDT} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Địa chỉ</label>
                    <input type="text" defaultValue={profile.DiaChi} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>

              {/* Card 2: Công tác chuyên môn - FULL RỘNG */}
              <div className="bg-[#1e2937] border border-slate-700 rounded-3xl p-8 shadow-2xl w-full">
                <h3 className="text-2xl font-bold text-white mb-6">Công tác chuyên môn</h3>
                <p className="text-slate-400 mb-8">Thông tin chức vụ theo cơ cấu tổ chức.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Chức vụ</label>
                    <input type="text" defaultValue={profile.ChucVu} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-slate-300">Bộ phận / Phòng ban</label>
                    <input type="text" defaultValue={profile.BoPhan} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-semibold text-lg rounded-3xl shadow-xl transition-all active:scale-25">
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </button>
            </>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Đổi mật khẩu</h3>
                <p className="text-slate-400 mb-6">Mật khẩu mới phải chứa tối thiểu 8 ký tự, bao gồm chữ và số.</p>
                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <label className="text-base font-medium text-slate-300">Mật khẩu hiện tại</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-medium text-slate-300">Mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-medium text-slate-300">Xác nhận mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <button className="mt-8 w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl text-white font-semibold transition-all">
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}