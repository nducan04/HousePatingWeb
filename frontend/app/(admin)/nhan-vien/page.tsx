'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Mail, Phone, ShieldCheck, TrendingUp, Award } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';

interface NhanVien {
  _id: string;
  MaNV: string;
  HoTen: string;
  ChucVu: string;
  Email: string;
  SDT: string;
  HieuSuatKPI: { diemKPI: number; tyLeMotDon: number; tyLeTestMau: number };
  AccountID?: { _id: string; TenDangNhap: string; VaiTro: string; TrangThai: boolean };
}

export default function NhanVienPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [nhanViens, setNhanViens] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Chặn truy cập nếu không phải Admin (nhưng ProtectedRoute layout cũng chặn rồi)
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchNhanVien = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await api.get(`/nhan-vien?${params.toString()}`);
      if (res.data.success) {
        setNhanViens(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching nhan vien:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchNhanVien();
    }
  }, [searchTerm, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân sự..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Sự</span>
        </button>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm italic">
        * Lưu ý: Khi tạo nhân viên mới, hệ thống tự động yêu cầu liên kết với một AccountID trong phân hệ Tài khoản. Modun Quản lý tài khoản đang được thi công hoàn thiện.
      </div>

      {/* DATAGRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Đang tải dữ liệu...</div>
        ) : nhanViens.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white/5 rounded-xl border border-white/5">
            Không tìm thấy dữ liệu nhân sự
          </div>
        ) : (
          nhanViens.map(nv => (
            <div key={nv._id} className="card p-0 overflow-hidden relative group">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 px-6 border-b border-white/5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white/5">
                      {nv.HoTen.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{nv.HoTen}</h3>
                      <div className="text-sm text-blue-400 font-medium">{nv.ChucVu}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{nv.MaNV}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Card */}
              <div className="p-5 px-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{nv.Email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{nv.SDT || 'Chưa cập nhật'}</span>
                  </div>
                  
                  {nv.AccountID && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>@{nv.AccountID.TenDangNhap}</span>
                        {nv.AccountID.TrangThai ? (
                           <span className="w-2 h-2 rounded-full bg-emerald-400" title="Hoạt động"></span>
                        ) : (
                           <span className="w-2 h-2 rounded-full bg-red-400" title="Khóa"></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* KPI Metrics */}
                <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.03]">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Điểm KPI
                    </div>
                    <div className="text-lg font-semibold text-white">{nv.HieuSuatKPI?.diemKPI || 0}</div>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.03]">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Tỷ lệ chốt
                    </div>
                    <div className="text-lg font-semibold text-white">{nv.HieuSuatKPI?.tyLeMotDon || 0}%</div>
                  </div>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white shadow-lg transition-colors border border-white/10"><Edit className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
